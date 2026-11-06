<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

const ICONS = ['shield', 'document', 'bolt', 'users', 'star', 'lightbulb', 'briefcase', 'handshake'];
const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'hero';
$dirUrl = '/images/hero/';

function get_hero(string $dirUrl): array {
    $r = db()->query('SELECT * FROM hero_settings WHERE id = 1')->fetch();
    $r['show_card'] = (bool)$r['show_card'];
    $r['show_highlights'] = (bool)$r['show_highlights'];
    $r['card_points'] = json_decode((string)$r['card_points'], true) ?: [];
    $r['highlights'] = json_decode((string)$r['highlights'], true) ?: [];
    $r['bg_image_url'] = $r['bg_image'] ? $dirUrl . $r['bg_image'] . '?v=' . strtotime((string)$r['updated_at']) : '';
    unset($r['id']);
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'hero' => get_hero($dirUrl)]);   // public: the website hero reads this

require_auth();

$t = fn(string $k) => trim((string)($_POST[$k] ?? ''));
$f = [
    'eyebrow' => $t('eyebrow'), 'headline_1' => $t('headline_1'), 'headline_2' => $t('headline_2'), 'headline_3' => $t('headline_3'),
    'description' => trim((string)($_POST['description'] ?? '')),
    'btn1_label' => $t('btn1_label'), 'btn1_url' => $t('btn1_url'), 'btn2_label' => $t('btn2_label'), 'btn2_url' => $t('btn2_url'),
    'card_title' => $t('card_title'), 'card_text' => $t('card_text'),
];
$err = [];
foreach (['eyebrow' => 120, 'headline_1' => 120, 'headline_2' => 120, 'headline_3' => 120, 'btn1_label' => 60, 'btn2_label' => 60, 'card_title' => 160, 'card_text' => 300] as $k => $max) {
    if (mb_strlen($f[$k]) > $max) $err[$k] = "Max $max characters.";
}
if (mb_strlen($f['description']) > 1500) $err['description'] = 'Max 1500 characters.';
if ($f['headline_1'] === '' && $f['headline_2'] === '' && $f['headline_3'] === '') $err['headline_1'] = 'Enter at least one headline line.';
foreach ([['btn1_label', 'btn1_url'], ['btn2_label', 'btn2_url']] as [$l, $u]) {
    if ($f[$l] !== '' && (strlen($f[$u]) > 255 || !preg_match('#^(\#|/|https?://|mailto:|tel:)\S*$#i', $f[$u]))) {
        $err[$u] = 'Use a section like #contact, a path like /contact, or a full http(s) link.';
    }
}

// Card bullet points: list of short strings
$points = json_decode((string)($_POST['card_points'] ?? '[]'), true);
if (!is_array($points)) $points = [];
$points = array_values(array_filter(array_map(fn($p) => trim((string)$p), $points), fn($p) => $p !== ''));
if (count($points) > 8) $err['card_points'] = 'Maximum 8 points.';
foreach ($points as $p) if (mb_strlen($p) > 100) { $err['card_points'] = 'Each point: max 100 characters.'; break; }

// Highlights bar: list of {icon, label, title}
$hl = json_decode((string)($_POST['highlights'] ?? '[]'), true);
if (!is_array($hl)) $hl = [];
$clean = [];
foreach ($hl as $h) {
    $icon = (string)($h['icon'] ?? ''); $label = trim((string)($h['label'] ?? '')); $title = trim((string)($h['title'] ?? ''));
    if ($label === '' && $title === '') continue;
    if (!in_array($icon, ICONS, true)) $icon = 'shield';
    if (mb_strlen($label) > 40 || mb_strlen($title) > 80) { $err['highlights'] = 'Label max 40, text max 80 characters.'; break; }
    $clean[] = ['icon' => $icon, 'label' => $label, 'title' => $title];
}
if (count($clean) > 6) $err['highlights'] = 'Maximum 6 items.';

// Background image
$cur = db()->query('SELECT bg_image FROM hero_settings WHERE id = 1')->fetchColumn();
$newImg = $cur;
$uploaded = null;
$file = $_FILES['bg_image'] ?? null;
if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) {
        $err['bg_image'] = 'Upload failed or file larger than 2 MB. Please compress the image.';
    } else {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) {
            $err['bg_image'] = 'Allowed: JPG, PNG, WEBP.';
        } elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) {
            json_out(['ok' => false, 'message' => 'Cannot create the images/hero folder.'], 500);
        } else {
            $fn = 'hero-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
            if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
            else $err['bg_image'] = 'Could not save file.';
        }
    }
} elseif (!empty($_POST['remove_bg_image'])) {
    $newImg = '';
}

if ($err) {
    if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded);
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);
}

db()->prepare('UPDATE hero_settings SET eyebrow=?, headline_1=?, headline_2=?, headline_3=?, description=?, btn1_label=?, btn1_url=?, btn2_label=?, btn2_url=?,
    bg_image=?, show_card=?, card_title=?, card_text=?, card_points=?, show_highlights=?, highlights=? WHERE id=1')
    ->execute([$f['eyebrow'], $f['headline_1'], $f['headline_2'], $f['headline_3'], $f['description'], $f['btn1_label'], $f['btn1_url'], $f['btn2_label'], $f['btn2_url'],
        $newImg, !empty($_POST['show_card']) ? 1 : 0, $f['card_title'], $f['card_text'], json_encode($points, JSON_UNESCAPED_UNICODE),
        !empty($_POST['show_highlights']) ? 1 : 0, json_encode($clean, JSON_UNESCAPED_UNICODE)]);

if ($cur && $cur !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur));
json_out(['ok' => true, 'hero' => get_hero($dirUrl)]);
