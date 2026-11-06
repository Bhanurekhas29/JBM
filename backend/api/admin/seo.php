<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

function get_seo(): array {
    $r = db()->query('SELECT meta_title, meta_description, primary_keywords, secondary_keywords, updated_at FROM seo WHERE id = 1')->fetch();
    $r = $r ?: ['meta_title' => '', 'meta_description' => '', 'primary_keywords' => '', 'secondary_keywords' => '', 'updated_at' => null];
    $r['primary_keywords'] = (string)$r['primary_keywords'];
    $r['secondary_keywords'] = (string)$r['secondary_keywords'];
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'seo' => get_seo()]);   // public: used by the website <head>

require_auth();
$in = request_json();
$title = trim((string)($in['meta_title'] ?? ''));
$desc  = trim((string)($in['meta_description'] ?? ''));
$prim  = trim((string)($in['primary_keywords'] ?? ''));
$sec   = trim((string)($in['secondary_keywords'] ?? ''));

$err = [];
if ($title === '' || mb_strlen($title) > 255) $err['meta_title'] = 'Meta title is required (max 255 characters).';
if (mb_strlen($desc) > 500) $err['meta_description'] = 'Max 500 characters.';
if (mb_strlen($prim) > 2000) $err['primary_keywords'] = 'Too long.';
if (mb_strlen($sec) > 2000) $err['secondary_keywords'] = 'Too long.';
if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);

db()->prepare('UPDATE seo SET meta_title=?, meta_description=?, primary_keywords=?, secondary_keywords=? WHERE id=1')
    ->execute([$title, $desc, $prim, $sec]);
json_out(['ok' => true, 'seo' => get_seo()]);
