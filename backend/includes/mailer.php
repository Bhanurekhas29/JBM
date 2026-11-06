<?php
// Minimal SMTP sender that uses the settings saved on the admin "Email Settings" page.
// Returns null on success, or a short error text.

function smtp_read($fp): string {
    $out = '';
    while (($line = fgets($fp, 1024)) !== false) {
        $out .= $line;
        if (strlen($line) < 4 || $line[3] === ' ') break;   // last line of a reply: "250 ..."
    }
    return $out;
}

function smtp_cmd($fp, string $cmd, array $okCodes): ?string {
    fwrite($fp, $cmd . "\r\n");
    $r = smtp_read($fp);
    return in_array((int)substr($r, 0, 3), $okCodes, true) ? null : trim($r);
}

function send_mail(string $to, string $subject, string $html, string $text): ?string {
    $c = db()->query('SELECT smtp_host, smtp_port, encryption, smtp_username, smtp_password, from_email, from_name FROM email_settings WHERE id = 1')->fetch();
    if (!$c || $c['smtp_host'] === '' || $c['from_email'] === '') return 'Email (SMTP) is not set up yet.';

    $pass = !empty($c['smtp_password']) ? decrypt_secret($c['smtp_password']) : '';
    $remote = ($c['encryption'] === 'ssl' ? 'ssl://' : 'tcp://') . $c['smtp_host'] . ':' . (int)$c['smtp_port'];
    $fp = @stream_socket_client($remote, $errno, $errstr, 12);
    if (!$fp) return "Could not connect to the mail server ($errstr).";
    stream_set_timeout($fp, 15);

    try {
        $greet = smtp_read($fp);
        if ((int)substr($greet, 0, 3) !== 220) return 'Mail server did not accept the connection.';
        $domain = preg_replace('/[^A-Za-z0-9.-]/', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost')) ?: 'localhost';
        if ($e = smtp_cmd($fp, "EHLO $domain", [250])) return $e;
        if ($c['encryption'] === 'tls') {
            if ($e = smtp_cmd($fp, 'STARTTLS', [220])) return $e;
            if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) return 'Could not start a secure mail connection.';
            if ($e = smtp_cmd($fp, "EHLO $domain", [250])) return $e;
        }
        if ($c['smtp_username'] !== '') {
            if ($e = smtp_cmd($fp, 'AUTH LOGIN', [334])) return $e;
            if ($e = smtp_cmd($fp, base64_encode($c['smtp_username']), [334])) return $e;
            if ($e = smtp_cmd($fp, base64_encode($pass), [235])) return 'Mail login was rejected: ' . $e;
        }
        if ($e = smtp_cmd($fp, 'MAIL FROM:<' . $c['from_email'] . '>', [250])) return $e;
        if ($e = smtp_cmd($fp, 'RCPT TO:<' . $to . '>', [250, 251])) return $e;
        if ($e = smtp_cmd($fp, 'DATA', [354])) return $e;

        $b = 'b' . bin2hex(random_bytes(8));
        $fromName = $c['from_name'] !== '' ? '=?UTF-8?B?' . base64_encode($c['from_name']) . '?= ' : '';
        $msg = 'From: ' . $fromName . '<' . $c['from_email'] . ">\r\n"
            . 'To: <' . $to . ">\r\n"
            . 'Subject: =?UTF-8?B?' . base64_encode($subject) . "?=\r\n"
            . 'Date: ' . date('r') . "\r\n"
            . 'Message-ID: <' . bin2hex(random_bytes(10)) . '@' . $domain . ">\r\n"
            . "MIME-Version: 1.0\r\n"
            . "Content-Type: multipart/alternative; boundary=\"$b\"\r\n\r\n"
            . "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($text)) . "\r\n"
            . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html)) . "\r\n"
            . "--$b--\r\n";
        fwrite($fp, $msg . "\r\n.\r\n");
        $r = smtp_read($fp);
        if ((int)substr($r, 0, 3) !== 250) return 'Mail server rejected the message: ' . trim($r);
        smtp_cmd($fp, 'QUIT', [221]);
        return null;
    } finally {
        @fclose($fp);
    }
}
