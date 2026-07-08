<?php
require_once 'db.php';

$pdo = getDbConnection();

// Only supports GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(405, ["error" => "Method not allowed"]);
}

// ─── GET /reports.php ─────────────────────────────────────────────────────────
// Returns aggregated analytics across all seminars, registrations, and sessions.

// 1. High-level seminar & registration stats
$stats = $pdo->query("
    SELECT
        COUNT(DISTINCT s.id)                                                 AS total_seminars,
        COALESCE(SUM(CASE WHEN r.status = 'registered'  THEN 1 ELSE 0 END), 0) AS active_registrations,
        COALESCE(SUM(CASE WHEN r.status = 'waitlisted'  THEN 1 ELSE 0 END), 0) AS waitlisted_registrations,
        COALESCE(SUM(CASE WHEN r.status = 'cancelled'   THEN 1 ELSE 0 END), 0) AS cancelled_registrations,
        COUNT(DISTINCT r.id)                                                 AS total_registrations
    FROM seminars s
    LEFT JOIN registrations r ON r.seminar_id = s.id
")->fetch();

// 2. Total sessions and check-ins
$sessionStats = $pdo->query("
    SELECT
        COUNT(DISTINCT sess.id)  AS total_sessions,
        COUNT(DISTINCT att.id)   AS total_checkins
    FROM sessions sess
    LEFT JOIN attendances att ON att.session_id = sess.id
")->fetch();

// 3. Attendance rate overall
$totalPossible = 0;
$totalCheckins = (int)$sessionStats['total_checkins'];

// (registered_per_seminar * sessions_per_seminar) summed
$semRows = $pdo->query("
    SELECT
        s.id,
        s.capacity,
        s.registered_count,
        COUNT(DISTINCT sess.id) AS session_count
    FROM seminars s
    LEFT JOIN sessions sess ON sess.seminar_id = s.id
    GROUP BY s.id
")->fetchAll();

foreach ($semRows as $row) {
    $totalPossible += (int)$row['registered_count'] * (int)$row['session_count'];
}

$attendanceRate = $totalPossible > 0 ? round(($totalCheckins / $totalPossible) * 100) : 0;

// 4. Per-seminar capacity utilization
$seminarBreakdown = $pdo->query("
    SELECT
        s.id,
        s.title,
        s.category,
        s.status,
        s.capacity,
        s.registered_count,
        COALESCE(SUM(CASE WHEN r.status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlisted_count,
        COUNT(DISTINCT sess.id)                                                 AS session_count,
        COUNT(DISTINCT att.id)                                                  AS total_checkins
    FROM seminars s
    LEFT JOIN registrations r    ON r.seminar_id  = s.id
    LEFT JOIN sessions sess      ON sess.seminar_id = s.id
    LEFT JOIN attendances att    ON att.seminar_id  = s.id
    GROUP BY s.id
    ORDER BY s.created_at DESC
")->fetchAll();

// 5. Per-session attendance breakdown
$sessionBreakdown = $pdo->query("
    SELECT
        sess.id,
        sess.seminar_id,
        sess.title,
        sess.speaker_name,
        sess.start_time,
        COUNT(att.id) AS checkin_count
    FROM sessions sess
    LEFT JOIN attendances att ON att.session_id = sess.id
    GROUP BY sess.id
    ORDER BY sess.seminar_id, sess.start_time ASC
")->fetchAll();

// Build and return the full report payload
sendResponse(200, [
    'overview' => [
        'totalSeminars'             => (int)$stats['total_seminars'],
        'activeRegistrations'       => (int)$stats['active_registrations'],
        'waitlistedRegistrations'   => (int)$stats['waitlisted_registrations'],
        'cancelledRegistrations'    => (int)$stats['cancelled_registrations'],
        'totalSessions'             => (int)$sessionStats['total_sessions'],
        'totalCheckins'             => $totalCheckins,
        'attendanceRate'            => $attendanceRate,
        'noShowRate'                => max(0, 100 - $attendanceRate),
    ],
    'seminarBreakdown' => array_map(function($row) {
        return [
            'id'              => $row['id'],
            'title'           => $row['title'],
            'category'        => $row['category'],
            'status'          => $row['status'],
            'capacity'        => (int)$row['capacity'],
            'registeredCount' => (int)$row['registered_count'],
            'waitlistedCount' => (int)$row['waitlisted_count'],
            'sessionCount'    => (int)$row['session_count'],
            'totalCheckins'   => (int)$row['total_checkins'],
            'pctFull'         => $row['capacity'] > 0
                ? min(round(($row['registered_count'] / $row['capacity']) * 100), 100)
                : 0,
        ];
    }, $seminarBreakdown),
    'sessionBreakdown' => array_map(function($row) {
        return [
            'id'           => $row['id'],
            'seminarId'    => $row['seminar_id'],
            'title'        => $row['title'],
            'speakerName'  => $row['speaker_name'],
            'startTime'    => $row['start_time'],
            'checkinCount' => (int)$row['checkin_count'],
        ];
    }, $sessionBreakdown),
]);
