<?php
require_once 'db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ─── GET /checkin.php?session_id={id} ──────────────────────────────────────
    // Returns all attendances for a specific session.
    case 'GET':
        $sessionId = $_GET['session_id'] ?? null;
        $seminarId = $_GET['seminar_id'] ?? null;

        if ($sessionId) {
            $stmt = $pdo->prepare("SELECT * FROM attendances WHERE session_id = :session_id ORDER BY checked_in_at ASC");
            $stmt->execute([':session_id' => $sessionId]);
            $rows = $stmt->fetchAll();
            sendResponse(200, [$sessionId => array_map('mapAttendance', $rows)]);
        }

        // Return all attendances grouped by session_id (for a given seminar if provided)
        if ($seminarId) {
            $stmt = $pdo->prepare("SELECT * FROM attendances WHERE seminar_id = :seminar_id ORDER BY session_id, checked_in_at ASC");
            $stmt->execute([':seminar_id' => $seminarId]);
        } else {
            $stmt = $pdo->query("SELECT * FROM attendances ORDER BY session_id, checked_in_at ASC");
        }
        $rows = $stmt->fetchAll();

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row['session_id']][] = mapAttendance($row);
        }
        sendResponse(200, $grouped);
        break;

    // ─── POST /checkin.php ───────────────────────────────────────────────────────
    // Validates and records a check-in using a ticket code.
    // Body: { seminarId, sessionId, code }
    case 'POST':
        $body      = getRequestBody();
        $seminarId = $body['seminarId'] ?? null;
        $sessionId = $body['sessionId'] ?? null;
        $code      = $body['code']      ?? null;

        if (!$seminarId || !$sessionId || !$code) {
            sendResponse(400, ["error" => "Missing required fields: seminarId, sessionId, code"]);
        }

        // 1. Look up the registration by code + seminarId
        $regStmt = $pdo->prepare("
            SELECT * FROM registrations
            WHERE code = :code AND seminar_id = :seminar_id AND status = 'registered'
        ");
        $regStmt->execute([':code' => $code, ':seminar_id' => $seminarId]);
        $reg = $regStmt->fetch();

        if (!$reg) {
            sendResponse(404, [
                "success" => false,
                "message" => "No valid registered ticket found for this code and seminar. Check that the ticket has not been cancelled or is on the waitlist."
            ]);
        }

        // 2. Check for duplicate check-in in the same session
        $dupStmt = $pdo->prepare("
            SELECT id FROM attendances
            WHERE registration_id = :reg_id AND session_id = :session_id
        ");
        $dupStmt->execute([':reg_id' => $reg['id'], ':session_id' => $sessionId]);
        if ($dupStmt->fetch()) {
            sendResponse(409, [
                "success" => false,
                "message" => "Attendee '{$reg['user_name']}' has already been checked into this session."
            ]);
        }

        // 3. Record the attendance
        $attendanceId = 'att_' . bin2hex(random_bytes(8));
        $insStmt = $pdo->prepare("
            INSERT INTO attendances (id, registration_id, session_id, seminar_id, checked_in_at)
            VALUES (:id, :reg_id, :session_id, :seminar_id, :checked_in_at)
        ");
        $insStmt->execute([
            ':id'          => $attendanceId,
            ':reg_id'      => $reg['id'],
            ':session_id'  => $sessionId,
            ':seminar_id'  => $seminarId,
            ':checked_in_at' => date('Y-m-d H:i:s'),
        ]);

        sendResponse(200, [
            "success"      => true,
            "message"      => "Check-in successful! Welcome, {$reg['user_name']}.",
            "attendeeName" => $reg['user_name'],
            "attendance"   => [
                "id"             => $attendanceId,
                "registrationId" => $reg['id'],
                "sessionId"      => $sessionId,
                "seminarId"      => $seminarId,
                "checkedInAt"    => date('c'),
            ],
        ]);
        break;

    // ─── DELETE /checkin.php?id={attendance_id} ───────────────────────────────────
    // Removes an attendance record (un-check-in).
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendResponse(400, ["error" => "Missing required parameter: id"]);

        $stmt = $pdo->prepare("DELETE FROM attendances WHERE id = :id");
        $stmt->execute([':id' => $id]);
        if ($stmt->rowCount() === 0) sendResponse(404, ["error" => "Attendance record not found"]);

        sendResponse(200, ["message" => "Check-in removed"]);
        break;

    default:
        sendResponse(405, ["error" => "Method not allowed"]);
}

/**
 * Maps a database attendance row to the camelCase shape expected by the frontend.
 */
function mapAttendance(array $row): array {
    return [
        'id'             => $row['id'],
        'registrationId' => $row['registration_id'],
        'sessionId'      => $row['session_id'],
        'seminarId'      => $row['seminar_id'],
        'checkedInAt'    => $row['checked_in_at'],
    ];
}
