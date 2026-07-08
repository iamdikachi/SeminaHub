<?php
require_once 'db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ─── GET /sessions.php?seminar_id={id} ─────────────────────────────────────
    // Returns all sessions for a given seminar, keyed for frontend compatibility.
    case 'GET':
        $seminarId = $_GET['seminar_id'] ?? null;

        if ($seminarId) {
            $stmt = $pdo->prepare("SELECT * FROM sessions WHERE seminar_id = :seminar_id ORDER BY start_time ASC");
            $stmt->execute([':seminar_id' => $seminarId]);
            $sessions = $stmt->fetchAll();
            // Return as { seminarId: [sessions] } to match the frontend sessionsMap shape
            sendResponse(200, [$seminarId => array_map('mapSession', $sessions)]);
        }

        // Return all sessions grouped by seminar_id
        $stmt = $pdo->query("SELECT * FROM sessions ORDER BY seminar_id, start_time ASC");
        $rows = $stmt->fetchAll();

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row['seminar_id']][] = mapSession($row);
        }
        sendResponse(200, $grouped);
        break;

    // ─── POST /sessions.php ──────────────────────────────────────────────────────
    // Creates one or multiple sessions for a seminar.
    // Body: { seminarId, sessions: [{ id, title, speakerName, startTime, endTime }] }
    case 'POST':
        $body = getRequestBody();
        $seminarId = $body['seminarId'] ?? null;
        $sessions  = $body['sessions']  ?? [];

        if (!$seminarId) sendResponse(400, ["error" => "Missing required field: seminarId"]);
        if (empty($sessions)) sendResponse(400, ["error" => "sessions array is empty"]);

        // Delete existing sessions for this seminar to allow full replacement
        $del = $pdo->prepare("DELETE FROM sessions WHERE seminar_id = :seminar_id");
        $del->execute([':seminar_id' => $seminarId]);

        $stmt = $pdo->prepare("
            INSERT INTO sessions (id, seminar_id, title, speaker_name, start_time, end_time)
            VALUES (:id, :seminar_id, :title, :speaker_name, :start_time, :end_time)
        ");

        foreach ($sessions as $sess) {
            if (empty($sess['id']) || empty($sess['title'])) continue;
            $stmt->execute([
                ':id'           => $sess['id'],
                ':seminar_id'   => $seminarId,
                ':title'        => $sess['title'],
                ':speaker_name' => $sess['speakerName'] ?? 'TBA',
                ':start_time'   => $sess['startTime']   ?? date('Y-m-d H:i:s'),
                ':end_time'     => $sess['endTime']     ?? date('Y-m-d H:i:s'),
            ]);
        }

        // Fetch and return the saved sessions
        $fetch = $pdo->prepare("SELECT * FROM sessions WHERE seminar_id = :seminar_id ORDER BY start_time ASC");
        $fetch->execute([':seminar_id' => $seminarId]);
        $saved = $fetch->fetchAll();

        sendResponse(201, [$seminarId => array_map('mapSession', $saved)]);
        break;

    // ─── DELETE /sessions.php?seminar_id={id} ────────────────────────────────────
    // Deletes all sessions for a given seminar.
    case 'DELETE':
        $seminarId = $_GET['seminar_id'] ?? null;
        if (!$seminarId) sendResponse(400, ["error" => "Missing required parameter: seminar_id"]);

        $stmt = $pdo->prepare("DELETE FROM sessions WHERE seminar_id = :seminar_id");
        $stmt->execute([':seminar_id' => $seminarId]);

        sendResponse(200, ["message" => "Sessions deleted", "count" => $stmt->rowCount()]);
        break;

    default:
        sendResponse(405, ["error" => "Method not allowed"]);
}

/**
 * Maps a database session row to the camelCase shape expected by the frontend.
 */
function mapSession(array $row): array {
    return [
        'id'          => $row['id'],
        'seminarId'   => $row['seminar_id'],
        'title'       => $row['title'],
        'speakerName' => $row['speaker_name'],
        'startTime'   => $row['start_time'],
        'endTime'     => $row['end_time'],
    ];
}
