<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$method = $_SERVER['REQUEST_METHOD'];

function row_out(array $r): array {
    return ['id' => (int)$r['id'], 'label' => $r['label'], 'url' => $r['url'], 'sort_order' => (int)$r['sort_order'],
            'is_active' => (bool)$r['is_active'], 'new_tab' => (bool)$r['new_tab']];
}

/** Put item $id at 1-based $position (clamped) and renumber everything 1..N. */
function place(int $id, ?int $position): void {
    $pdo = db();
    $ids = array_map('intval', $pdo->query('SELECT id FROM website_menu ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN));
    $ids = array_values(array_diff($ids, [$id]));
    $pos = $position === null ? count($ids) : max(0, min(count($ids), $position - 1));
    array_splice($ids, $pos, 0, [$id]);
    $pdo->beginTransaction();
    $up = $pdo->prepare('UPDATE website_menu SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $mid) $up->execute([$i + 1, $mid]);
    $pdo->commit();
}

if ($method === 'GET') {
    // Public callers (the website header) only get active items; a signed-in admin can ask for all.
    $all = !empty($_SESSION['admin_id']) && isset($_GET['all']);
    $sql = 'SELECT id, label, url, sort_order, is_active, new_tab FROM website_menu' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order, id';
    json_out(['ok' => true, 'menus' => array_map('row_out', db()->query($sql)->fetchAll())]);
}

require_auth();
$in = request_json();

function parse_position(array $in): ?int {
    if (!isset($in['position']) || $in['position'] === '' || $in['position'] === null) return null;
    if (!is_numeric($in['position']) || (int)$in['position'] < 1) {
        json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => ['position' => 'Order must be a number, 1 or higher.']], 422);
    }
    return (int)$in['position'];
}

function validate_menu(array $in): array {
    $label = trim((string)($in['label'] ?? ''));
    $url = trim((string)($in['url'] ?? ''));
    $err = [];
    if ($label === '' || mb_strlen($label) > 60) $err['label'] = 'Label is required (max 60 characters).';
    if ($url === '' || strlen($url) > 255 || !preg_match('#^(\#|/|https?://|mailto:|tel:)\S*$#i', $url)) {
        $err['url'] = 'Use a section like #about, a path like /contact, or a full http(s) link.';
    }
    if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);
    return [$label, $url, !empty($in['is_active']) ? 1 : 0, !empty($in['new_tab']) ? 1 : 0];
}

if ($method === 'POST') {
    [$label, $url, $active, $tab] = validate_menu($in);
    $position = parse_position($in);
    db()->prepare('INSERT INTO website_menu (label, url, sort_order, is_active, new_tab) VALUES (?,?,?,?,?)')->execute([$label, $url, 999999, $active, $tab]);
    place((int)db()->lastInsertId(), $position);   // blank position = last
    json_out(['ok' => true], 201);
}

$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT * FROM website_menu WHERE id = ?');
$st->execute([$id]);
$item = $st->fetch();
if (!$item) json_out(['ok' => false, 'message' => 'Menu item not found.'], 404);

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM website_menu WHERE id = ?')->execute([$id]);
    $ids = db()->query('SELECT id FROM website_menu ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN);
    $up = db()->prepare('UPDATE website_menu SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $mid) $up->execute([$i + 1, $mid]);   // keep numbers 1..N
    json_out(['ok' => true]);
}

// PUT
if (!empty($in['toggle'])) {
    db()->prepare('UPDATE website_menu SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}

if (isset($in['position']) && !isset($in['label'])) {   // reorder only (number typed in the table)
    $position = parse_position($in);
    if ($position === null) json_out(['ok' => false, 'message' => 'Enter an order number.'], 422);
    place($id, $position);
    json_out(['ok' => true]);
}

[$label, $url, $active, $tab] = validate_menu($in);
$position = parse_position($in);
db()->prepare('UPDATE website_menu SET label=?, url=?, is_active=?, new_tab=? WHERE id=?')->execute([$label, $url, $active, $tab, $id]);
if ($position !== null) place($id, $position);
json_out(['ok' => true]);
