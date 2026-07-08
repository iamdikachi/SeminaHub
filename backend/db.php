<?php
// CORS Headers to allow requests from the React Vite frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Configuration (Customize these connection variables as needed)
define('DB_HOST', 'localhost');
define('DB_NAME', 'seminar_hub');
define('DB_USER', 'root');
define('DB_PASS', '');

/**
 * Establish a PDO MySQL connection singleton.
 * @return PDO
 */
function getDbConnection() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            sendResponse(500, ["error" => "Database connection failed: " . $e->getMessage()]);
        }
    }
    return $pdo;
}

/**
 * Helper function to send standardized HTTP JSON responses.
 * @param int $statusCode
 * @param array|object $data
 */
function sendResponse($statusCode, $data) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

/**
 * Helper function to parse incoming JSON request body.
 * @return array
 */
function getRequestBody() {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);
    return is_array($decoded) ? $decoded : [];
}
