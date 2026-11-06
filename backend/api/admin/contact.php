<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

const ICONS = ['bolt', 'shield', 'users', 'check', 'lightbulb', 'handshake', 'chat', 'document'];
const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'contact';
$dirUrl = '/images/contact/';

function get_contact(string $dirUrl): array {
    $r = db()->query('SELECT * FROM contact_section WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    $r['points'] = json_decode((string)$r['points'], true) ?: [];
    $r['service_options'] = json_decode((string)$r['service_options'], true) ?: [];
    $r['image_url'] = $r['image'] ? $dirUrl . $r['image'] . '?v=' . strtotime((string)$r['updated_at']) : '';
    unset($r['id']);
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'contact' => get_contact($dirUrl)]);   // public: the website contact section reads this

require_auth();

$t = fn(string $k) => trim((string)($_POST[$k] ?? ''));
$f = ['eyebrow' => $t('eyebrow'), 'heading_before' => $t('heading_before'), 'heading_gold' => $t('heading_gold'),
      'description' => trim((string)($_POST['description'] ?? '')), 'form_title' => $t('form_title'), 'form_subtitle' => $t('form_subtitle'),
      'consent_text' => trim((string)($_POST['consent_text'] ?? '')), 'button_label' => $t('button_label'), 'success_message' => $t('success_message')];
$err = [];
foreach (['eyebrow' => 60, 'heading_before' => 120, 'heading_gold' => 120, 'form_title' => 150, 'form_subtitle' => 250, 'button_label' => 40, 'success_message' => 250] as $k => $max) {
    if (mb_strlen($f[$k]) > $max) $err[$k] = "Max $max characters.";
}
if ($f['heading_before'] === '' && $f['heading_gold'] === '') $err['heading_before'] = 'Enter a heading.';
if (mb_strlen($f['description']) > 600) $err['description'] = 'Max 600 characters.';
if (mb_strlen($f['consent_text']) > 500) $err['consent_text'] = 'Max 500 characters.';
if ($f['button_label'] === '') $err['button_label'] = 'The form needs a button label.';

// Points under the description: list of {icon, title, text}
$pts = json_decode((string)($_POST['points'] ?? '[]'), true);
if (!is_array($pts)) $pts = [];
$points = [];
foreach ($pts as $x) {
    $icon = (string)($x['icon'] ?? ''); $title = trim((string)($x['title'] ?? '')); $text = trim((string)($x['text'] ?? ''));
    if ($title === '' && $text === '') continue;
    if (!in_array($icon, ICONS, true)) $icon = 'check';
    if (mb_strlen($title) > 60 || mb_strlen($text) > 200) { $err['points'] = 'Title max 60, text max 200 characters.'; break; }
    $points[] = ['icon' => $icon, 'title' => $title, 'text' => $text];
}
if (count($points) > 4) $err['points'] = 'Maximum 4 items.';

// Service dropdown options: list of strings, order kept, duplicates removed
$opts = json_decode((string)($_POST['service_options'] ?? '[]'), true);
if (!is_array($opts)) $opts = [];
$options = [];
foreach ($opts as $o) {
    $o = trim((string)$o);
    if ($o === '') continue;
    if (mb_strlen($o) > 100) { $err['service_options'] = 'Each option: max 100 characters.'; break; }
    if (!in_array($o, $options, true)) $options[] = $o;
}
if (count($options) > 20) $err['service_options'] = 'Maximum 20 options.';

$cur = db()->query('SELECT image FROM contact_section WHERE id = 1')->fetchColumn();
$newImg = $cur; $uploaded = null;
$file = $_FILES['image'] ?? null;
if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) $err['image'] = 'Upload failed or file larger than 2 MB.';
    else {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) $err['image'] = 'Allowed: JPG, PNG, WEBP.';
        elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/contact folder.'], 500);
        else {
            $fn = 'contact-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
            if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
            else $err['image'] = 'Could not save file.';
        }
    }
} elseif (!empty($_POST['remove_image'])) $newImg = '';

if ($err) {
    if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded);
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);
}

db()->prepare('UPDATE contact_section SET show_section=?, eyebrow=?, heading_before=?, heading_gold=?, description=?, image=?, points=?, form_title=?, form_subtitle=?, consent_text=?, button_label=?, success_message=?, service_options=? WHERE id=1')
    ->execute([!empty($_POST['show_section']) ? 1 : 0, $f['eyebrow'], $f['heading_before'], $f['heading_gold'], $f['description'], $newImg,
               json_encode($points, JSON_UNESCAPED_UNICODE), $f['form_title'], $f['form_subtitle'], $f['consent_text'], $f['button_label'], $f['success_message'],
               json_encode($options, JSON_UNESCAPED_UNICODE)]);
if ($cur && $cur !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur));
json_out(['ok' => true, 'contact' => get_contact($dirUrl)]);
