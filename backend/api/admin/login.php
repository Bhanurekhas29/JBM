<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init('POST');

// Basic brute-force throttle: 5 failures -> 5 minute lock (per session).
$now = time();
if (($_SESSION['lock_until'] ?? 0) > $now) {
    json_out(['ok' => false, 'message' => 'Too many attempts. Try again in a few minutes.'], 429);
}

$in = request_json();
$username = trim((string)($in['username'] ?? ''));
$password = (string)($in['password'] ?? '');

if ($username === '' || $password === '') {
    json_out(['ok' => false, 'message' => 'Username or email and password are required.'], 422);
}

try {
    // Sign in with either the username or the email address saved on the user.
    $st = db()->prepare("SELECT id, username, password_hash, last_login, is_active FROM admins WHERE username = ? OR (email <> '' AND email = ?) ORDER BY (username = ?) DESC LIMIT 1");
    $st->execute([$username, $username, $username]);
    $admin = $st->fetch();
} catch (Throwable $e) {
    json_out(['ok' => false, 'message' => 'Database unavailable. Check backend/config/config.php.'], 500);
}

if (!$admin || !$admin['is_active'] || !password_verify($password, $admin['password_hash'])) {
    $_SESSION['fails'] = ($_SESSION['fails'] ?? 0) + 1;
    if ($_SESSION['fails'] >= 5) { $_SESSION['lock_until'] = $now + 300; $_SESSION['fails'] = 0; }
    usleep(400000);
    json_out(['ok' => false, 'message' => 'Invalid username/email or password.'], 401);
}

session_regenerate_id(true);
$_SESSION['fails'] = 0;
$_SESSION['admin_id'] = (int)$admin['id'];
$_SESSION['admin_username'] = $admin['username'];
$_SESSION['prev_login'] = $admin['last_login'];
db()->prepare('UPDATE admins SET last_login = NOW() WHERE id = ?')->execute([$admin['id']]);

json_out(['ok' => true, 'user' => ['id' => (int)$admin['id'], 'username' => $admin['username'], 'last_login' => $admin['last_login']]]);
