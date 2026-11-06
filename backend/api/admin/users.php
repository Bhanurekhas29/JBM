<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$me = require_auth();
$method = $_SERVER['REQUEST_METHOD'];

const USER_COLS = 'id, username, full_name, email, is_active, is_superuser, last_login, created_at';

function validate(array $in, bool $creating): array {
    $err = [];
    $username = trim((string)($in['username'] ?? ''));
    $full = trim((string)($in['full_name'] ?? ''));
    $email = trim((string)($in['email'] ?? ''));
    $pass = (string)($in['password'] ?? '');

    if (!preg_match('/^[A-Za-z0-9_.@-]{3,60}$/', $username)) $err['username'] = '3-60 characters: letters, numbers and _ . @ - only.';
    if (strlen($full) > 100) $err['full_name'] = 'Too long.';
    if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150)) $err['email'] = 'Enter a valid email.';
    if ($creating || $pass !== '') {
        if (strlen($pass) < 8) $err['password'] = 'Password must be at least 8 characters.';
    }
    if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);
    return [$username, $full, $email, $pass, !empty($in['is_active']) ? 1 : 0];
}

function username_taken(string $u, int $exceptId = 0): bool {
    $st = db()->prepare('SELECT 1 FROM admins WHERE username = ? AND id <> ?');
    $st->execute([$u, $exceptId]);
    return (bool)$st->fetchColumn();
}

if ($method === 'GET') {
    $rows = db()->query('SELECT ' . USER_COLS . ' FROM admins ORDER BY id')->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['is_active'] = (bool)$r['is_active']; $r['is_superuser'] = (bool)$r['is_superuser']; $r['is_me'] = $r['id'] === $me; }
    json_out(['ok' => true, 'users' => $rows]);
}

$in = request_json();

if ($method === 'POST') {
    [$username, $full, $email, $pass, $active] = validate($in, true);
    if (username_taken($username)) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => ['username' => 'Username already exists.']], 422);
    db()->prepare('INSERT INTO admins (username, password_hash, full_name, email, is_active) VALUES (?,?,?,?,?)')
        ->execute([$username, password_hash($pass, PASSWORD_DEFAULT), $full, $email, $active]);
    json_out(['ok' => true], 201);
}

$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT id, username, is_superuser FROM admins WHERE id = ?');
$st->execute([$id]);
$target = $st->fetch();
if (!$target) json_out(['ok' => false, 'message' => 'User not found.'], 404);

// The main admin (superuser) can never be deactivated, deleted or renamed, and only they can edit it.
$isSuper = (bool)$target['is_superuser'];
if ($isSuper) {
    $st = db()->prepare('SELECT is_superuser FROM admins WHERE id = ?');
    $st->execute([$me]);
    if (!(int)$st->fetchColumn()) json_out(['ok' => false, 'message' => 'Only the main admin can modify this account.'], 403);
    if ($method === 'DELETE') json_out(['ok' => false, 'message' => 'The main admin account cannot be deleted.'], 422);
    if ($method === 'PUT' && !empty($in['toggle'])) json_out(['ok' => false, 'message' => 'The main admin account cannot be deactivated.'], 422);
}

if ($method === 'PUT' && !empty($in['toggle'])) {
    if ($id === $me) json_out(['ok' => false, 'message' => 'You cannot deactivate your own account.'], 422);
    db()->prepare('UPDATE admins SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

if ($method === 'PUT') {
    if ($isSuper) { $in['username'] = $target['username']; $in['is_active'] = true; }   // locked fields
    [$username, $full, $email, $pass, $active] = validate($in, false);
    if ($id === $me && !$active) json_out(['ok' => false, 'message' => 'You cannot deactivate your own account.'], 422);
    if (username_taken($username, $id)) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => ['username' => 'Username already exists.']], 422);
    db()->prepare('UPDATE admins SET username=?, full_name=?, email=?, is_active=? WHERE id=?')->execute([$username, $full, $email, $active, $id]);
    if ($pass !== '') db()->prepare('UPDATE admins SET password_hash=? WHERE id=?')->execute([password_hash($pass, PASSWORD_DEFAULT), $id]);
    if ($id === $me) $_SESSION['admin_username'] = $username;
    json_out(['ok' => true]);
}

if ($method === 'DELETE') {
    if ($id === $me) json_out(['ok' => false, 'message' => 'You cannot delete your own account.'], 422);
    db()->prepare('DELETE FROM admins WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
