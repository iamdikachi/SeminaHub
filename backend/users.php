<?php
require_once 'db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ─── GET /users.php?id={uid} ───────────────────────────────────────────────
    // Returns the user profile for a given UID.
    case 'GET':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendResponse(400, ["error" => "Missing required parameter: id"]);
        }
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $user = $stmt->fetch();
        if (!$user) {
            sendResponse(404, ["error" => "User not found"]);
        }
        sendResponse(200, $user);
        break;

    // ─── POST /users.php ────────────────────────────────────────────────────────
    // Creates or updates a user profile (upsert).
    // Body: { id, name, email, role }
    case 'POST':
        $body = getRequestBody();
        $id    = $body['id']    ?? null;
        $name  = $body['name']  ?? null;
        $email = $body['email'] ?? null;
        $role  = $body['role']  ?? 'Attendee';

        if (!$id || !$name || !$email) {
            sendResponse(400, ["error" => "Missing required fields: id, name, email"]);
        }

        $validRoles = ['Attendee', 'Organizer', 'Admin'];
        if (!in_array($role, $validRoles)) {
            sendResponse(400, ["error" => "Invalid role. Must be one of: " . implode(', ', $validRoles)]);
        }

        // Upsert: insert new or update existing profile
        $stmt = $pdo->prepare("
            INSERT INTO users (id, name, email, role)
            VALUES (:id, :name, :email, :role)
            ON DUPLICATE KEY UPDATE
                name  = VALUES(name),
                email = VALUES(email),
                role  = VALUES(role)
        ");
        $stmt->execute([
            ':id'    => $id,
            ':name'  => $name,
            ':email' => $email,
            ':role'  => $role,
        ]);

        // Return the updated profile
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(200, $stmt->fetch());
        break;

    // ─── PUT /users.php ─────────────────────────────────────────────────────────
    // Updates a user's role.
    // Body: { id, role }
    case 'PUT':
        $body = getRequestBody();
        $id   = $body['id']   ?? null;
        $role = $body['role'] ?? null;

        if (!$id || !$role) {
            sendResponse(400, ["error" => "Missing required fields: id, role"]);
        }

        $validRoles = ['Attendee', 'Organizer', 'Admin'];
        if (!in_array($role, $validRoles)) {
            sendResponse(400, ["error" => "Invalid role"]);
        }

        $stmt = $pdo->prepare("UPDATE users SET role = :role WHERE id = :id");
        $stmt->execute([':role' => $role, ':id' => $id]);

        if ($stmt->rowCount() === 0) {
            sendResponse(404, ["error" => "User not found or no changes made"]);
        }

        sendResponse(200, ["message" => "Role updated successfully"]);
        break;

    default:
        sendResponse(405, ["error" => "Method not allowed"]);
}
