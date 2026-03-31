<?php
/**
 * KoTe REST API — PHP/SQLite backend.
 *
 * All documents belong to a named profile.  Profile takes the place of the
 * old random "usertoken" — it is a human-readable name like "default" or
 * "alice", supplied via ?profile=... on the index page and embedded in every
 * document the client stores.
 *
 * Endpoints:
 *
 *   POST   api/index.php
 *     Body: JSON document.  Must contain "_id".  May contain "profile"
 *           (falls back to "usertoken" field, then "default").
 *     → upsert the document; returns {"ok":true,"id":"..."}
 *
 *   GET    api/index.php?_id=xxx
 *     → return the document as JSON, or 404
 *
 *   GET    api/index.php?profile=P[&eventType=E][&game=G][&gamepack=GP][&locale=L]
 *     → return {"docs":[...]} sorted by timestamp DESC
 *
 *   GET    api/index.php?profiles=1
 *     → return {"profiles":["alice","bob","default",...]} (sorted)
 *
 *   DELETE api/index.php?profile=P
 *     → delete all documents belonging to profile P; returns {"ok":true,"deleted":N}
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

define('DB_PATH', __DIR__ . '/data/kote.db');

function getDB() {
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->exec("PRAGMA journal_mode=WAL");
    $db->exec("
        CREATE TABLE IF NOT EXISTS docs (
            doc_id      TEXT PRIMARY KEY,
            profile     TEXT NOT NULL DEFAULT 'default',
            timestamp   TEXT,
            game        TEXT,
            gamepack    TEXT,
            locale      TEXT,
            event_type  TEXT,
            doc_json    TEXT NOT NULL
        )
    ");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_profile    ON docs(profile)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_event_type ON docs(event_type)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_timestamp  ON docs(timestamp DESC)");
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
        echo json_encode(['error' => 'profile parameter required for DELETE']);
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
    echo json_encode(['error' => 'Method not allowed']);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function handlePut() {
    $body = file_get_contents('php://input');
    $doc  = json_decode($body, true);
    if (!$doc || !isset($doc['_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing _id in document']);
        return;
    }

    // profile: explicit > usertoken fallback > 'default'
    $profile = $doc['profile'] ?? $doc['usertoken'] ?? 'default';

    $db   = getDB();
    $stmt = $db->prepare("
        INSERT OR REPLACE INTO docs
            (doc_id, profile, timestamp, game, gamepack, locale, event_type, doc_json)
        VALUES
            (:doc_id, :profile, :timestamp, :game, :gamepack, :locale, :event_type, :doc_json)
    ");
    $stmt->execute([
        ':doc_id'     => $doc['_id'],
        ':profile'    => $profile,
        ':timestamp'  => $doc['timestamp']  ?? null,
        ':game'       => $doc['game']       ?? null,
        ':gamepack'   => $doc['gamepack']   ?? null,
        ':locale'     => $doc['locale']     ?? null,
        ':event_type' => $doc['eventType']  ?? $doc['$type'] ?? null,
        ':doc_json'   => json_encode($doc),
    ]);

    echo json_encode(['ok' => true, 'id' => $doc['_id']]);
}

function handleGet($id) {
    $db   = getDB();
    $stmt = $db->prepare("SELECT doc_json FROM docs WHERE doc_id = :id");
    $stmt->execute([':id' => $id]);
    $row  = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'not_found', 'status' => 404]);
        return;
    }

    echo $row['doc_json'];
}

function handleFind($params) {
    $db    = getDB();
    $where = [];
    $binds = [];

    if (!empty($params['profile'])) {
        $where[] = "profile = :profile";
        $binds[':profile'] = $params['profile'];
    }
    if (!empty($params['eventType'])) {
        $where[] = "event_type = :event_type";
        $binds[':event_type'] = $params['eventType'];
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

    $sql = "SELECT doc_json FROM docs";
    if ($where) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY timestamp DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($binds);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $docs = array_map(function($row) {
        return json_decode($row['doc_json'], true);
    }, $rows);

    echo json_encode(['docs' => $docs]);
}

function handleListProfiles() {
    $db   = getDB();
    $stmt = $db->query("SELECT DISTINCT profile FROM docs ORDER BY profile ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['profiles' => $rows]);
}

function handleDeleteProfile($profile) {
    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM docs WHERE profile = :profile");
    $stmt->execute([':profile' => $profile]);
    echo json_encode(['ok' => true, 'deleted' => $stmt->rowCount()]);
}
