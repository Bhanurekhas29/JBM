<?php
require __DIR__ . '/../../includes/bootstrap.php';
api_init('POST');
$_SESSION = [];
session_destroy();
json_out(['ok' => true]);
