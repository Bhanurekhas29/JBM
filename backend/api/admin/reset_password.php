<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);   // public: opened from the emailed link

function find_reset(string $token): ?array {
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) return null;
    $st = db()->prepare('SELECT r.id, r.admin_id, a.username FROM password_resets r JOIN admins a ON a.id = r.admin_id
                         WHERE r.token_hash = ? AND r.expires_at > NOW() AND a.is_active = 1 LIMIT 1');
    $st->execute([hash('sha256', $token)]);
    return $st->fetch() ?: null;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $r = find_reset((string)($_GET['token'] ?? ''));
    if (!$r) json_out(['ok' => false, 'message' => 'This reset link is invalid or has expired. Please request a new one.'], 400);
    json_out(['ok' => true]);
}

$in = request_json();
$r = find_reset((string)($in['token'] ?? ''));
if (!$r) json_out(['ok' => false, 'message' => 'This reset link is invalid or has expired. Please request a new one.'], 400);

$pass = (string)($in['password'] ?? '');
if (strlen($pass) < 8) json_out(['ok' => false, 'message' => 'Password must be at least 8 characters.', 'errors' => ['password' => 'Password must be at least 8 characters.']], 422);
if (strlen($pass) > 200) json_out(['ok' => false, 'message' => 'Password is too long.'], 422);

db()->prepare('UPDATE admins SET password_hash = ? WHERE id = ?')->execute([password_hash($pass, PASSWORD_DEFAULT), $r['admin_id']]);
db()->prepare('DELETE FROM password_resets WHERE admin_id = ?')->execute([$r['admin_id']]);
json_out(['ok' => true, 'message' => 'Your password has been changed. You can sign in now.']);
