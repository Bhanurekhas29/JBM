<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

const MAX_BYTES = 2 * 1024 * 1024;
const FIELDS = ['header_logo', 'footer_logo', 'favicon'];
const MIME_EXT = [
    'image/png' => 'png', 'image/jpeg' => 'jpg', 'image/webp' => 'webp', 'image/gif' => 'gif',
    'image/x-icon' => 'ico', 'image/vnd.microsoft.icon' => 'ico',
];
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'brand';
$dirUrl = '/images/brand/';

function get_brand(): array {
    $r = db()->query('SELECT website_name, header_logo, footer_logo, favicon, show_credits, credits_url, company_name, company_descriptor, tagline, updated_at FROM brand WHERE id = 1')->fetch();
    return $r ?: ['website_name' => '', 'header_logo' => '', 'footer_logo' => '', 'favicon' => '', 'show_credits' => 1, 'credits_url' => '', 'company_name' => '', 'company_descriptor' => '', 'tagline' => '', 'updated_at' => null];
}
function with_urls(array $b, string $dirUrl): array {
    foreach (FIELDS as $f) $b[$f . '_url'] = $b[$f] ? $dirUrl . $b[$f] . '?v=' . strtotime((string)$b['updated_at']) : '';
    $b['show_credits'] = (bool)$b['show_credits'];
    return $b;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {   // public: the website needs this too
    json_out(['ok' => true, 'brand' => with_urls(get_brand(), $dirUrl)]);
}

require_auth();
$name = trim((string)($_POST['website_name'] ?? ''));
if ($name === '' || mb_strlen($name) > 120) {
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => ['website_name' => 'Website name is required (max 120 characters).']], 422);
}

$creditsUrl = trim((string)($_POST['credits_url'] ?? ''));
if ($creditsUrl !== '' && (strlen($creditsUrl) > 255 || !preg_match('#^https?://#i', $creditsUrl) || !filter_var($creditsUrl, FILTER_VALIDATE_URL))) {
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => ['credits_url' => 'Enter a full link starting with http:// or https://']], 422);
}

$companyName = trim((string)($_POST['company_name'] ?? ''));
$descriptor = trim((string)($_POST['company_descriptor'] ?? ''));
$tagline = trim((string)($_POST['tagline'] ?? ''));
$cErr = [];
if (mb_strlen($companyName) > 100) $cErr['company_name'] = 'Max 100 characters.';
if (mb_strlen($descriptor) > 120) $cErr['company_descriptor'] = 'Max 120 characters.';
if (mb_strlen($tagline) > 120) $cErr['tagline'] = 'Max 120 characters.';
if ($cErr) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $cErr], 422);

$current = get_brand();
$new = [];
$errors = [];
$uploaded = [];
if (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/brand folder.'], 500);

foreach (FIELDS as $f) {
    $new[$f] = $current[$f];
    $file = $_FILES[$f] ?? null;
    if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_BYTES) { $errors[$f] = 'Upload failed or file larger than 2 MB.'; continue; }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset(MIME_EXT[$mime]) || ($mime !== 'image/x-icon' && $mime !== 'image/vnd.microsoft.icon' && !@getimagesize($file['tmp_name']))) {
            $errors[$f] = 'Allowed: PNG, JPG, WEBP, GIF' . ($f === 'favicon' ? ', ICO' : '') . '.'; continue;
        }
        if ($f !== 'favicon' && MIME_EXT[$mime] === 'ico') { $errors[$f] = 'ICO is only allowed for the favicon.'; continue; }
        $fn = $f . '-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
        if (!move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $errors[$f] = 'Could not save file.'; continue; }
        $new[$f] = $fn;
        $uploaded[] = $fn;
    } elseif (!empty($_POST['remove_' . $f])) {
        $new[$f] = '';
    }
}
if ($errors) {   // nothing is saved: drop files uploaded in this request
    foreach ($uploaded as $fn) @unlink($dirFs . DIRECTORY_SEPARATOR . $fn);
}
if ($errors) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $errors], 422);

db()->prepare('UPDATE brand SET website_name=?, header_logo=?, footer_logo=?, favicon=?, show_credits=?, credits_url=?, company_name=?, company_descriptor=?, tagline=? WHERE id=1')
    ->execute([$name, $new['header_logo'], $new['footer_logo'], $new['favicon'], !empty($_POST['show_credits']) ? 1 : 0, $creditsUrl, $companyName, $descriptor, $tagline]);

foreach (FIELDS as $f) {   // remove replaced / removed files
    if ($current[$f] && $current[$f] !== $new[$f]) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($current[$f]));
}
json_out(['ok' => true, 'brand' => with_urls(get_brand(), $dirUrl)]);
