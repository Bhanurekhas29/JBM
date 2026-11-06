<?php
// JBM backend configuration.
//
// Settings come from environment variables (this is how Render passes them in production),
// with safe local defaults. For local development, put your own values in
// backend/config/config.local.php - that file is git-ignored, so passwords never reach GitHub.

$env = static function (string $key, string $default = ''): string {
    $v = getenv($key);
    return ($v === false || $v === '') ? $default : $v;
};

$config = [
    'db' => [
        'host'    => $env('DB_HOST', '127.0.0.1'),
        'port'    => (int)$env('DB_PORT', '3306'),
        'name'    => $env('DB_NAME', 'jbm'),
        'user'    => $env('DB_USER', 'root'),
        'pass'    => $env('DB_PASS', ''),
        'charset' => 'utf8mb4',
        'ssl'     => $env('DB_SSL', '') === '1',    // TiDB Cloud requires an encrypted (TLS) connection
        'ssl_ca'  => $env('DB_SSL_CA', '/etc/ssl/certs/ca-certificates.crt'),
    ],
    // Secret used to encrypt stored secrets (e.g. the SMTP password). Keep it private;
    // changing it makes already-saved secrets unreadable.
    'app_key' => $env('APP_KEY', ''),
    // Password for the default "admin" user, used only when the database is first created.
    // Empty = Admin@2026 on a local database, or a random password (printed once in the log) on a hosted one.
    'admin_password' => $env('ADMIN_PASSWORD', ''),
    'session_name' => 'JBMADMINSESS',
    'session_lifetime' => 60 * 60 * 8, // 8 hours
    // Origins allowed to call the API from another address (the Vite dev server). Same-origin needs none.
    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', $env('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))))),
];

$local = __DIR__ . '/config.local.php';
if (is_file($local)) {
    $config = array_replace_recursive($config, require $local);
}
return $config;
