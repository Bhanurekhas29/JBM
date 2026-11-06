<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init(['GET', 'POST']);

const URL_RE = '#^(\#|/|https?://|mailto:|tel:)\S*$#i';
const SOCIALS = ['linkedin', 'instagram', 'x'];

function get_footer(): array {
    $r = db()->query('SELECT * FROM footer_settings WHERE id = 1')->fetch();
    $r['columns'] = json_decode((string)$r['link_columns'], true) ?: [];
    $r['socials'] = json_decode((string)$r['socials'], true) ?: [];
    foreach (SOCIALS as $s) $r['socials'][$s] = $r['socials'][$s] ?? '';
    unset($r['id'], $r['link_columns']);
    return $r;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') json_out(['ok' => true, 'footer' => get_footer()]);   // public: the website footer reads this

require_auth();
$in = request_json();
$s = fn(string $k) => trim((string)($in[$k] ?? ''));

$about = $s('about_text'); $phone = $s('phone'); $email = $s('email'); $address = $s('address'); $hours = $s('office_hours');
$tagline = $s('bottom_tagline'); $copy = $s('copyright_text');
$err = [];
if (mb_strlen($about) > 400) $err['about_text'] = 'Max 400 characters.';
if ($phone !== '' && !preg_match('/^[0-9+()\-\s.]{6,30}$/', $phone)) $err['phone'] = 'Enter a valid phone number.';
if ($email !== '' && (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150)) $err['email'] = 'Enter a valid email address.';
if (mb_strlen($address) > 250) $err['address'] = 'Max 250 characters.';
if (mb_strlen($hours) > 150) $err['office_hours'] = 'Max 150 characters.';
if (mb_strlen($tagline) > 200) $err['bottom_tagline'] = 'Max 200 characters.';
if (mb_strlen($copy) > 200) $err['copyright_text'] = 'Max 200 characters.';

// Social links
$socials = [];
foreach (SOCIALS as $k) {
    $u = trim((string)($in['socials'][$k] ?? ''));
    if ($u !== '' && (strlen($u) > 255 || !preg_match('#^https?://\S+$#i', $u))) $err['social_' . $k] = 'Enter a full link starting with http:// or https://';
    $socials[$k] = $u;
}

// Link columns: [{title, links:[{label,url}]}]
$cols = $in['columns'] ?? [];
if (!is_array($cols)) $cols = [];
$columns = [];
foreach ($cols as $ci => $c) {
    $title = trim((string)($c['title'] ?? ''));
    $links = [];
    foreach (($c['links'] ?? []) as $l) {
        $label = trim((string)($l['label'] ?? '')); $url = trim((string)($l['url'] ?? ''));
        if ($label === '' && $url === '') continue;
        if ($label === '' || mb_strlen($label) > 60) { $err['columns'] = 'Every link needs a label (max 60 characters).'; break 2; }
        if (strlen($url) > 255 || !preg_match(URL_RE, $url)) { $err['columns'] = "Link \"$label\": use a section like #about, a path like /terms, or a full http(s) link."; break 2; }
        $links[] = ['label' => $label, 'url' => $url];
    }
    if ($title === '' && !$links) continue;
    if (mb_strlen($title) > 40) { $err['columns'] = 'Column title: max 40 characters.'; break; }
    if (count($links) > 10) { $err['columns'] = 'Maximum 10 links per column.'; break; }
    $columns[] = ['title' => $title, 'links' => $links];
}
if (count($columns) > 4) $err['columns'] = 'Maximum 4 link columns.';

if ($err) json_out(['ok' => false, 'message' => 'Please fix the highlighted fields.', 'errors' => $err], 422);

db()->prepare('UPDATE footer_settings SET about_text=?, link_columns=?, phone=?, email=?, address=?, office_hours=?, socials=?, bottom_tagline=?, copyright_text=? WHERE id=1')
    ->execute([$about, json_encode($columns, JSON_UNESCAPED_UNICODE), $phone, $email, $address, $hours, json_encode($socials), $tagline, $copy]);
json_out(['ok' => true, 'footer' => get_footer()]);
