<?php
// Run once from CLI:  php backend/database/seed.php
// Creates the database/tables and the default admin user (password from ADMIN_PASSWORD, default Admin@2026 for local use).
if (PHP_SAPI !== 'cli') { http_response_code(403); exit('CLI only'); }
require __DIR__ . '/../includes/bootstrap.php';

$c = cfg('db');
$root = new PDO("mysql:host={$c['host']};port={$c['port']};charset={$c['charset']}", $c['user'], $c['pass'], pdo_options());
$root->exec(file_get_contents(__DIR__ . '/schema.sql'));

// Migrations for databases created before these columns existed
$cols = db()->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admins'")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('full_name', $cols)) db()->exec("ALTER TABLE admins ADD full_name VARCHAR(100) NOT NULL DEFAULT '' AFTER password_hash");
if (!in_array('email', $cols)) db()->exec("ALTER TABLE admins ADD email VARCHAR(150) NOT NULL DEFAULT '' AFTER full_name");
if (!in_array('is_active', $cols)) db()->exec("ALTER TABLE admins ADD is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER email");
if (!in_array('is_superuser', $cols)) db()->exec("ALTER TABLE admins ADD is_superuser TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active");
$bcols = db()->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'brand'")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('show_credits', $bcols)) db()->exec("ALTER TABLE brand ADD show_credits TINYINT(1) NOT NULL DEFAULT 1 AFTER favicon");

if (!in_array('credits_url', $bcols)) db()->exec("ALTER TABLE brand ADD credits_url VARCHAR(255) NOT NULL DEFAULT '' AFTER show_credits");

// Default admin user (only created if missing; an existing password is never changed)
$adminExists = (bool)db()->query("SELECT 1 FROM admins WHERE username = 'admin'")->fetchColumn();
if (!$adminExists) {
    $pw = cfg('admin_password');
    $isLocal = in_array(cfg('db')['host'], ['127.0.0.1', 'localhost'], true);
    if ($pw === '') {
        if ($isLocal) { $pw = 'Admin@2026'; }
        else { $pw = bin2hex(random_bytes(8)); echo "ADMIN_PASSWORD was not set. Generated password for user 'admin': $pw  (change it in Admin > Users)
"; }
    }
    db()->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)')->execute(['admin', password_hash($pw, PASSWORD_DEFAULT)]);
}
db()->exec("UPDATE admins SET is_superuser = 1, is_active = 1 WHERE username = 'admin'");
db()->exec("INSERT IGNORE INTO brand (id, website_name) VALUES (1, 'JBM')");
foreach (['company_name' => 100, 'company_descriptor' => 120, 'tagline' => 120] as $col => $len) {
    if (!in_array($col, $bcols)) db()->exec("ALTER TABLE brand ADD $col VARCHAR($len) NOT NULL DEFAULT ''");
}
db()->exec("UPDATE brand SET company_name='JOSH', company_descriptor='Brand Management Solutions', tagline='Build · Protect · Grow' WHERE id=1 AND company_name='' AND company_descriptor='' AND tagline=''");

db()->exec("INSERT IGNORE INTO header_settings (id, topbar_left, topbar_right, cta_label, cta_url) VALUES (1,
  'Intellectual Property • Brand Protection • Business Growth',
  'Professional solutions for entrepreneurs, startups, innovators and established businesses.',
  'Start an Enquiry', '#contact')");
