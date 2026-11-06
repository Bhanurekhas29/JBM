<?php
// PUBLIC endpoint: the website's enquiry form posts here. No login required.
require __DIR__ . '/../includes/bootstrap.php';
api_init('POST');

$in = request_json();

// Honeypot: real visitors never fill this hidden field; bots do. Pretend success and store nothing.
if (trim((string)($in['company_site'] ?? '')) !== '') json_out(['ok' => true]);

$name    = trim((string)($in['name'] ?? ''));
$email   = trim((string)($in['email'] ?? ''));
$phone   = preg_replace('/[\s().-]+/', '', trim((string)($in['phone'] ?? '')));   // drop spaces/dashes, keep digits and a leading +
$org     = trim((string)($in['organization'] ?? ''));
$service = trim((string)($in['service'] ?? ''));
$message = trim((string)($in['message'] ?? ''));

$err = [];
if ($name === '' || mb_strlen($name) > 100) $err['name'] = 'Please enter your name.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) $err['email'] = 'Please enter a valid email address.';
if (!preg_match('/^\+?[0-9]{8,15}$/', $phone)) $err['phone'] = 'Please enter a valid mobile number (numbers only).';
if (mb_strlen($org) > 150) $err['organization'] = 'Too long.';
if (empty($in['consent'])) $err['consent'] = 'Please tick the box to continue.';
if (mb_strlen($service) > 100) $err['service'] = 'Too long.';
elseif ($service !== '') {   // must be one of the dropdown options set in the admin (Contact page)
    $opts = json_decode((string)db()->query('SELECT service_options FROM contact_section WHERE id = 1')->fetchColumn(), true) ?: [];
    if ($opts && !in_array($service, $opts, true)) $err['service'] = 'Please choose a service from the list.';
}
if ($message === '' || mb_strlen($message) > 2000) $err['message'] = 'Please enter your message (max 2000 characters).';
if ($err) json_out(['ok' => false, 'message' => 'Please check the form.', 'errors' => $err], 422);

// Simple abuse limit: 5 enquiries per IP per hour.
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
$st = db()->prepare('SELECT COUNT(*) FROM enquiries WHERE ip = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
$st->execute([$ip]);
if ((int)$st->fetchColumn() >= 5) json_out(['ok' => false, 'message' => 'Too many enquiries. Please try again later.'], 429);

db()->prepare('INSERT INTO enquiries (name, email, phone, service, organization, message, ip) VALUES (?,?,?,?,?,?,?)')
    ->execute([$name, $email, $phone, $service, $org, $message, $ip]);
$ok = (string)db()->query('SELECT success_message FROM contact_section WHERE id = 1')->fetchColumn();
json_out(['ok' => true, 'message' => $ok !== '' ? $ok : 'Thank you! We will get back to you shortly.'], 201);
