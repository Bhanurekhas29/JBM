<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST', 'PUT', 'DELETE']);
$method = $_SERVER['REQUEST_METHOD'];

function page_out(array $r): array {
    return ['id' => (int)$r['id'], 'title' => $r['title'], 'slug' => $r['slug'], 'content' => (string)$r['content'],
            'sort_order' => (int)$r['sort_order'], 'is_active' => (bool)$r['is_active'], 'updated_at' => $r['updated_at']];
}
function renumber(): void {
    $ids = db()->query('SELECT id FROM legal_pages ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN);
    $up = db()->prepare('UPDATE legal_pages SET sort_order = ? WHERE id = ?');
    foreach ($ids as $i => $id) $up->execute([$i + 1, $id]);
}
function place(int $id, ?int $position): void {
    $ids = array_map('intval', db()->query('SELECT id FROM legal_pages ORDER BY sort_order, id')->fetchAll(PDO::FETCH_COLUMN));
    $ids = array_values(array_diff($ids, [$id]));
    $pos = $position === null ? count($ids) : max(0, min(count($ids), $position - 1));
    array_splice($ids, $pos, 0, [$id]);
    $up = db()->prepare('UPDATE legal_pages SET sort_order = ? WHERE id = ?');
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
function make_slug(string $s): string {
    $s = strtolower(trim($s));
    $s = preg_replace('/&/', ' and ', $s);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

if ($method === 'GET') {
    // Public callers get active pages only; a signed-in admin can ask for all.
    $all = !empty($_SESSION['admin_id']) && isset($_GET['all']);
    $rows = db()->query('SELECT * FROM legal_pages' . ($all ? '' : ' WHERE is_active = 1') . ' ORDER BY sort_order, id')->fetchAll();
    json_out(['ok' => true, 'pages' => array_map('page_out', $rows)]);
}

require_auth();
$in = request_json();

if ($method === 'POST') {
    $id = (int)($in['id'] ?? 0);
    $cur = null;
    if ($id) {
        $st = db()->prepare('SELECT * FROM legal_pages WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
        if (!$cur) json_out(['ok' => false, 'message' => 'Page not found.'], 404);
    }
    $title = trim((string)($in['title'] ?? ''));
    $slug = trim((string)($in['slug'] ?? ''));
    $content = trim((string)($in['content'] ?? ''));
    $active = !empty($in['is_active']) ? 1 : 0;
    $slug = $slug === '' ? make_slug($title) : $slug;
    $err = [];
    if ($title === '' || mb_strlen($title) > 120) $err['title'] = 'Title is required (max 120 characters).';
    if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug) || strlen($slug) > 120) $err['slug'] = 'Use lowercase letters, numbers and hyphens only, e.g. privacy-policy.';
    else {
        $st = db()->prepare('SELECT 1 FROM legal_pages WHERE slug = ? AND id <> ?'); $st->execute([$slug, $id]);
        if ($st->fetchColumn()) $err['slug'] = 'Another page already uses this link name.';
    }
    if (mb_strlen($content) > 100000) $err['content'] = 'Content is too long.';
    if ($active && $content === '') $err['content'] = 'Add the page content before making it active.';
    $position = position_of($in);
    if ($err) fail($err);

    if ($cur) {
        db()->prepare('UPDATE legal_pages SET title=?, slug=?, content=?, is_active=? WHERE id=?')->execute([$title, $slug, $content, $active, $id]);
        if ($position !== null) place($id, $position);
        json_out(['ok' => true]);
    }
    db()->prepare('INSERT INTO legal_pages (title, slug, content, sort_order, is_active) VALUES (?,?,?,?,?)')->execute([$title, $slug, $content, 999999, $active]);
    place((int)db()->lastInsertId(), $position);
    json_out(['ok' => true], 201);
}

// PUT (toggle / reorder) and DELETE
$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT * FROM legal_pages WHERE id = ?'); $st->execute([$id]); $cur = $st->fetch();
if (!$cur) json_out(['ok' => false, 'message' => 'Page not found.'], 404);

if ($method === 'DELETE') {
    db()->prepare('DELETE FROM legal_pages WHERE id = ?')->execute([$id]);
    renumber();
    json_out(['ok' => true]);
}
if (!empty($in['toggle'])) {
    if (!$cur['is_active'] && trim((string)$cur['content']) === '') json_out(['ok' => false, 'message' => 'Add the page content (Edit) before activating it.'], 422);
    db()->prepare('UPDATE legal_pages SET is_active = 1 - is_active WHERE id = ?')->execute([$id]);
    json_out(['ok' => true]);
}
$position = position_of($in);
if ($position === null) json_out(['ok' => false, 'message' => 'Enter an order number.'], 422);
place($id, $position);
json_out(['ok' => true]);
