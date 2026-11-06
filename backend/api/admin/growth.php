<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$method = $_SERVER['REQUEST_METHOD'];

const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const URL_RE = '#^(\#|/|https?://|mailto:|tel:)\S*$#i';
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'growth';
$dirUrl = '/images/growth/';

function section_out(): array {
    $r = db()->query('SELECT show_section, eyebrow, heading_before, heading_gold, heading_after, description FROM growth_section WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    return $r;
}
function card_out(array $r, string $dirUrl): array {
    return ['id' => (int)$r['id'], 'category' => $r['category'], 'title' => $r['title'], 'description' => $r['description'],
            'list_title' => $r['list_title'], 'items' => json_decode((string)$r['items'], true) ?: [],
            'image' => $r['image'], 'image_url' => $r['image'] ? $dirUrl . $r['image'] : '',
            'button_label' => $r['button_label'], 'button_url' => $r['button_url'],
            'sort_order' => (int)$r['sort_order'], 'is_active' => (bool)$r['is_active']];
}
function renumber(): void {
    $ids = db()->query('SELECT id FROM growth_cards ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN);
    $up = db()->prepare('UPDATE growth_cards SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $id) $up->execute([$i + 1, $id]);
}
function place(int $id, ?int $position): void {
    $ids = array_map('intval', db()->query('SELECT id FROM growth_cards ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN));
    $ids = array_values(array_diff($ids, [$id]));
    $pos = $position === null ? count($ids) : max(0, min(count($ids), $position - 1));
    array_splice($ids, $pos, 0, [$id]);
    $up = db()->prepare('UPDATE growth_cards SET sort_order = ? WHERE id = ?');
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
    // Public callers get active cards only; a signed-in admin can ask for all.
    $all = !empty($_SESSION['admin_id']) && isset($_GET['all']);
    $rows = db()->query('SELECT * FROM growth_cards' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order, id')->fetchAll();
    json_out(['ok' => true, 'section' => section_out(), 'cards' => array_map(fn($r) => card_out($r, $dirUrl), $rows)]);
}

require_auth();

if ($method === 'POST') {
    $action = (string)($_POST['action'] ?? '');
    $t = fn(string $k) => trim((string)($_POST[$k] ?? ''));

    if ($action === 'section') {
        $eyebrow = $t('eyebrow'); $before = $t('heading_before'); $gold = $t('heading_gold'); $after = $t('heading_after');
        $desc = trim((string)($_POST['description'] ?? ''));
        $err = [];
        if (mb_strlen($eyebrow) > 120) $err['eyebrow'] = 'Max 120 characters.';
        foreach (['heading_before' => $before, 'heading_gold' => $gold, 'heading_after' => $after] as $k => $v) if (mb_strlen($v) > 100) $err[$k] = 'Max 100 characters.';
        if ($before === '' && $gold === '' && $after === '') $err['heading_before'] = 'Enter a heading.';
        if (mb_strlen($desc) > 600) $err['description'] = 'Max 600 characters.';
        if ($err) fail($err);
        db()->prepare('UPDATE growth_section SET show_section=?, eyebrow=?, heading_before=?, heading_gold=?, heading_after=?, description=? WHERE id=1')
            ->execute([!empty($_POST['show_section']) ? 1 : 0, $eyebrow, $before, $gold, $after, $desc]);
        json_out(['ok' => true, 'section' => section_out()]);
    }

    if ($action !== 'card') json_out(['ok' => false, 'message' => 'Unknown action.'], 400);

    $id = (int)($_POST['id'] ?? 0);
    $cur = null;
    if ($id) {
        $st = db()->prepare('SELECT * FROM growth_cards WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
        if (!$cur) json_out(['ok' => false, 'message' => 'Card not found.'], 404);
    }
    $cat = $t('category'); $title = $t('title'); $desc = trim((string)($_POST['description'] ?? '')); $lt = $t('list_title');
    $bl = $t('button_label'); $bu = $t('button_url');
    $err = [];
    if (mb_strlen($cat) > 60) $err['category'] = 'Max 60 characters.';
    if ($title === '' || mb_strlen($title) > 120) $err['title'] = 'Title is required (max 120 characters).';
    if (mb_strlen($desc) > 500) $err['description'] = 'Max 500 characters.';
    if (mb_strlen($lt) > 60) $err['list_title'] = 'Max 60 characters.';
    if (mb_strlen($bl) > 60) $err['button_label'] = 'Max 60 characters.';
    if ($bl !== '' && (strlen($bu) > 255 || !preg_match(URL_RE, $bu))) $err['button_url'] = 'Use a section like #contact, a path like /contact, or a full http(s) link.';

    $items = json_decode((string)($_POST['items'] ?? '[]'), true);
    if (!is_array($items)) $items = [];
    $items = array_values(array_filter(array_map(fn($i) => trim((string)$i), $items), fn($i) => $i !== ''));
    if (count($items) > 8) $err['items'] = 'Maximum 8 items.';
    foreach ($items as $i) if (mb_strlen($i) > 80) { $err['items'] = 'Each item: max 80 characters.'; break; }
    $position = position_of($_POST);

    $newImg = $cur['image'] ?? '';
    $uploaded = null;
    $file = $_FILES['image'] ?? null;
    if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) $err['image'] = 'Upload failed or file larger than 2 MB.';
        else {
            $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
            if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) $err['image'] = 'Allowed: JPG, PNG, WEBP.';
            elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/growth folder.'], 500);
            else {
                $fn = 'growth-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
                if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
                else $err['image'] = 'Could not save file.';
            }
        }
    } elseif (!empty($_POST['remove_image'])) $newImg = '';

    if ($err) { if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded); fail($err); }

    $active = !empty($_POST['is_active']) ? 1 : 0;
    $itemsJson = json_encode($items, JSON_UNESCAPED_UNICODE);
    if ($cur) {
        db()->prepare('UPDATE growth_cards SET category=?, title=?, description=?, list_title=?, items=?, image=?, button_label=?, button_url=?, is_active=? WHERE id=?')
            ->execute([$cat, $title, $desc, $lt, $itemsJson, $newImg, $bl, $bu, $active, $id]);
        if ($cur['image'] && $cur['image'] !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur['image']));
        if ($position !== null) place($id, $position);
        json_out(['ok' => true]);
    }
    db()->prepare('INSERT INTO growth_cards (category, title, description, list_title, items, image, button_label, button_url, sort_order, is_active) VALUES (?,?,?,?,?,?,?,?,?,?)')
        ->execute([$cat, $title, $desc, $lt, $itemsJson, $newImg, $bl, $bu, 999999, $active]);
    place((int)db()->lastInsertId(), $position);
    json_out(['ok' => true], 201);
}

// PUT (toggle / reorder) and DELETE
$in = request_json();
$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT * FROM growth_cards WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
if (!$cur) json_out(['ok' => false, 'message' => 'Card not found.'], 404);

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM growth_cards WHERE id = ?')->execute([$id]);
    if ($cur['image']) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur['image']));
    renumber();
    json_out(['ok' => true]);
}
if (!empty($in['toggle'])) {
    db()->prepare('UPDATE growth_cards SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
$position = position_of($in);
if ($position === null) json_out(['ok' => false, 'message' => 'Enter an order number.'], 422);
place($id, $position);
json_out(['ok' => true]);
