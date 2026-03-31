<?php
/**
 * KoTe REST API — PHP/SQLite backend.
 *
 * Two tables:
 *   kote_settings  — per-profile settings documents (keyed by _id)
 *   kote_sessions  — one row per game play, linked by session_id UUID
 *
 * Routing is based on the "$type" field in the PUT body:
 *   "$type": "game-event"  → kote_sessions
 *   anything else          → kote_settings
 *
 * Endpoints:
 *
 *   POST   api/index.php
 *     game-event: eventType=gameStarted  → INSERT new session
 *     game-event: eventType=gameFinished → UPDATE session (results)
 *     game-event: eventType=gameAborted  → UPDATE session (aborted=1)
 *     game-event: eventType=gameCreated  → ignored (pre-game UI setup)
 *     other                              → upsert into kote_settings
 *
 *   GET    api/index.php?_id=xxx
 *     → fetch settings doc by _id
 *
 *   GET    api/index.php?profile=P [&eventType=gameFinished] [&game=G] [&gamepack=GP] [&locale=L]
 *     → query finished sessions, returns {docs:[...]} shaped like old game-event docs
 *
 *   GET    api/index.php?profiles=1
 *     → list distinct profile names from both tables
 *
 *   DELETE api/index.php?profile=P
 *     → delete all data for profile P
 */

header('Content-Type: application/json; charset=utf-8');

// Always emit real UTF-8 characters instead of \uXXXX escape sequences.
function json($value) { return json_encode($value, JSON_UNESCAPED_UNICODE); }
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('DB_PATH', __DIR__ . '/data/kote.db');

// ---------------------------------------------------------------------------
// Database — create / migrate tables
// ---------------------------------------------------------------------------

function getDB() {
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("PRAGMA journal_mode=WAL");

    $db->exec("
        CREATE TABLE IF NOT EXISTS kote_settings (
            doc_id    TEXT PRIMARY KEY,
            profile   TEXT NOT NULL DEFAULT 'default',
            doc_json  TEXT NOT NULL
        )
    ");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_settings_profile ON kote_settings(profile)");

    $db->exec("
        CREATE TABLE IF NOT EXISTS kote_sessions (
            session_id   TEXT PRIMARY KEY,
            profile      TEXT NOT NULL DEFAULT 'default',
            game         TEXT,
            gamepack     TEXT,
            locale       TEXT,
            settings     TEXT,
            started_at   TEXT,
            finished_at  TEXT,
            aborted      INTEGER NOT NULL DEFAULT 0,
            event_data   TEXT,
            result       TEXT,
            eval_result  TEXT,
            report       TEXT
        )
    ");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sessions_profile   ON kote_sessions(profile)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sessions_game      ON kote_sessions(game)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sessions_started   ON kote_sessions(started_at DESC)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_sessions_finished  ON kote_sessions(finished_at DESC)");

    return $db;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    handlePut();
} elseif ($method === 'DELETE') {
    if (isset($_GET['profile'])) {
        handleDeleteProfile($_GET['profile']);
    } else {
        http_response_code(400);
        echo json(['error' => 'profile required for DELETE']);
    }
} elseif ($method === 'GET') {
    if (isset($_GET['profiles'])) {
        handleListProfiles();
    } elseif (isset($_GET['_id'])) {
        handleGet($_GET['_id']);
    } else {
        handleFind($_GET);
    }
} else {
    http_response_code(405);
    echo json(['error' => 'Method not allowed']);
}

// ---------------------------------------------------------------------------
// PUT — route to correct table
// ---------------------------------------------------------------------------

function handlePut() {
    $body = file_get_contents('php://input');
    $doc  = json_decode($body, true);
    if (!$doc) {
        http_response_code(400);
        echo json(['error' => 'Invalid JSON body']);
        return;
    }

    $db      = getDB();
    $docType = $doc['$type'] ?? '';
    $profile = $doc['profile'] ?? $doc['usertoken'] ?? 'default';

    if ($docType === 'game-event') {
        handleGameEvent($db, $doc, $profile);
    } else {
        if (!isset($doc['_id'])) {
            http_response_code(400);
            echo json(['error' => 'Missing _id in settings document']);
            return;
        }
        handleSettingsPut($db, $doc, $profile);
    }
}

function handleSettingsPut($db, $doc, $profile) {
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO kote_settings (doc_id, profile, doc_json)
        VALUES (:doc_id, :profile, :doc_json)
    ");
    $stmt->execute([
        ':doc_id'   => $doc['_id'],
        ':profile'  => $profile,
        ':doc_json' => json($doc),
    ]);
    echo json(['ok' => true, 'id' => $doc['_id']]);
}

