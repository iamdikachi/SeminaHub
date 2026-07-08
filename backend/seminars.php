<?php
require_once 'db.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {

    // ─── GET /seminars.php ──────────────────────────────────────────────────────
    // Query params: ?id=, ?organizer_id=, ?category=, ?status=, ?search=
    case 'GET':
        $id           = $_GET['id']           ?? null;
        $organizerId  = $_GET['organizer_id'] ?? null;
        $category     = $_GET['category']     ?? null;
        $status       = $_GET['status']       ?? null;
        $search       = $_GET['search']       ?? null;

        // Fetch a single seminar by ID
        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM seminars WHERE id = :id");
            $stmt->execute([':id' => $id]);
            $sem = $stmt->fetch();
            if (!$sem) sendResponse(404, ["error" => "Seminar not found"]);
            sendResponse(200, $sem);
        }

        // Build dynamic listing query
        $sql    = "SELECT * FROM seminars WHERE 1=1";
        $params = [];

        if ($organizerId) {
            $sql .= " AND organizer_id = :organizer_id";
            $params[':organizer_id'] = $organizerId;
        }
        if ($category && $category !== 'All') {
            $sql .= " AND category = :category";
            $params[':category'] = $category;
        }
        if ($status) {
            $sql .= " AND status = :status";
            $params[':status'] = $status;
        }
        if ($search) {
            $sql .= " AND (title LIKE :search OR description LIKE :search2)";
            $params[':search']  = "%{$search}%";
            $params[':search2'] = "%{$search}%";
        }
        $sql .= " ORDER BY created_at DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        sendResponse(200, $stmt->fetchAll());
        break;

    // ─── POST /seminars.php ──────────────────────────────────────────────────────
    // Creates a new seminar.
    // Body: { id, title, description, startDate, endDate, venue, capacity, status, organizerId, category }
    case 'POST':
        $body = getRequestBody();
        $required = ['id', 'title', 'startDate', 'endDate', 'venue', 'capacity', 'organizerId', 'category'];
        foreach ($required as $field) {
            if (empty($body[$field])) {
                sendResponse(400, ["error" => "Missing required field: {$field}"]);
            }
        }

        $stmt = $pdo->prepare("
            INSERT INTO seminars
                (id, title, description, start_date, end_date, venue, capacity, status, organizer_id, category, registered_count, created_at)
            VALUES
                (:id, :title, :desc, :start_date, :end_date, :venue, :capacity, :status, :organizer_id, :category, 0, :created_at)
        ");
        $stmt->execute([
            ':id'           => $body['id'],
            ':title'        => $body['title'],
            ':desc'         => $body['description'] ?? '',
            ':start_date'   => $body['startDate'],
            ':end_date'     => $body['endDate'],
            ':venue'        => $body['venue'],
            ':capacity'     => (int)$body['capacity'],
            ':status'       => $body['status'] ?? 'Draft',
            ':organizer_id' => $body['organizerId'],
            ':category'     => $body['category'],
            ':created_at'   => $body['createdAt'] ?? date('Y-m-d H:i:s'),
        ]);

        $stmt = $pdo->prepare("SELECT * FROM seminars WHERE id = :id");
        $stmt->execute([':id' => $body['id']]);
        sendResponse(201, $stmt->fetch());
        break;

    // ─── PUT /seminars.php ───────────────────────────────────────────────────────
    // Updates an existing seminar.
    // Body: { id, title, description, startDate, endDate, venue, capacity, status, category }
    case 'PUT':
        $body = getRequestBody();
        $id = $body['id'] ?? null;
        if (!$id) sendResponse(400, ["error" => "Missing required field: id"]);

        $stmt = $pdo->prepare("
            UPDATE seminars SET
                title        = :title,
                description  = :desc,
                start_date   = :start_date,
                end_date     = :end_date,
                venue        = :venue,
                capacity     = :capacity,
                status       = :status,
                category     = :category
            WHERE id = :id
        ");
        $stmt->execute([
            ':title'      => $body['title']       ?? '',
            ':desc'       => $body['description'] ?? '',
            ':start_date' => $body['startDate']   ?? '',
            ':end_date'   => $body['endDate']     ?? '',
            ':venue'      => $body['venue']       ?? '',
            ':capacity'   => (int)($body['capacity'] ?? 0),
            ':status'     => $body['status']      ?? 'Draft',
            ':category'   => $body['category']    ?? '',
            ':id'         => $id,
        ]);

        if ($stmt->rowCount() === 0) sendResponse(404, ["error" => "Seminar not found or no changes made"]);

        $stmt = $pdo->prepare("SELECT * FROM seminars WHERE id = :id");
        $stmt->execute([':id' => $id]);
        sendResponse(200, $stmt->fetch());
        break;

    // ─── DELETE /seminars.php?id={id} ────────────────────────────────────────────
    // Deletes a seminar and all its cascaded sessions, registrations, and attendances.
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendResponse(400, ["error" => "Missing required parameter: id"]);

        $stmt = $pdo->prepare("DELETE FROM seminars WHERE id = :id");
        $stmt->execute([':id' => $id]);

        if ($stmt->rowCount() === 0) sendResponse(404, ["error" => "Seminar not found"]);

        sendResponse(200, ["message" => "Seminar deleted successfully"]);
        break;

    default:
        sendResponse(405, ["error" => "Method not allowed"]);
}