if ((int)db()->query('SELECT COUNT(*) FROM website_menu')->fetchColumn() === 0) {
    $ins = db()->prepare('INSERT INTO website_menu (label, url, sort_order) VALUES (?,?,?)');
    foreach ([['Home', '#home'], ['IP Services', '#ip-services'], ['Business Growth', '#business-growth'], ['How It Works', '#how-it-works'], ['About', '#about'], ['Contact', '#contact']] as $i => [$l, $u]) $ins->execute([$l, $u, $i + 1]);
}
db()->exec("INSERT IGNORE INTO seo (id) VALUES (1)");
db()->exec("INSERT IGNORE INTO email_settings (id) VALUES (1)");
$heroDefaults = [
    'eyebrow' => 'Your Ideas Deserve Protection',
    'headline_1' => 'Build your brand', 'headline_2' => 'Protect your ideas', 'headline_3' => 'Grow with confidence',
    'description' => "JBM Solutions helps entrepreneurs, startups and businesses protect their intellectual property, establish stronger commercial relationships and build distinctive brands through a coordinated range of professional services.\n\nFrom trademark and patent support to commercial agreements and brand development, we bring essential business solutions together under one platform.",
    'btn1_label' => 'Explore IP Services', 'btn1_url' => '#ip-services', 'btn2_label' => 'Discuss Your Requirements', 'btn2_url' => '#contact',
    'card_title' => 'Protect what makes you different.',
    'card_text' => 'Your brand, innovations and creative work deserve the right protection.',
    'card_points' => json_encode(['Trademark registration support', 'Patent filing coordination', 'Copyright and design registration', 'IP portfolio and documentation support']),
    'highlights' => json_encode([
        ['icon' => 'shield', 'label' => 'Our Model', 'title' => 'IP-First Service Approach'],
        ['icon' => 'document', 'label' => 'Pricing', 'title' => 'Transparent Scope & Quotations'],
        ['icon' => 'bolt', 'label' => 'Execution', 'title' => 'Coordinated Professional Delivery'],
        ['icon' => 'users', 'label' => 'Our Focus', 'title' => 'Built Around Business Owners'],
    ]),
];
$cols = implode(',', array_keys($heroDefaults));
$qs = implode(',', array_fill(0, count($heroDefaults), '?'));
db()->prepare("INSERT IGNORE INTO hero_settings (id, $cols) VALUES (1, $qs)")->execute(array_values($heroDefaults));
db()->prepare("INSERT IGNORE INTO ip_services_section (id, eyebrow, heading_plain, heading_gold, description) VALUES (1, ?, ?, ?, ?)")->execute([
    'Intellectual Property Services', 'Protect your brand, creations', 'and innovations.',
    'Secure the intellectual property that drives your business forward. We provide coordinated support across trademarks, patents, copyrights, industrial designs and commercialisation.',
]);
if ((int)db()->query('SELECT COUNT(*) FROM ip_services')->fetchColumn() === 0) {
    $ins = db()->prepare('INSERT INTO ip_services (category, title, description, button_label, button_url, sort_order) VALUES (?,?,?,?,?,?)');
    foreach ([
        ['Brand identity', 'Trademark Registration', 'Establish and protect your brand identity with professional trademark search, application preparation and filing support.'],
        ['Inventions', 'Patent Services', 'Support your inventions and technological innovations through structured patent searches, documentation and application filing coordination.'],
        ['Creative works', 'Copyright Registration', 'Protect your original creative works through organised documentation and copyright registration assistance.'],
        ['Product appearance', 'Industrial Design Registration', 'Protect the distinctive visual appearance of your products with professional design documentation and registration support.'],
        ['IP strategy', 'IP Documentation & Portfolio Management', 'Organise, document and manage your intellectual property assets with structured support for ownership, records and commercial requirements.'],
        ['Commercialisation', 'IP Assignment & Licensing Support', 'Facilitate the commercial use, transfer and licensing of intellectual property through structured documentation and professional coordination.'],
    ] as $i => [$c, $t, $d]) $ins->execute([$c, $t, $d, 'Explore Service', '#contact', $i + 1]);
}
$svcCols = db()->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ip_services'")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('is_wide', $svcCols)) db()->exec("ALTER TABLE ip_services ADD is_wide TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active");
if (!(int)db()->query("SELECT COUNT(*) FROM ip_services WHERE title = 'Commercial Contracts & Agreements'")->fetchColumn()) {
    $n = (int)db()->query('SELECT COALESCE(MAX(sort_order), 0) FROM ip_services')->fetchColumn();
    db()->prepare('INSERT INTO ip_services (category, title, description, button_label, button_url, sort_order, is_wide) VALUES (?,?,?,?,?,?,1)')->execute([
        'Commercial legal documentation', 'Commercial Contracts & Agreements',
        'Build stronger business relationships with clearly structured commercial agreements tailored to your business requirements.',
        'Explore Service', '#contact', $n + 1,
    ]);
}
db()->prepare("INSERT IGNORE INTO growth_section (id, eyebrow, heading_before, heading_gold, heading_after, description) VALUES (1, ?, ?, ?, ?, ?)")->execute([
    'Our Services', 'Give your business a', 'stronger', 'presence.',
    'Beyond intellectual property protection, we help businesses establish their identity, strengthen their digital presence and communicate their value through creative and strategic solutions.',
]);
if ((int)db()->query('SELECT COUNT(*) FROM growth_cards')->fetchColumn() === 0) {
    $ins = db()->prepare('INSERT INTO growth_cards (category, title, description, list_title, items, button_label, button_url, sort_order) VALUES (?,?,?,?,?,?,?,?)');
    $ins->execute(['Digital Marketing', 'Digital Marketing', 'Promote your brand and reach the right audience through strategic digital solutions designed to strengthen visibility and business growth.',
        'Our Services', json_encode(['Social Media Management', 'Content & Advertising', 'SEO & Performance Marketing', 'Brand Growth Strategies']), 'Explore Digital Marketing', '#contact', 1]);
    $ins->execute(['Graphic Design', 'Graphic Design', "Create a visually strong brand identity that communicates your business's value, personality and purpose.",
        'Our Services', json_encode(['Logo & Brand Identity', 'Social Media Creatives', 'Print & Digital Designs', 'Marketing Collateral']), 'Explore Graphic Design', '#contact', 2]);
}
db()->prepare("INSERT IGNORE INTO how_section (id, eyebrow, heading_before, heading_gold, description) VALUES (1, ?, ?, ?, ?)")->execute([
    'How It Works', 'From requirement', 'to result.',
    'Every successful engagement begins with understanding your needs. Our structured process keeps things simple, transparent and focused on delivering the right solution.',
]);
if ((int)db()->query('SELECT COUNT(*) FROM how_steps')->fetchColumn() === 0) {
    $ins = db()->prepare('INSERT INTO how_steps (title, description, icon, sort_order) VALUES (?,?,?,?)');
    foreach ([
        ['Choose a service', 'Explore our services and select the solution that best matches your business or intellectual property requirements.', 'pointer'],
        ['Share Your Requirements', 'Tell us about your project, objectives and relevant documentation so we can understand your specific needs.', 'document'],
        ['Review & quotation', 'We assess your requirements, clarify the scope of work and provide a transparent quotation outlining applicable charges and deliverables.', 'review'],
        ['Confirm & proceed', 'Once you approve the scope and quotation, we coordinate the engagement with the appropriate professional or specialist.', 'handshake'],
    ] as $i => [$t, $d, $ic]) $ins->execute([$t, $d, $ic, $i + 1]);
}
db()->prepare("INSERT IGNORE INTO cta_banner (id, tagline, heading_before, heading_gold, heading_after, description, button_label, button_url) VALUES (1, ?, ?, ?, ?, ?, ?, ?)")->execute([
    'Patent • Trademark • Copyright • Commercial Agreements',
    'Not sure which', 'IP service', 'you need?',
    'Every business has different protection requirements. Let us understand your idea, brand or innovation and help identify the appropriate service pathway.',
    'Talk to Our Team', '#contact',
]);
db()->prepare("INSERT IGNORE INTO approach (id, eyebrow, heading_before, heading_gold, description, image_caption, features, button_label, button_url) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)")->execute([
    'Our Approach', 'One coordinated starting point for', 'brand protection and growth.',
    "From trademarks and patents to commercial agreements and brand development, JBM Solutions brings essential business support together through one coordinated service platform.\n\nOur approach is built around understanding your requirements, identifying the appropriate expertise and facilitating a structured service experience.",
    'Build · Protect · Grow',
    json_encode([
        ['icon' => 'target', 'title' => 'Strategic Guidance', 'text' => 'Understand your requirements and identify suitable service pathways.'],
        ['icon' => 'layers', 'title' => 'Comprehensive Support', 'text' => 'Access coordinated assistance across intellectual property, commercial documentation and business development.'],
        ['icon' => 'trend', 'title' => 'Long-Term Growth', 'text' => 'Build stronger business foundations and support the development of your brand and intellectual assets.'],
    ], JSON_UNESCAPED_UNICODE),
    'Start Your IP Journey', '#contact',
]);
db()->exec("INSERT IGNORE INTO faq_section (id, eyebrow, heading_before, heading_gold) VALUES (1, 'FAQs', 'Answers before you', 'begin.')");
if ((int)db()->query('SELECT COUNT(*) FROM faq_items')->fetchColumn() === 0) {
    $ins = db()->prepare('INSERT INTO faq_items (question, answer, sort_order, is_active) VALUES (?,?,?,?)');
    // Only the first answer was provided; the rest stay inactive until the owner writes the answers.
    $ins->execute(['Does JBM guarantee trademark or patent registration?', 'No. Registration decisions are made by the relevant statutory authorities. Searches and assessments can help identify potential issues, but cannot guarantee acceptance or registration.', 1, 1]);
    foreach (['Are government fees included in the quotation?', 'Can I enquire if I do not know the relevant IP category?', 'Who handles specialist patent or legal work?', 'Can I request multiple services together?', 'How long does the process take?'] as $i => $q) {
        $ins->execute([$q, '', $i + 2, 0]);
    }
}
$enqCols = db()->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'enquiries'")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('organization', $enqCols)) db()->exec("ALTER TABLE enquiries ADD organization VARCHAR(150) NOT NULL DEFAULT '' AFTER service");

