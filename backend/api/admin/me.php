<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init('GET');
require_auth();
json_out(['ok' => true, 'user' => ['id' => $_SESSION['admin_id'], 'username' => $_SESSION['admin_username'], 'last_login' => $_SESSION['prev_login'] ?? null], 'server_time' => date('c')]);
