<?php
require __DIR__ . '/../../includes/bootstrap.php';
require __DIR__ . '/../../includes/mailer.php';
api_init('POST');   // public: used from the sign-in page

$in = request_json();
$email = strtolower(trim((string)($in['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'message' => 'Please enter a valid email address.'], 422);
}

// Throttle: at most 3 requests per 10 minutes per browser session.
$_SESSION['fp_hits'] = array_values(array_filter($_SESSION['fp_hits'] ?? [], fn($t) => $t > time() - 600));
if (count($_SESSION['fp_hits']) >= 3) {
    json_out(['ok' => false, 'message' => 'Too many requests. Please try again in a few minutes.'], 429);
}
$_SESSION['fp_hits'][] = time();

// Same answer whether or not the address exists, so this cannot be used to discover accounts.
$generic = ['ok' => true, 'message' => 'If that email belongs to an active admin user, a reset link has been sent. Please check your inbox (and spam folder).'];

$st = db()->prepare("SELECT id, username, full_name FROM admins WHERE is_active = 1 AND email <> '' AND LOWER(email) = ? LIMIT 1");
$st->execute([$email]);
$admin = $st->fetch();
if (!$admin) { usleep(300000); json_out($generic); }

$token = bin2hex(random_bytes(32));
db()->prepare('DELETE FROM password_resets WHERE admin_id = ? OR expires_at < NOW()')->execute([$admin['id']]);
db()->prepare('INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 60 MINUTE))')
    ->execute([$admin['id'], hash('sha256', $token)]);

$base = cfg('app_url');
if ($base === '') {
    $https = !empty($_SERVER['HTTPS']) || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $base = ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost');
}
$link = $base . '/admin/reset-password?token=' . $token;
$who = htmlspecialchars($admin['full_name'] !== '' ? $admin['full_name'] : $admin['username'], ENT_QUOTES);

$html = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e6e1d3;border-radius:14px;overflow:hidden">'
    . '<div style="background:#0E1F38;color:#EDB445;padding:20px 26px;font-size:20px;letter-spacing:3px;font-weight:bold">JBM</div>'
    . '<div style="padding:26px;color:#0E1F38;font-size:15px;line-height:1.6">'
    . "<p>Hello $who,</p><p>We received a request to reset your admin password. This link works for 60 minutes.</p>"
    . '<p style="margin:26px 0"><a href="' . htmlspecialchars($link, ENT_QUOTES) . '" style="background:#EDB445;color:#0E1F38;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:10px;display:inline-block">Reset password</a></p>'
    . '<p style="color:#6b7686;font-size:13px">If you did not ask for this, you can ignore this email; your password will not change.</p></div></div>';
$text = "Hello,\n\nUse this link to reset your admin password (valid for 60 minutes):\n$link\n\nIf you did not ask for this, ignore this email.";

$err = send_mail($email, 'Reset your JBM admin password', $html, $text);
if ($err) error_log('JBM password reset email failed: ' . $err);

json_out($generic);