db()->prepare("INSERT IGNORE INTO contact_section (id, eyebrow, heading_before, heading_gold, description, points, form_title, form_subtitle, consent_text, button_label, success_message, service_options) VALUES (1,?,?,?,?,?,?,?,?,?,?,?)")->execute([
    'Get In Touch', 'Tell us what you want to', 'build or protect.',
    'Our team is here to help you identify the right solution. Share your requirements and we will get back to you with the next steps.',
    json_encode([
        ['icon' => 'bolt', 'title' => 'Quick Response', 'text' => 'We aim to respond to enquiries within 24 business hours.'],
        ['icon' => 'shield', 'title' => 'Trusted & Secure', 'text' => 'Your information is handled in accordance with our privacy practices.'],
        ['icon' => 'users', 'title' => 'Dedicated Support', 'text' => 'Get assistance throughout your service engagement.'],
    ], JSON_UNESCAPED_UNICODE),
    "Let's understand your requirements.",
    'Fill in the form below and our team will get in touch with you to discuss your requirements.',
    'I agree that JBM Solutions may contact me regarding this enquiry. I acknowledge that my information will be handled in accordance with the Privacy Policy.',
    'Send Enquiry',
    'Thank you! Your enquiry has been received. We will get back to you shortly.',
    json_encode(['Trademark Registration', 'Patent Services', 'Copyright Registration', 'Industrial Design Registration', 'IP Documentation & Portfolio'], JSON_UNESCAPED_UNICODE),
]);

