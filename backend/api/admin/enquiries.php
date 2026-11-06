<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'PUT', 'DELETE']);
require_auth();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = db()->query('SELECT id, name, email, phone, service, organization, message, is_read, created_at FROM enquiries ORDER BY id DESC LIMIT 500')->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['is_read'] = (bool)$r['is_read']; }
    $unread = (int)db()->query('SELECT COUNT(*) FROM enquiries WHERE is_read = 0')->fetchColumn();
    json_out(['ok' => true, 'enquiries' => $rows, 'unread' => $unread]);
}

$in = request_json();
$id = (int)($in['id'] ?? $_GET['id'] ?? 0);
$st = db()->prepare('SELECT id FROM enquiries WHERE id = ?');
$st->execute([$id]);
if (!$st->fetch()) json_out(['ok' => false, 'message' => 'Enquiry not found.'], 404);

if ($method === 'PUT') {
    db()->prepare('UPDATE enquiries SET is_read = ? WHERE id = ?')->execute([!empty($in['is_read']) ? 1 : 0, $id]);
    json_out(['ok' => true]);
}

db()->prepare('DELETE FROM enquiries WHERE id = ?')->execute([$id]);
json_out(['ok' => true]);
