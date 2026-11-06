<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$method = $_SERVER['REQUEST_METHOD'];

const MAX_IMG = 2 * 1024 * 1024;
const MIME_EXT = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
$dirFs  = realpath(__DIR__ . '/../../../frontend/public/images') . DIRECTORY_SEPARATOR . 'faq';
$dirUrl = '/images/faq/';

function section_out(string $dirUrl): array {
    $r = db()->query('SELECT show_section, eyebrow, heading_before, heading_gold, image, updated_at FROM faq_section WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    $r['image_url'] = $r['image'] ? $dirUrl . $r['image'] . '?v=' . strtotime((string)$r['updated_at']) : '';
    unset($r['updated_at']);
    return $r;
}
function item_out(array $r): array {
    return ['id' => (int)$r['id'], 'question' => $r['question'], 'answer' => $r['answer'], 'sort_order' => (int)$r['sort_order'], 'is_active' => (bool)$r['is_active']];
}
function renumber(): void {
    $ids = db()->query('SELECT id FROM faq_items ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN);
    $up = db()->prepare('UPDATE faq_items SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $id) $up->execute([$i + 1, $id]);
}
function place(int $id, ?int $position): void {
    $ids = array_map('intval', db()->query('SELECT id FROM faq_items ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN));
    $ids = array_values(array_diff($ids, [$id]));
    $pos = $position === null ? count($ids) : max(0, min(count($ids), $position - 1));
    array_splice($ids, $pos, 0, [$id]);
    $up = db()->prepare('UPDATE faq_items SET sort_order = ? WHERE id = ?');
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
    // Public callers get active questions only; a signed-in admin can ask for all.
    $all = !empty($_SESSION['admin_id']) && isset($_GET['all']);
    $rows = db()->query('SELECT * FROM faq_items' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order, id')->fetchAll();
    json_out(['ok' => true, 'section' => section_out($dirUrl), 'items' => array_map('item_out', $rows)]);
}

require_auth();
$isJson = str_contains((string)($_SERVER['CONTENT_TYPE'] ?? ''), 'application/json');
$in = $isJson ? request_json() : $_POST;
$s = fn(string $k) => trim((string)($in[$k] ?? ''));

if ($method === 'POST') {
    $action = $s('action');

    if ($action === 'section') {   // multipart: includes the image
        $eyebrow = $s('eyebrow'); $before = $s('heading_before'); $gold = $s('heading_gold');
        $err = [];
        if (mb_strlen($eyebrow) > 60) $err['eyebrow'] = 'Max 60 characters.';
        if (mb_strlen($before) > 120) $err['heading_before'] = 'Max 120 characters.';
        if (mb_strlen($gold) > 120) $err['heading_gold'] = 'Max 120 characters.';
        if ($before === '' && $gold === '') $err['heading_before'] = 'Enter a heading.';

        $cur = db()->query('SELECT image FROM faq_section WHERE id = 1')->fetchColumn();
        $newImg = $cur; $uploaded = null;
        $file = $_FILES['image'] ?? null;
        if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
            if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > MAX_IMG) $err['image'] = 'Upload failed or file larger than 2 MB.';
            else {
                $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
                if (!isset(MIME_EXT[$mime]) || !@getimagesize($file['tmp_name'])) $err['image'] = 'Allowed: JPG, PNG, WEBP.';
                elseif (!is_dir($dirFs) && !mkdir($dirFs, 0775, true)) json_out(['ok' => false, 'message' => 'Cannot create the images/faq folder.'], 500);
                else {
                    $fn = 'faq-' . bin2hex(random_bytes(6)) . '.' . MIME_EXT[$mime];
                    if (move_uploaded_file($file['tmp_name'], $dirFs . DIRECTORY_SEPARATOR . $fn)) { $newImg = $fn; $uploaded = $fn; }
                    else $err['image'] = 'Could not save file.';
                }
            }
        } elseif (!empty($in['remove_image'])) $newImg = '';

        if ($err) { if ($uploaded) @unlink($dirFs . DIRECTORY_SEPARATOR . $uploaded); fail($err); }
        db()->prepare('UPDATE faq_section SET show_section=?, eyebrow=?, heading_before=?, heading_gold=?, image=? WHERE id=1')
            ->execute([!empty($in['show_section']) ? 1 : 0, $eyebrow, $before, $gold, $newImg]);
        if ($cur && $cur !== $newImg) @unlink($dirFs . DIRECTORY_SEPARATOR . basename($cur));
        json_out(['ok' => true, 'section' => section_out($dirUrl)]);
    }

    if ($action !== 'item') json_out(['ok' => false, 'message' => 'Unknown action.'], 400);

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        $st = db()->prepare('SELECT id FROM faq_items WHERE id = ?'); $st->execute([$id]);
        if (!$st->fetch()) json_out(['ok' => false, 'message' => 'Question not found.'], 404);
    }
    $q = $s('question'); $a = trim((string)($in['answer'] ?? ''));
    $active = !empty($in['is_active']) ? 1 : 0;
    $err = [];
    if ($q === '' || mb_strlen($q) > 200) $err['question'] = 'Question is required (max 200 characters).';
    if (mb_strlen($a) > 1500) $err['answer'] = 'Max 1500 characters.';
    if ($active && $a === '') $err['answer'] = 'Add an answer before making this question active.';
    $position = position_of($in);
    if ($err) fail($err);

    if ($id) {
        db()->prepare('UPDATE faq_items SET question=?, answer=?, is_active=? WHERE id=?')->execute([$q, $a, $active, $id]);
        if ($position !== null) place($id, $position);
        json_out(['ok' => true]);
    }
    db()->prepare('INSERT INTO faq_items (question, answer, sort_order, is_active) VALUES (?,?,?,?)')->execute([$q, $a, 999999, $active]);
    place((int)db()->lastInsertId(), $position);
    json_out(['ok' => true], 201);
}

// PUT (toggle / reorder) and DELETE
$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT * FROM faq_items WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
if (!$cur) json_out(['ok' => false, 'message' => 'Question not found.'], 404);

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM faq_items WHERE id = ?')->execute([$id]);
    renumber();
    json_out(['ok' => true]);
}
if (!empty($in['toggle'])) {
    if (!$cur['is_active'] && trim((string)$cur['answer']) === '') {
        json_out(['ok' => false, 'message' => 'Add an answer (Edit) before activating this question.'], 422);
    }
    db()->prepare('UPDATE faq_items SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
$position = position_of($in);
if ($position === null) json_out(['ok' => false, 'message' => 'Enter an order number.'], 422);
place($id, $position);
json_out(['ok' => true]);
