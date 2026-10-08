<?php
// Automaticky skript pro odesilani poptavek z webu moravsky-grunt.cz (Restaurace Moravský Grunt – Bukovanský mlýn)
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Povolen je pouze POST pozadavek.']);
    exit;
}

// Antispam honeypot kontrola
if (!empty($_POST['website_url'])) {
    echo json_encode(['success' => true, 'message' => 'OK']);
    exit;
}

$name    = trim(strip_tags($_POST['name'] ?? ''));
$phone   = trim(strip_tags($_POST['phone'] ?? ''));
$email   = trim(filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
$service = trim(strip_tags($_POST['service'] ?? 'Obecny dotaz'));
$message = trim(strip_tags($_POST['message'] ?? ''));

if ($name === '' || $phone === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Vyplnte prosim vsechna povinna pole.']);
    exit;
}

$to = "info@moravsky-grunt.cz";
$subject = "=?UTF-8?B?" . base64_encode("Nova poptavka z webu (moravsky-grunt.cz): " . $service . " - " . $name) . "?=";

$body  = "Dobrý den,\n\n";
$body .= "z webového formuláře na stránkách Restaurace Moravský Grunt – Bukovanský mlýn (moravsky-grunt.cz) byla odeslána nová poptávka:\n\n";
$body .= "--------------------------------------------------\n";
$body .= "Jméno / Firma:   " . $name . "\n";
$body .= "Telefon:         " . $phone . "\n";
$body .= "E-mail:          " . $email . "\n";
$body .= "Vybraná služba:  " . $service . "\n";
$body .= "Datum a čas:     " . date('d.m.Y H:i:s') . "\n";
$body .= "--------------------------------------------------\n\n";
$body .= "Text zprávy / poptávky:\n" . $message . "\n\n";
$body .= "--------------------------------------------------\n";

$headers  = "MIME-Version: 1.0\r\n";
$headers .= "Content-type: text/plain; charset=UTF-8\r\n";
$headers .= "From: Webovy formular <noreply@moravsky-grunt.cz>\r\n";
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $headers .= "Reply-To: " . $email . "\r\n";
}

// Zapis do zalozniho logu na serveru
$logEntry = "[" . date('Y-m-d H:i:s') . "] " . $name . " | " . $phone . " | " . $email . " | " . $service . " | " . str_replace(["\r", "\n"], " ", $message) . PHP_EOL;
@file_put_contents(__DIR__ . '/poptavky.log', $logEntry, FILE_APPEND | LOCK_EX);

$sent = @mail($to, $subject, $body, $headers);

echo json_encode([
    'success' => true,
    'mail_sent' => $sent,
    'recipient' => $to,
    'message' => 'Poptávka byla úspěšně přijata a odeslána.'
]);
