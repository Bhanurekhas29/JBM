<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$method = $_SERVER['REQUEST_METHOD'];

const ICONS = ['pointer', 'document', 'review', 'handshake', 'shield', 'bolt', 'users', 'lightbulb', 'chat', 'check'];

function section_out(): array {
    $r = db()->query('SELECT show_section, eyebrow, heading_before, heading_gold, description FROM how_section WHERE id = 1')->fetch();
    $r['show_section'] = (bool)$r['show_section'];
    return $r;
}
function step_out(array $r): array {
    return ['id' => (int)$r['id'], 'title' => $r['title'], 'description' => $r['description'], 'icon' => $r['icon'],
            'sort_order' => (int)$r['sort_order'], 'is_active' => (bool)$r['is_active']];
}
function renumber(): void {
    $ids = db()->query('SELECT id FROM how_steps ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN);
    $up = db()->prepare('UPDATE how_steps SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $id) $up->execute([$i + 1, $id]);
}
function place(int $id, ?int $position): void {
    $ids = array_map('intval', db()->query('SELECT id FROM how_steps ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN));
    $ids = array_values(array_diff($ids, [$id]));
    $pos = $position === null ? count($ids) : max(0, min(count($ids), $position - 1));
    array_splice($ids, $pos, 0, [$id]);
    $up = db()->prepare('UPDATE how_steps SET sort_order = ? WHERE id = ?');
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
    // Public callers get active steps only; a signed-in admin can ask for all.
    $all = !empty($_SESSION['admin_id']) && isset($_GET['all']);
    $rows = db()->query('SELECT * FROM how_steps' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order, id')->fetchAll();
    json_out(['ok' => true, 'section' => section_out(), 'steps' => array_map('step_out', $rows)]);
}

require_auth();
$in = request_json();

if ($method === 'POST') {
    $action = (string)($in['action'] ?? '');
    $s = fn(string $k) => trim((string)($in[$k] ?? ''));

    if ($action === 'section') {
        $eyebrow = $s('eyebrow'); $before = $s('heading_before'); $gold = $s('heading_gold'); $desc = $s('description');
        $err = [];
        if (mb_strlen($eyebrow) > 120) $err['eyebrow'] = 'Max 120 characters.';
        if (mb_strlen($before) > 120) $err['heading_before'] = 'Max 120 characters.';
        if (mb_strlen($gold) > 120) $err['heading_gold'] = 'Max 120 characters.';
        if ($before === '' && $gold === '') $err['heading_before'] = 'Enter a heading.';
        if (mb_strlen($desc) > 600) $err['description'] = 'Max 600 characters.';
        if ($err) fail($err);
        db()->prepare('UPDATE how_section SET show_section=?, eyebrow=?, heading_before=?, heading_gold=?, description=? WHERE id=1')
            ->execute([!empty($in['show_section']) ? 1 : 0, $eyebrow, $before, $gold, $desc]);
        json_out(['ok' => true, 'section' => section_out()]);
    }

    if ($action !== 'step') json_out(['ok' => false, 'message' => 'Unknown action.'], 400);

    $id = (int)($in['id'] ?? 0);
    if ($id) {
        $st = db()->prepare('SELECT id FROM how_steps WHERE id = ?'); $st->execute([$id]);
        if (!$st->fetch()) json_out(['ok' => false, 'message' => 'Step not found.'], 404);
    }
    $title = $s('title'); $desc = $s('description'); $icon = $s('icon');
    $err = [];
    if ($title === '' || mb_strlen($title) > 80) $err['title'] = 'Title is required (max 80 characters).';
    if (mb_strlen($desc) > 400) $err['description'] = 'Max 400 characters.';
    if (!in_array($icon, ICONS, true)) $err['icon'] = 'Choose an icon.';
    $position = position_of($in);
    if ($err) fail($err);
    $active = !empty($in['is_active']) ? 1 : 0;

    if ($id) {
        db()->prepare('UPDATE how_steps SET title=?, description=?, icon=?, is_active=? WHERE id=?')->execute([$title, $desc, $icon, $active, $id]);
        if ($position !== null) place($id, $position);
        json_out(['ok' => true]);
    }
    db()->prepare('INSERT INTO how_steps (title, description, icon, sort_order, is_active) VALUES (?,?,?,?,?)')->execute([$title, $desc, $icon, 999999, $active]);
    place((int)db()->lastInsertId(), $position);
    json_out(['ok' => true], 201);
}

// PUT (toggle / reorder) and DELETE
$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT id FROM how_steps WHERE id = ?'); $st->execute([$id]);
if (!$st->fetch()) json_out(['ok' => false, 'message' => 'Step not found.'], 404);

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM how_steps WHERE id = ?')->execute([$id]);
    renumber();
    json_out(['ok' => true]);
}
if (!empty($in['toggle'])) {
    db()->prepare('UPDATE how_steps SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
$position = position_of($in);
if ($position === null) json_out(['ok' => false, 'message' => 'Enter an order number.'], 422);
place($id, $position);
json_out(['ok' => true]);
