<?php
require_once 'db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ─── GET /registrations.php ─────────────────────────────────────────────────
    // Query params: ?user_id=, ?seminar_id=, ?id=
    case 'GET':
        $userId    = $_GET['user_id']    ?? null;
        $seminarId = $_GET['seminar_id'] ?? null;
        $id        = $_GET['id']         ?? null;

        // Fetch a single registration by ID
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM registrations WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $reg = $stmt->fetch();
            if (!$reg) sendResponse(404, ["error" => "Registration not found"]);
            sendResponse(200, mapRegistration($reg));
        }

        // All registrations for a specific user
        if ($userId) {
            $stmt = $pdo->prepare("SELECT * FROM registrations WHERE user_id = :user_id ORDER BY created_at DESC");
            $stmt->execute([':user_id' => $userId]);
            sendResponse(200, array_map('mapRegistration', $stmt->fetchAll()));
        }

        // All registrations for a specific seminar (organizer roster view)
        if ($seminarId) {
            $stmt = $pdo->prepare("SELECT * FROM registrations WHERE seminar_id = :seminar_id ORDER BY created_at ASC");
            $stmt->execute([':seminar_id' => $seminarId]);
            sendResponse(200, array_map('mapRegistration', $stmt->fetchAll()));
        }

        // Return all registrations (Admin usage)
        $stmt = $pdo->query("SELECT * FROM registrations ORDER BY created_at DESC");
        sendResponse(200, array_map('mapRegistration', $stmt->fetchAll()));
        break;

    // ─── POST /registrations.php ────────────────────────────────────────────────
    // Registers a user for a seminar (handles capacity check + waitlisting).
    // Body: { id, userId, userName, userEmail, seminarId, seminarTitle, code, organizerId }
    case 'POST':
        $body = getRequestBody();
        $required = ['id', 'userId', 'userName', 'userEmail', 'seminarId', 'seminarTitle', 'code', 'organizerId'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                sendResponse(400, ["error" => "Missing required field: {$field}"]);
            }
        }

        // Check if user is already registered or waitlisted for this seminar
        $check = $pdo->prepare("
            SELECT id FROM registrations
            WHERE user_id = :user_id AND seminar_id = :seminar_id AND status != 'cancelled'
        ");
        $check->execute([':user_id' => $body['userId'], ':seminar_id' => $body['seminarId']]);
        if ($check->fetch()) {
            sendResponse(409, ["error" => "User is already registered or waitlisted for this seminar"]);
        }

        // Fetch the seminar to check capacity
        $semStmt = $pdo->prepare("SELECT capacity, registered_count FROM seminars WHERE id = :id");
        $semStmt->execute([':id' => $body['seminarId']]);
        $seminar = $semStmt->fetch();
        if (!$seminar) sendResponse(404, ["error" => "Seminar not found"]);

        $status = ($seminar['registered_count'] >= $seminar['capacity']) ? 'waitlisted' : 'registered';

        // Insert the registration
        $stmt = $pdo->prepare("
            INSERT INTO registrations (id, user_id, user_name, user_email, seminar_id, seminar_title, code, status, created_at, organizer_id)
            VALUES (:id, :user_id, :user_name, :user_email, :seminar_id, :seminar_title, :code, :status, :created_at, :organizer_id)
        ");
        $stmt->execute([
            ':id'            => $body['id'],
            ':user_id'       => $body['userId'],
            ':user_name'     => $body['userName'],
            ':user_email'    => $body['userEmail'],
            ':seminar_id'    => $body['seminarId'],
            ':seminar_title' => $body['seminarTitle'],
            ':code'          => $body['code'],
            ':status'        => $status,
            ':created_at'    => $body['createdAt'] ?? date('Y-m-d H:i:s'),
            ':organizer_id'  => $body['organizerId'],
        ]);

        // If registered (not waitlisted), increment the seminar's registered_count
        if ($status === 'registered') {
            $upd = $pdo->prepare("UPDATE seminars SET registered_count = registered_count + 1 WHERE id = :id");
            $upd->execute([':id' => $body['seminarId']]);
        }

        $fetch = $pdo->prepare("SELECT * FROM registrations WHERE id = :id");
        $fetch->execute([':id' => $body['id']]);
        sendResponse(201, mapRegistration($fetch->fetch()));
        break;

    // ─── PUT /registrations.php ──────────────────────────────────────────────────
    // Cancels a registration and promotes the top waitlisted person.
    // Body: { id }
    case 'PUT':
        $body = getRequestBody();
        $id = $body['id'] ?? null;
        if (!$id) sendResponse(400, ["error" => "Missing required field: id"]);

        // Fetch the registration to cancel
        $fetch = $pdo->prepare("SELECT * FROM registrations WHERE id = :id");
        $fetch->execute([':id' => $id]);
        $reg = $fetch->fetch();
        if (!$reg) sendResponse(404, ["error" => "Registration not found"]);

        $wasRegistered = ($reg['status'] === 'registered');

        // Mark as cancelled
        $cancel = $pdo->prepare("UPDATE registrations SET status = 'cancelled' WHERE id = :id");
        $cancel->execute([':id' => $id]);

        // If this was a confirmed seat, decrement count and promote first waitlisted attendee
        if ($wasRegistered) {
            $pdo->prepare("UPDATE seminars SET registered_count = GREATEST(registered_count - 1, 0) WHERE id = :seminar_id")
                ->execute([':seminar_id' => $reg['seminar_id']]);

            $promote = $pdo->prepare("
                SELECT id FROM registrations
                WHERE seminar_id = :seminar_id AND status = 'waitlisted'
                ORDER BY created_at ASC
                LIMIT 1
            ");
            $promote->execute([':seminar_id' => $reg['seminar_id']]);
            $next = $promote->fetch();

            if ($next) {
                $pdo->prepare("UPDATE registrations SET status = 'registered' WHERE id = :id")
                    ->execute([':id' => $next['id']]);
                $pdo->prepare("UPDATE seminars SET registered_count = registered_count + 1 WHERE id = :seminar_id")
                    ->execute([':seminar_id' => $reg['seminar_id']]);
            }
        }

        sendResponse(200, ["message" => "Registration cancelled", "wasRegistered" => $wasRegistered]);
        break;

    // ─── DELETE /registrations.php?id={id} ───────────────────────────────────────
    // Hard deletes a registration record.
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendResponse(400, ["error" => "Missing required parameter: id"]);

        $stmt = $pdo->prepare("DELETE FROM registrations WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) sendResponse(404, ["error" => "Registration not found"]);

        sendResponse(200, ["message" => "Registration deleted successfully"]);
        break;

    default:
        sendResponse(405, ["error" => "Method not allowed"]);
}

/**
 * Maps a database registration row to the camelCase shape expected by the frontend.
 */
function mapRegistration(array $row): array {
    return [
        'id'           => $row['id'],
        'userId'       => $row['user_id'],
        'userName'     => $row['user_name'],
        'userEmail'    => $row['user_email'],
        'seminarId'    => $row['seminar_id'],
        'seminarTitle' => $row['seminar_title'],
        'code'         => $row['code'],
        'status'       => $row['status'],
        'createdAt'    => $row['created_at'],
        'organizerId'  => $row['organizer_id'],
    ];
}