function handleGameEvent($db, $doc, $profile) {
    $eventType = $doc['eventType'] ?? '';
    $sessionId = $doc['sessionId'] ?? null;

    switch ($eventType) {

        case 'gameStarted':
            if (!$sessionId) {
                http_response_code(400);
                echo json(['error' => 'sessionId required for gameStarted']);
                return;
            }
            $stmt = $db->prepare("
                INSERT OR IGNORE INTO kote_sessions
                    (session_id, profile, game, gamepack, locale, settings, started_at, event_data)
                VALUES
                    (:session_id, :profile, :game, :gamepack, :locale, :settings, :started_at, :event_data)
            ");
            $stmt->execute([
                ':session_id' => $sessionId,
                ':profile'    => $profile,
                ':game'       => $doc['game']      ?? null,
                ':gamepack'   => $doc['gamepack']   ?? null,
                ':locale'     => $doc['locale']     ?? null,
                ':settings'   => isset($doc['settings'])   ? json($doc['settings'])   : null,
                ':started_at' => $doc['timestamp']  ?? null,
                ':event_data' => isset($doc['eventData']) ? json($doc['eventData']) : null,
            ]);
            echo json(['ok' => true, 'sessionId' => $sessionId]);
            break;

        case 'gameFinished':
            if (!$sessionId) {
                http_response_code(400);
                echo json(['error' => 'sessionId required for gameFinished']);
                return;
            }
            $stmt = $db->prepare("
                UPDATE kote_sessions
                SET finished_at = :finished_at,
                    result      = :result,
                    eval_result = :eval_result,
                    report      = :report
                WHERE session_id = :session_id
            ");
            $stmt->execute([
                ':session_id'  => $sessionId,
                ':finished_at' => $doc['timestamp'] ?? null,
                ':result'      => isset($doc['eventData'])  ? json($doc['eventData'])  : null,
                ':eval_result' => isset($doc['eventData2']) ? json($doc['eventData2']) : null,
                ':report'      => isset($doc['eventData3']) ? json($doc['eventData3']) : null,
            ]);
            echo json(['ok' => true, 'sessionId' => $sessionId]);
            break;

        case 'gameAborted':
            if ($sessionId) {
                $stmt = $db->prepare("
                    UPDATE kote_sessions SET aborted = 1 WHERE session_id = :session_id
                ");
                $stmt->execute([':session_id' => $sessionId]);
            }
            echo json(['ok' => true]);
            break;

        default:
            // gameCreated and any other events are silently ignored
            echo json(['ok' => true, 'ignored' => $eventType]);
            break;
    }
}

// ---------------------------------------------------------------------------
// GET — fetch settings doc by _id
// ---------------------------------------------------------------------------

function handleGet($id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT doc_json FROM kote_settings WHERE doc_id = :id");
    $stmt->execute([':id' => $id]);
    $row  = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        http_response_code(404);
        echo json(['error' => 'not_found', 'status' => 404]);
        return;
    }
    echo $row['doc_json'];
}

// ---------------------------------------------------------------------------
// FIND — query finished sessions, return docs shaped for HistoryLogger
// ---------------------------------------------------------------------------

function handleFind($params) {
    $db    = getDB();
    $where = ["finished_at IS NOT NULL", "aborted = 0"];
    $binds = [];

    if (!empty($params['profile'])) {
        $where[] = "profile = :profile";
        $binds[':profile'] = $params['profile'];
    }
    if (!empty($params['game'])) {
        $where[] = "game = :game";
        $binds[':game'] = $params['game'];
    }
    if (!empty($params['gamepack'])) {
        $where[] = "gamepack = :gamepack";
        $binds[':gamepack'] = $params['gamepack'];
    }
    if (!empty($params['locale'])) {
        $where[] = "locale = :locale";
        $binds[':locale'] = $params['locale'];
    }

    $sql  = "SELECT * FROM kote_sessions WHERE " . implode(" AND ", $where);
    $sql .= " ORDER BY finished_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($binds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $docs = array_map('sessionToDoc', $rows);
    echo json(['docs' => $docs]);
}

/**
 * Reshape a kote_sessions row into the doc structure that HistoryLogger
 * expects (mirrors the old game-event PouchDB document).
 */
function sessionToDoc($row) {
    $settings    = $row['settings']   ? json_decode($row['settings'],   true) : [];
    $eventData3  = $row['report']     ? json_decode($row['report'],     true) : [];
    $eventData   = $row['event_data'] ? json_decode($row['event_data'], true) : null;
    $evalResult  = $row['eval_result']? json_decode($row['eval_result'],true) : null;

    // Reconstruct the ident string the same way HistoryLogger.logGameEvent does.
    $settingsParts = [];
    foreach (($settings ?: []) as $k => $v) {
        $settingsParts[] = $k . '=' . $v;
    }
    $ident = implode(':', [
        $row['game']     ?? '',
        $row['gamepack'] ?? '',
        $row['locale']   ?? '',
        implode(',', $settingsParts),
    ]);

    return [
        '$type'       => 'game-event',
        '_id'         => $row['session_id'],
        'sessionId'   => $row['session_id'],
        'profile'     => $row['profile'],
        'game'        => $row['game'],
        'gamepack'    => $row['gamepack'],
        'locale'      => $row['locale'],
        'settings'    => $settings,
        'ident'       => $ident,
        'eventType'   => 'gameFinished',
        'timestamp'   => $row['finished_at'],
        'started_at'  => $row['started_at'],
        'eventData'   => $eventData,
        'eventData2'  => $evalResult,
        'eventData3'  => $eventData3,
    ];
}

// ---------------------------------------------------------------------------
// LIST PROFILES
// ---------------------------------------------------------------------------

function handleListProfiles() {
    $db = getDB();
    // Union profiles from both tables
    $stmt = $db->query("
        SELECT profile FROM kote_settings
        UNION
        SELECT profile FROM kote_sessions
        ORDER BY profile ASC
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json(['profiles' => $rows]);
}

// ---------------------------------------------------------------------------
// DELETE PROFILE
// ---------------------------------------------------------------------------

function handleDeleteProfile($profile) {
    $db = getDB();
    $db->beginTransaction();
    $s1 = $db->prepare("DELETE FROM kote_settings WHERE profile = :p");
    $s1->execute([':p' => $profile]);
    $s2 = $db->prepare("DELETE FROM kote_sessions WHERE profile = :p");
    $s2->execute([':p' => $profile]);
    $db->commit();
    echo json(['ok' => true, 'deleted' => $s1->rowCount() + $s2->rowCount()]);
}