db()->prepare("INSERT IGNORE INTO footer_settings (id, about_text, link_columns, office_hours, address, bottom_tagline, copyright_text, socials) VALUES (1,?,?,?,?,?,?,?)")->execute([
    'IP-focused services and coordinated business-growth support for entrepreneurs, innovators and businesses.',
    json_encode([
        ['title' => 'Our Services', 'links' => [
            ['label' => 'Trademark & IP services', 'url' => '#ip-services'], ['label' => 'Patent services', 'url' => '#ip-services'],
            ['label' => 'Copyright & design', 'url' => '#ip-services'], ['label' => 'Commercial contracts', 'url' => '#ip-services'],
            ['label' => 'Digital marketing', 'url' => '#our-services'], ['label' => 'Graphic design', 'url' => '#our-services']]],
        ['title' => 'Explore', 'links' => [
            ['label' => 'About JBM', 'url' => '#about'], ['label' => 'How it works', 'url' => '#how-it-works'],
            ['label' => 'FAQs', 'url' => '#faqs'], ['label' => 'Contact / Enquiry', 'url' => '#contact']]],
        ['title' => 'Legal', 'links' => [
            ['label' => 'Privacy Policy', 'url' => '#legal:privacy-policy'], ['label' => 'Terms & Conditions', 'url' => '#legal:terms-and-conditions'],
            ['label' => 'Refund & Cancellation Policy', 'url' => '#legal:refund-and-cancellation-policy'], ['label' => 'Disclaimer', 'url' => '#legal:disclaimer']]],
    ], JSON_UNESCAPED_UNICODE),
    'Monday - Saturday, 9.00 AM - 7.00 PM IST', 'Coimbatore, Tamilnadu, India.',
    'Protecting ideas. Strengthening businesses. Building brands.',
    '© {year} JBM Solutions. All rights reserved.',
    json_encode(['linkedin' => '', 'instagram' => '', 'x' => '']),
]);
if ((int)db()->query('SELECT COUNT(*) FROM legal_pages')->fetchColumn() === 0) {
    // Titles only: the legal text must come from the owner, so these stay inactive until content is added.
    $ins = db()->prepare('INSERT INTO legal_pages (title, slug, content, sort_order, is_active) VALUES (?,?,?,?,0)');
    foreach ([['Privacy Policy', 'privacy-policy'], ['Terms & Conditions', 'terms-and-conditions'], ['Refund & Cancellation Policy', 'refund-and-cancellation-policy'], ['Disclaimer', 'disclaimer']] as $i => [$t, $sl]) $ins->execute([$t, $sl, '', $i + 1]);
}
// Footer "Legal" links used to point at /paths; make them open the popup pages instead.
$fc = db()->query('SELECT link_columns FROM footer_settings WHERE id = 1')->fetchColumn();
if ($fc) {
    $cols = json_decode($fc, true) ?: [];
    $map = ['/privacy-policy' => '#legal:privacy-policy', '/terms-and-conditions' => '#legal:terms-and-conditions', '/refund-and-cancellation-policy' => '#legal:refund-and-cancellation-policy', '/disclaimer' => '#legal:disclaimer'];
    $changed = false;
    foreach ($cols as &$c) foreach ($c['links'] as &$l) if (isset($map[$l['url']])) { $l['url'] = $map[$l['url']]; $changed = true; }
    unset($c, $l);
    if ($changed) db()->prepare('UPDATE footer_settings SET link_columns = ? WHERE id = 1')->execute([json_encode($cols, JSON_UNESCAPED_UNICODE)]);
}
db()->exec("INSERT IGNORE INTO floating_icons (id) VALUES (1)");
$ipsCols = db()->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ip_services_section'")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('popup_label', $ipsCols)) db()->exec("ALTER TABLE ip_services_section ADD popup_label VARCHAR(60) NOT NULL DEFAULT 'JBM Service Overview'");
if (!in_array('popup_button_label', $ipsCols)) db()->exec("ALTER TABLE ip_services_section ADD popup_button_label VARCHAR(60) NOT NULL DEFAULT 'Enquire about this service'");
$ipCols = db()->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ip_services'")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('features', $ipCols)) db()->exec("ALTER TABLE ip_services ADD features TEXT NULL AFTER is_wide");
// Only the Trademark tick list was provided; the other services stay empty until the owner writes theirs.
db()->prepare("UPDATE ip_services SET features = ? WHERE title = 'Trademark Registration' AND (features IS NULL OR features = '' OR features = '[]')")
    ->execute([json_encode(['Trademark availability searches', 'Wordmark and logo applications', 'Application filing coordination', 'Examination and objection support'])]);
echo "Database ready. Admin user 'admin' created.\n";
