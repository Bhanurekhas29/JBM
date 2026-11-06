<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$method = $_SERVER['REQUEST_METHOD'];

const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const URL_RE = '#^(\#|/|https?://|mailto:|tel:)\S*$#i';
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'services';
$dirUrl = '/images/services/';

function section_out(): array {
    $r = db()->query('SELECT show_section, eyebrow, heading_plain, heading_gold, description, popup_label, popup_button_label FROM ip_services_section WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    return $r;
}
function service_out(array $r, string $dirUrl): array {
    return ['id' => (int)$r['id'], 'category' => $r['category'], 'title' => $r['title'], 'description' => $r['description'],
            'image' => $r['image'], 'image_url' => $r['image'] ? $dirUrl . $r['image'] : '',
            'button_label' => $r['button_label'], 'button_url' => $r['button_url'],
            'features' => json_decode((string)($r['features'] ?? ''), true) ?: [],
            'sort_order' => (int)$r['sort_order'], 'is_active' => (bool)$r['is_active'], 'is_wide' => (bool)$r['is_wide']];
}
function renumber(): void {
    $ids = db()->query('SELECT id FROM ip_services ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN);
    $up = db()->prepare('UPDATE ip_services SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $id) $up->execute([$i + 1, $id]);
}
function place(int $id, ?int $position): void {
    $ids = array_map('intval', db()->query('SELECT id FROM ip_services ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN));
    $ids = array_values(array_diff($ids, [$id]));
    $pos = $position === null ? count($ids) : max(0, min(count($ids), $position - 1));
    array_splice($ids, $pos, 0, [$id]);
    $up = db()->prepare('UPDATE ip_services SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $mid) $up->execute([$i + 1, $mid]);
}
function fail(array $errors): never {
    json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $errors], 422);
}
function position_of(array $src): ?int {
    if (!isset($src['position']) || $src['position'] === '' || $src['position'] === null) return null;
    if (!is_numeric($src['position']) || (int)$src['position'] < 1) fail(['position' => 'Order must be a number, 1 or higher.']);
    return (int)$src['position'];
}

if ($method === 'GET') {
    // Public callers get active services only; a signed-in admin can ask for all.
    $all = !empty($_SESSION['admin_id']) && isset($_GET['all']);
    $rows = db()->query('SELECT * FROM ip_services' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order, id')->fetchAll();
    json_out(['ok' => true, 'section' => section_out(), 'services' => array_map(fn($r) => service_out($r, $dirUrl), $rows)]);
}

require_auth();

if ($method === 'POST') {
    $action = (string)($_POST['action'] ?? '');

    if ($action === 'section') {
        $t = fn(string $k) => trim((string)($_POST[$k] ?? ''));
        $eyebrow = $t('eyebrow'); $plain = $t('heading_plain'); $gold = $t('heading_gold'); $desc = trim((string)($_POST['description'] ?? ''));
        $plabel = $t('popup_label'); $pbtn = $t('popup_button_label');
        $err = [];
        if (mb_strlen($eyebrow) > 120) $err['eyebrow'] = 'Max 120 characters.';
        if (mb_strlen($plain) > 150) $err['heading_plain'] = 'Max 150 characters.';
        if (mb_strlen($gold) > 150) $err['heading_gold'] = 'Max 150 characters.';
        if ($plain === '' && $gold === '') $err['heading_plain'] = 'Enter a heading.';
        if (mb_strlen($desc) > 600) $err['description'] = 'Max 600 characters.';
        if (mb_strlen($plabel) > 60) $err['popup_label'] = 'Max 60 characters.';
        if (mb_strlen($pbtn) > 60) $err['popup_button_label'] = 'Max 60 characters.';
        if ($err) fail($err);
        db()->prepare('UPDATE ip_services_section SET show_section=?, eyebrow=?, heading_plain=?, heading_gold=?, description=?, popup_label=?, popup_button_label=? WHERE id=1')
            ->execute([!empty($_POST['show_section']) ? 1 : 0, $eyebrow, $plain, $gold, $desc, $plabel, $pbtn]);
        json_out(['ok' => true, 'section' => section_out()]);
    }

    if ($action !== 'service') json_out(['ok' => false, 'message' => 'Unknown action.'], 400);

    $id = (int)($_POST['id'] ?? 0);
    $cur = null;
    if ($id) {
        $st = db()->prepare('SELECT * FROM ip_services WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
        if (!$cur) json_out(['ok' => false, 'message' => 'Service not found.'], 404);
    }
    $t = fn(string $k) => trim((string)($_POST[$k] ?? ''));
    $cat = $t('category'); $title = $t('title'); $desc = trim((string)($_POST['description'] ?? '')); $bl = $t('button_label'); $bu = $t('button_url');
    $err = [];
    if (mb_strlen($cat) > 60) $err['category'] = 'Max 60 characters.';
    if ($title === '' || mb_strlen($title) > 120) $err['title'] = 'Title is required (max 120 characters).';
    if (mb_strlen($desc) > 500) $err['description'] = 'Max 500 characters.';
    if (mb_strlen($bl) > 40) $err['button_label'] = 'Max 40 characters.';
    if ($bl !== '' && (strlen($bu) > 255 || !preg_match(URL_RE, $bu))) $err['button_url'] = 'Use a section like #contact, a path like /contact, or a full http(s) link.';
    $position = position_of($_POST);

    // Tick list shown in the service pop-up
    $feat = json_decode((string)($_POST['features'] ?? '[]'), true);
    if (!is_array($feat)) $feat = [];
    $feat = array_values(array_filter(array_map(fn($x) => trim((string)$x), $feat), fn($x) => $x !== ''));
    if (count($feat) > 8) $err['features'] = 'Maximum 8 points.';
    foreach ($feat as $x) if (mb_strlen($x) > 100) { $err['features'] = 'Each point: max 100 characters.'; break; }
    $featJson = json_encode($feat, JSON_UNESCAPED_UNICODE);

    $newImg = $cur['image'] ?? '';
    $uploaded = null;
    $file = $_FILES['image'] ?? null;
    if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) $err['image'] = 'Upload failed or file larger than 2 MB.';
        else {
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
            if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) $err['image'] = 'Allowed: JPG, PNG, WEBP.';
            elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/services folder.'], 500);
            else {
                $fn = 'service-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
                if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
                else $err['image'] = 'Could not save file.';
            }
        }
    } elseif (!empty($_POST['remove_image'])) $newImg = '';

    if ($err) { if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded); fail($err); }

    $active = !empty($_POST['is_active']) ? 1 : 0;
    $wide = !empty($_POST['is_wide']) ? 1 : 0;
    if ($cur) {
        db()->prepare('UPDATE ip_services SET category=?, title=?, description=?, image=?, button_label=?, button_url=?, is_active=?, is_wide=?, features=? WHERE id=?')
            ->execute([$cat, $title, $desc, $newImg, $bl, $bu, $active, $wide, $featJson, $id]);
        if ($cur['image'] && $cur['image'] !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur['image']));
        if ($position !== null) place($id, $position);
        json_out(['ok' => true]);
    }
    db()->prepare('INSERT INTO ip_services (category, title, description, image, button_label, button_url, sort_order, is_active, is_wide, features) VALUES (?,?,?,?,?,?,?,?,?,?)')
        ->execute([$cat, $title, $desc, $newImg, $bl, $bu, 999999, $active, $wide, $featJson]);
    place((int)db()->lastInsertId(), $position);
    json_out(['ok' => true], 201);
}

// PUT (toggle / reorder) and DELETE
$in = request_json();
$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT * FROM ip_services WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
if (!$cur) json_out(['ok' => false, 'message' => 'Service not found.'], 404);

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM ip_services WHERE id = ?')->execute([$id]);
    if ($cur['image']) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur['image']));
    renumber();
    json_out(['ok' => true]);
}

if (!empty($in['toggle'])) {
    db()->prepare('UPDATE ip_services SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
$position = position_of($in);
if ($position === null) json_out(['ok' => false, 'message' => 'Enter an order number.'], 422);
place($id, $position);
json_out(['ok' => true]);
