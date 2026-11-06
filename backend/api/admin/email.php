<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);
require_auth();   // never public

function get_email(): array {
    $r = db()->query('SELECT smtp_host, smtp_port, encryption, smtp_username, smtp_password, from_email, from_name FROM email_settings WHERE id = 1')->fetch();
    $r['smtp_port'] = (int)$r['smtp_port'];
    $r['has_password'] = !empty($r['smtp_password']);
    unset($r['smtp_password']);   // the password is never sent back to the browser
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'email' => get_email()]);

$in = request_json();
$host = trim((string)($in['smtp_host'] ?? ''));
$port = (int)($in['smtp_port'] ?? 0);
$enc  = (string)($in['encryption'] ?? 'tls');
$user = trim((string)($in['smtp_username'] ?? ''));
$pass = (string)($in['smtp_password'] ?? '');
$from = trim((string)($in['from_email'] ?? ''));
$name = trim((string)($in['from_name'] ?? ''));

$err = [];
if (!preg_match('/^[A-Za-z0-9.-]{1,190}$/', $host)) $err['smtp_host'] = 'Enter a valid host, e.g. smtp.gmail.com';
if ($port < 1 || $port > 65535) $err['smtp_port'] = 'Port must be 1-65535.';
if (!in_array($enc, ['none', 'ssl', 'tls'], true)) $err['encryption'] = 'Invalid encryption.';
if (strlen($user) > 190) $err['smtp_username'] = 'Too long.';
if (!filter_var($from, FILTER_VALIDATE_EMAIL) || strlen($from) > 190) $err['from_email'] = 'Enter a valid email address.';
if (mb_strlen($name) > 120) $err['from_name'] = 'Too long.';
if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);

db()->prepare('UPDATE email_settings SET smtp_host=?, smtp_port=?, encryption=?, smtp_username=?, from_email=?, from_name=? WHERE id=1')
    ->execute([$host, $port, $enc, $user, $from, $name]);
if ($pass !== '') {   // blank = keep existing password
    db()->prepare('UPDATE email_settings SET smtp_password=? WHERE id=1')->execute([encrypt_secret($pass)]);
}
json_out(['ok' => true, 'email' => get_email()]);
