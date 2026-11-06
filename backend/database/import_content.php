<?php
// Imports backend/database/content.sql ONCE into a fresh database (run after seed.php).
// A marker row in site_meta stops it from running again, so later edits made in the admin are never overwritten.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only'); }
require __DIR__ . '/../includes/bootstrap.php';

$pdo = db();
$pdo->exec("CREATE TABLE IF NOT EXISTS site_meta (k VARCHAR(60) PRIMARY KEY, v VARCHAR(255) NOT NULL DEFAULT '') ENGINE=InnoDB");

$done = $pdo->prepare("SELECT v FROM site_meta WHERE k = 'content_imported'");
$done->execute();
if ($done->fetchColumn() !== false) { echo "Content already imported - skipping.\n"; exit(0); }

$file = __DIR__ . '/content.sql';
if (!is_file($file)) { echo "No content.sql - skipping.\n"; exit(0); }

$statements = array_filter(array_map('trim', explode("\n-- @@\n", file_get_contents($file))), fn($s) => $s !== '' && !str_starts_with($s, '-- JBM'));
$n = 0;
foreach ($statements as $sql) { $pdo->exec($sql); $n++; }
$pdo->prepare("INSERT INTO site_meta (k, v) VALUES ('content_imported', ?)")->execute([date('c')]);
echo "Imported $n statements from content.sql.\n";
