<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

function get_header(): array {
    $r = db()->query('SELECT show_topbar, topbar_left, topbar_right, show_cta, cta_label, cta_url, cta_new_tab FROM header_settings WHERE id = 1')->fetch();
    foreach (['show_topbar', 'show_cta', 'cta_new_tab'] as $k) $r[$k] = (bool)$r[$k];
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'header' => get_header()]);   // public: the website header reads this

require_auth();
$in = request_json();
$left  = trim((string)($in['topbar_left'] ?? ''));
$right = trim((string)($in['topbar_right'] ?? ''));
$label = trim((string)($in['cta_label'] ?? ''));
$url   = trim((string)($in['cta_url'] ?? ''));
$showCta = !empty($in['show_cta']);

$err = [];
if (mb_strlen($left) > 255) $err['topbar_left'] = 'Max 255 characters.';
if (mb_strlen($right) > 255) $err['topbar_right'] = 'Max 255 characters.';
if (mb_strlen($label) > 60) $err['cta_label'] = 'Max 60 characters.';
if ($showCta && $label === '') $err['cta_label'] = 'Button label is required while the button is shown.';
if (($showCta || $url !== '') && (strlen($url) > 255 || !preg_match('#^(\#|/|https?://|mailto:|tel:)\S*$#i', $url))) {
    $err['cta_url'] = 'Use a section like #contact, a path like /contact, or a full http(s) link.';
}
if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);

db()->prepare('UPDATE header_settings SET show_topbar=?, topbar_left=?, topbar_right=?, show_cta=?, cta_label=?, cta_url=?, cta_new_tab=? WHERE id=1')
    ->execute([!empty($in['show_topbar']) ? 1 : 0, $left, $right, $showCta ? 1 : 0, $label, $url, !empty($in['cta_new_tab']) ? 1 : 0]);
json_out(['ok' => true, 'header' => get_header()]);
