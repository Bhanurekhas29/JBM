<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'cta';
$dirUrl = '/images/cta/';

function get_cta(string $dirUrl): array {
    $r = db()->query('SELECT * FROM cta_banner WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    $r['button_new_tab'] = (bool)$r['button_new_tab'];
    $r['bg_image_url'] = $r['bg_image'] ? $dirUrl . $r['bg_image'] . '?v=' . strtotime((string)$r['updated_at']) : '';
    unset($r['id']);
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'cta' => get_cta($dirUrl)]);   // public: the website banner reads this

require_auth();

$t = fn(string $k) => trim((string)($_POST[$k] ?? ''));
$f = ['tagline' => $t('tagline'), 'heading_before' => $t('heading_before'), 'heading_gold' => $t('heading_gold'), 'heading_after' => $t('heading_after'),
      'description' => trim((string)($_POST['description'] ?? '')), 'button_label' => $t('button_label'), 'button_url' => $t('button_url')];
$err = [];
foreach (['tagline' => 200, 'heading_before' => 120, 'heading_gold' => 120, 'heading_after' => 120, 'button_label' => 60] as $k => $max) {
    if (mb_strlen($f[$k]) > $max) $err[$k] = "Max $max characters.";
}
if ($f['heading_before'] === '' && $f['heading_gold'] === '' && $f['heading_after'] === '') $err['heading_before'] = 'Enter a heading.';
if (mb_strlen($f['description']) > 500) $err['description'] = 'Max 500 characters.';
if ($f['button_label'] !== '' && (strlen($f['button_url']) > 255 || !preg_match('#^(\#|/|https?://|mailto:|tel:)\S*$#i', $f['button_url']))) {
    $err['button_url'] = 'Use a section like #contact, a path like /contact, or a full http(s) link.';
}

$cur = db()->query('SELECT bg_image FROM cta_banner WHERE id = 1')->fetchColumn();
$newImg = $cur;
$uploaded = null;
$file = $_FILES['bg_image'] ?? null;
if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) $err['bg_image'] = 'Upload failed or file larger than 2 MB. Please compress the image.';
    else {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) $err['bg_image'] = 'Allowed: JPG, PNG, WEBP.';
        elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/cta folder.'], 500);
        else {
            $fn = 'cta-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
            if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
            else $err['bg_image'] = 'Could not save file.';
        }
    }
} elseif (!empty($_POST['remove_bg_image'])) $newImg = '';

if ($err) {
    if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded);
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);
}

db()->prepare('UPDATE cta_banner SET show_section=?, tagline=?, heading_before=?, heading_gold=?, heading_after=?, description=?, button_label=?, button_url=?, button_new_tab=?, bg_image=? WHERE id=1')
    ->execute([!empty($_POST['show_section']) ? 1 : 0, $f['tagline'], $f['heading_before'], $f['heading_gold'], $f['heading_after'], $f['description'],
               $f['button_label'], $f['button_url'], !empty($_POST['button_new_tab']) ? 1 : 0, $newImg]);
if ($cur && $cur !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur));
json_out(['ok' => true, 'cta' => get_cta($dirUrl)]);
