<?php
declare(strict_types=1);

$GLOBALS['jbm_config'] = require __DIR__ . '/../config/config.php';

function cfg(string $key) { return $GLOBALS['jbm_config'][$key]; }

/** PDO options; adds an encrypted (TLS) connection when DB_SSL=1 (required by TiDB Cloud). */
function pdo_options(array $extra = []): array {
    $c = cfg('db');
    $o = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION] + $extra;
    if (!empty($c['ssl'])) {
        $o[PDO::MYSQL_ATTR_SSL_CA] = $c['ssl_ca'];
        $o[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = true;
    }
    return $o;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $c = cfg('db');
    $dsn = "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset={$c['charset']}";
    $pdo = new PDO($dsn, $c['user'], $c['pass'], pdo_options([
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]));
    return $pdo;
}

function json_out(array $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function api_init(string|array $methods): void {
    $methods = (array)$methods;
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin && in_array($origin, cfg('allowed_origins'), true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Vary: Origin');
    }
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) json_out(['ok' => false, 'message' => 'Method not allowed'], 405);

    session_name(cfg('session_name'));
    session_set_cookie_params([
        'lifetime' => cfg('session_lifetime'),
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    ]);
    session_start();
}

function request_json(): array {
    $raw = file_get_contents('php://input') ?: '';
    if (trim($raw) === '') return [];
    $d = json_decode($raw, true);
    // A malformed body must never be treated as "empty data" (it could blank saved settings).
    if (!is_array($d)) json_out(['ok' => false, 'message' => 'Invalid request data.'], 400);
    return $d;
}

function require_auth(): int {
    if (empty($_SESSION['admin_id'])) json_out(['ok' => false, 'message' => 'Not authenticated'], 401);
    // A deactivated or deleted user loses access immediately, even with a live session.
    $st = db()->prepare('SELECT is_active FROM admins WHERE id = ?');
    $st->execute([$_SESSION['admin_id']]);
    $active = $st->fetchColumn();
    if ($active === false || !(int)$active) {
        $_SESSION = [];
        json_out(['ok' => false, 'message' => 'Account disabled.'], 401);
    }
    return (int)$_SESSION['admin_id'];
}

// AES-256-GCM encryption for stored secrets (SMTP password).
function secret_key(): string {
    if (cfg('app_key') === '') throw new RuntimeException('APP_KEY is not configured.');
    return hash('sha256', cfg('app_key'), true);
}
function encrypt_secret(string $plain): string {
    if ($plain === '') return '';
    $iv = random_bytes(12);
    $ct = openssl_encrypt($plain, 'aes-256-gcm', secret_key(), OPENSSL_RAW_DATA, $iv, $tag);
    return base64_encode($iv . $tag . $ct);
}
function decrypt_secret(string $stored): string {
    if ($stored === '') return '';
    $raw = base64_decode($stored, true);
    if ($raw === false || strlen($raw) < 29) return '';
    $pt = openssl_decrypt(substr($raw, 28), 'aes-256-gcm', secret_key(), OPENSSL_RAW_DATA, substr($raw, 0, 12), substr($raw, 12, 16));
    return $pt === false ? '' : $pt;
}
