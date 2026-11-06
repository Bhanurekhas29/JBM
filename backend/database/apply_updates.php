<?php
// One-time content updates for databases that were already created (run after import_content.php).
// Each update runs once, tracked in site_meta, so later edits made in the admin are never overwritten.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only'); }
require __DIR__ . '/../includes/bootstrap.php';

$pdo = db();
$pdo->exec("CREATE TABLE IF NOT EXISTS site_meta (k VARCHAR(60) PRIMARY KEY, v VARCHAR(255) NOT NULL DEFAULT '') ENGINE=InnoDB");

$updates = [
    // FAQ answers, Instagram link and the contact number (floating icons + footer)
    '2026-11-faq-and-contact' => function (PDO $pdo) {
        $faq = [
            'Does JBM guarantee trademark or patent registration?' => 'No. Registration decisions are made by the relevant statutory authorities. Searches and assessments can help identify potential issues, but cannot guarantee acceptance or registration.',
            'Are government fees included in the quotation?' => 'Government fees and professional service charges are communicated separately wherever applicable. Your quotation will explain the relevant costs before you confirm the engagement.',
            'Can I enquire if I do not know the relevant IP category?' => 'Absolutely. Share your ideas, product, brand or creative work with us. We will help identify the relevant service category and appropriate next steps.',
            'Who handles specialist patent or legal work?' => 'Specialist and regulated professional work is coordinated through appropriately qualified and authorised independent professionals, wherever required.',
            'Can I request multiple services together?' => 'Yes. You can submit requirements for multiple services, including intellectual property protection, commercial agreements and brand development.',
            'How long does the process take?' => 'Timelines depend on the nature of the service, documentation, professional requirements and statutory procedures. We communicate the estimated timeline before proceeding.',
        ];
        $st = $pdo->prepare('UPDATE faq_items SET answer = ?, is_active = 1 WHERE question = ?');
        foreach ($faq as $q => $a) $st->execute([$a, $q]);

        $num = '+91 86681 17743';
        $pdo->prepare('UPDATE floating_icons SET show_whatsapp = 1, whatsapp_number = ?, show_call = 1, call_number = ? WHERE id = 1')->execute([$num, $num]);

        $soc = json_decode((string)$pdo->query('SELECT socials FROM footer_settings WHERE id = 1')->fetchColumn(), true) ?: [];
        $soc['instagram'] = 'https://www.instagram.com/joshbrandmanagementsolutions?srtk=OWVlYXBhNTM4eWY1';
        $pdo->prepare('UPDATE footer_settings SET phone = ?, socials = ? WHERE id = 1')->execute([$num, json_encode($soc, JSON_UNESCAPED_SLASHES)]);
    },
];

$check = $pdo->prepare('SELECT 1 FROM site_meta WHERE k = ?');
$mark = $pdo->prepare('INSERT INTO site_meta (k, v) VALUES (?, ?)');
foreach ($updates as $key => $run) {
    $check->execute(["update:$key"]);
    if ($check->fetchColumn()) { echo "Update $key already applied.\n"; continue; }
    $run($pdo);
    $mark->execute(["update:$key", date('c')]);
    echo "Applied update $key.\n";
}
