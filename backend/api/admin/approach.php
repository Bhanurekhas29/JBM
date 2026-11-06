<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

const ICONS = ['target', 'layers', 'trend', 'shield', 'handshake', 'lightbulb', 'users', 'check'];
const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'approach';
$dirUrl = '/images/approach/';

function get_approach(string $dirUrl): array {
    $r = db()->query('SELECT * FROM approach WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    $r['button_new_tab'] = (bool)$r['button_new_tab'];
    $r['features'] = json_decode((string)$r['features'], true) ?: [];
    $r['image_url'] = $r['image'] ? $dirUrl . $r['image'] . '?v=' . strtotime((string)$r['updated_at']) : '';
    unset($r['id']);
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'approach' => get_approach($dirUrl)]);   // public: the website section reads this

require_auth();

$t = fn(string $k) => trim((string)($_POST[$k] ?? ''));
$f = ['eyebrow' => $t('eyebrow'), 'heading_before' => $t('heading_before'), 'heading_gold' => $t('heading_gold'),
      'description' => trim((string)($_POST['description'] ?? '')), 'image_caption' => $t('image_caption'),
      'button_label' => $t('button_label'), 'button_url' => $t('button_url')];
$err = [];
foreach (['eyebrow' => 120, 'heading_before' => 150, 'heading_gold' => 150, 'image_caption' => 80, 'button_label' => 60] as $k => $max) {
    if (mb_strlen($f[$k]) > $max) $err[$k] = "Max $max characters.";
}
if ($f['heading_before'] === '' && $f['heading_gold'] === '') $err['heading_before'] = 'Enter a heading.';
if (mb_strlen($f['description']) > 1500) $err['description'] = 'Max 1500 characters.';
if ($f['button_label'] !== '' && (strlen($f['button_url']) > 255 || !preg_match('#^(\#|/|https?://|mailto:|tel:)\S*$#i', $f['button_url']))) {
    $err['button_url'] = 'Use a section like #contact, a path like /contact, or a full http(s) link.';
}

// Feature columns: list of {icon, title, text}
$feat = json_decode((string)($_POST['features'] ?? '[]'), true);
if (!is_array($feat)) $feat = [];
$clean = [];
foreach ($feat as $x) {
    $icon = (string)($x['icon'] ?? ''); $title = trim((string)($x['title'] ?? '')); $text = trim((string)($x['text'] ?? ''));
    if ($title === '' && $text === '') continue;
    if (!in_array($icon, ICONS, true)) $icon = 'check';
    if (mb_strlen($title) > 60 || mb_strlen($text) > 200) { $err['features'] = 'Title max 60, text max 200 characters.'; break; }
    $clean[] = ['icon' => $icon, 'title' => $title, 'text' => $text];
}
if (count($clean) > 4) $err['features'] = 'Maximum 4 items.';

$cur = db()->query('SELECT image FROM approach WHERE id = 1')->fetchColumn();
$newImg = $cur;
$uploaded = null;
$file = $_FILES['image'] ?? null;
if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) $err['image'] = 'Upload failed or file larger than 2 MB.';
    else {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) $err['image'] = 'Allowed: JPG, PNG, WEBP.';
        elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/approach folder.'], 500);
        else {
            $fn = 'approach-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
            if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
            else $err['image'] = 'Could not save file.';
        }
    }
} elseif (!empty($_POST['remove_image'])) $newImg = '';

if ($err) {
    if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded);
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);
}

db()->prepare('UPDATE approach SET show_section=?, eyebrow=?, heading_before=?, heading_gold=?, description=?, image=?, image_caption=?, features=?, button_label=?, button_url=?, button_new_tab=? WHERE id=1')
    ->execute([!empty($_POST['show_section']) ? 1 : 0, $f['eyebrow'], $f['heading_before'], $f['heading_gold'], $f['description'], $newImg, $f['image_caption'],
               json_encode($clean, JSON_UNESCAPED_UNICODE), $f['button_label'], $f['button_url'], !empty($_POST['button_new_tab']) ? 1 : 0]);
if ($cur && $cur !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur));
json_out(['ok' => true, 'approach' => get_approach($dirUrl)]);
