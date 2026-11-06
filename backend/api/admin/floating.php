<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

function get_floating(): array {
    $r = db()->query('SELECT * FROM floating_icons WHERE id = 1')->fetch();
    foreach (['show_whatsapp', 'show_call'] as $k) $r[$k] = (bool)$r[$k];
    $digits = preg_replace('/\D+/', '', (string)$r['whatsapp_number']);
    $r['whatsapp_url'] = $digits !== '' ? 'https://wa.me/' . $digits . ($r['whatsapp_message'] !== '' ? '?text=' . rawurlencode($r['whatsapp_message']) : '') : '';
    $r['call_url'] = $r['call_number'] !== '' ? 'tel:' . preg_replace('/[^\d+]/', '', (string)$r['call_number']) : '';
    unset($r['id'], $r['updated_at']);
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'floating' => get_floating()]);   // public: the website reads this

require_auth();
$in = request_json();
$s = fn(string $k) => trim((string)($in[$k] ?? ''));

$wa = $s('whatsapp_number'); $waMsg = $s('whatsapp_message'); $call = $s('call_number'); $pos = $s('position');
$showWa = !empty($in['show_whatsapp']); $showCall = !empty($in['show_call']);
$err = [];
if ($wa !== '') {
    $digits = preg_replace('/\D+/', '', $wa);
    if (!preg_match('/^\+?[0-9\s().-]{8,25}$/', $wa) || strlen($digits) < 8 || strlen($digits) > 15) $err['whatsapp_number'] = 'Enter the number with country code, e.g. +91 98765 43210.';
}
if ($showWa && $wa === '') $err['whatsapp_number'] = 'Enter a WhatsApp number to show this icon.';
if (mb_strlen($waMsg) > 300) $err['whatsapp_message'] = 'Max 300 characters.';
if ($call !== '' && !preg_match('/^\+?[0-9\s().-]{6,25}$/', $call)) $err['call_number'] = 'Enter a valid phone number.';
if ($showCall && $call === '') $err['call_number'] = 'Enter a phone number to show this icon.';
if (!in_array($pos, ['right', 'left'], true)) $err['position'] = 'Choose left or right.';
if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);

db()->prepare('UPDATE floating_icons SET show_whatsapp=?, whatsapp_number=?, whatsapp_message=?, show_call=?, call_number=?, position=? WHERE id=1')
    ->execute([$showWa ? 1 : 0, $wa, $waMsg, $showCall ? 1 : 0, $call, $pos]);
json_out(['ok' => true, 'floating' => get_floating()]);
