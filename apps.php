<?php
/**
 * KoTe — HTML app launcher (alternate to the SVG index.php title page).
 *
 * Query string:
 *   ?profile=NAME   — profile name (default: "default")
 *   ?lang=CODE      — language code: en | cz | en-US | cs-CZ (default: auto)
 *   ?section=history|about|settings  — open a section on load
 */

// ---------------------------------------------------------------------------
// Parameters
// ---------------------------------------------------------------------------
$raw     = $_GET['profile'] ?? 'default';
$profile = preg_replace('/[^a-zA-Z0-9_\-]/', '', $raw) ?: 'default';

$langParam = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['lang'] ?? '') ?: '';

$section = preg_replace('/[^a-z]/', '', $_GET['section'] ?? '');
if (!in_array($section, ['history', 'about', 'settings'])) $section = '';

// ---------------------------------------------------------------------------
// Load index.json
// ---------------------------------------------------------------------------
$indexData = json_decode(file_get_contents(__DIR__ . '/index.json'), true);
$languages = $indexData['languages'] ?? ['en'];

// ---------------------------------------------------------------------------
// Resolve locale
// ---------------------------------------------------------------------------
$localeMap = ['en-US' => 'en', 'cs-CZ' => 'cz', 'en' => 'en', 'cz' => 'cz', 'cs' => 'cz'];
$locale = 'en';
if ($langParam && isset($localeMap[$langParam])) {
    $locale = $localeMap[$langParam];
} elseif (in_array($langParam, $languages)) {
    $locale = $langParam;
}

// ---------------------------------------------------------------------------
// Framework locale (global translations + metadata + credits)
// ---------------------------------------------------------------------------
$frameworkLocale = [];
foreach ($indexData['locales'] as $loc) {
    if ($loc['name'] === $locale) { $frameworkLocale = $loc; break; }
}
$tr       = $frameworkLocale['translations'] ?? [];
$fwMeta   = $frameworkLocale['metadata']     ?? [];
$credits  = $frameworkLocale['credits']      ?? [];

function tr($key) {
    global $tr;
    return htmlspecialchars($tr[$key] ?? $key, ENT_QUOTES, 'UTF-8');
}
function esc($s) {
    return htmlspecialchars($s ?? '', ENT_QUOTES, 'UTF-8');
}

// ---------------------------------------------------------------------------
// Build app list for this locale
// ---------------------------------------------------------------------------
$apps = [];
foreach ($indexData['apps'] as $app) {
    // App-level locale
    $appLocale = null;
    foreach ($app['locales'] as $l) {
        if ($l['name'] === $locale) { $appLocale = $l; break; }
    }
    if (!$appLocale) continue;

    // Gamepack + gamepack locale
    $gamepackName = $app['gamepackName'] ?? 'default';
    $gamepack = null;
    foreach ($app['gamepacks'] as $gp) {
        if ($gp['name'] === $gamepackName) { $gamepack = $gp; break; }
    }
    if (!$gamepack) continue;
    $gpLocale = null;
    foreach ($gamepack['locales'] as $l) {
        if ($l['name'] === $locale) { $gpLocale = $l; break; }
    }
    if (!$gpLocale) continue;

    // Title / subtitle — gamepack locale wins over app locale
    $title    = $gpLocale['metadata']['title']    ?? $appLocale['metadata']['title']    ?? $app['name'];
    $subtitle = $gpLocale['metadata']['subtitle'] ?? $appLocale['metadata']['subtitle'] ?? '';
    $subtitle = trim($subtitle);

    // Tags
    $tags = [];
    foreach ($app['tags'] ?? [] as $tag) {
        $tags[] = $tr[$tag] ?? $tag;
    }

    // Preview URL (same resolution order as MetaInstance in Meta.js)
    $previewUrl = null;
    if ($app['preview']          ?? false) $previewUrl = "apps/{$app['name']}/preview.png";
    if ($appLocale['preview']    ?? false) $previewUrl = "apps/{$app['name']}/locales/{$locale}/preview.png";
    if ($gamepack['preview']     ?? false) $previewUrl = "apps/{$app['name']}/gamepacks/{$gamepackName}/preview.png";
    if ($gpLocale['preview']     ?? false) $previewUrl = "apps/{$app['name']}/gamepacks/{$gamepackName}/locales/{$locale}/preview.png";

    $apps[] = [
        'name'         => $app['name'],
        'gamepackName' => $gamepackName,
        'title'        => $title,
        'subtitle'     => $subtitle,
        'preview'      => $previewUrl,
        'tags'         => $tags,
    ];
}

// ---------------------------------------------------------------------------
// Build the self-referencing URL (for back links, lang switcher, etc.)
// ---------------------------------------------------------------------------
$selfBase = 'apps.php?profile=' . urlencode($profile);
if ($langParam) $selfBase .= '&lang=' . urlencode($langParam);

// The URL that index.php will receive as ?back= when launching a game
$backUrl = $selfBase;

// App title
$appTitle = $fwMeta['title'] ?? 'KoTe';

?><!DOCTYPE html>
<html lang="<?= esc($locale) ?>">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= esc($appTitle) ?></title>
    <link rel="stylesheet" href="css/style.css">
    <style>
        /* ------------------------------------------------------------------ */
        /* apps.php — standalone HTML launcher                                 */
        /* ------------------------------------------------------------------ */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: system-ui, sans-serif;
            background: var(--color-bg, #1a1a2e);
            color: var(--color-text, #e0e0e0);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Top bar */
        .topbar {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: .75rem 1.5rem;
            background: rgba(255,255,255,.05);
            border-bottom: 1px solid rgba(255,255,255,.1);
            flex-wrap: wrap;
        }
        .topbar-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: #f90;
            flex: 1;
        }
        .topbar-profile {
            font-size: .85rem;
            opacity: .7;
        }
        .lang-switch a {
            padding: .25rem .5rem;
            border-radius: 4px;
            text-decoration: none;
            color: inherit;
            font-size: .85rem;
            opacity: .6;
            transition: opacity .15s;
        }
        .lang-switch a.active, .lang-switch a:hover { opacity: 1; font-weight: 600; }

        /* Main content area */
        main {
            flex: 1;
            padding: 1.5rem;
            max-width: 1100px;
            width: 100%;
            margin: 0 auto;
        }

        /* App grid */
        .app-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .app-card {
            background: rgba(255,255,255,.07);
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            transition: transform .15s, background .15s;
            display: flex;
            flex-direction: column;
        }
        .app-card:hover {
            transform: translateY(-3px);
            background: rgba(255,255,255,.13);
        }
        .app-card-preview {
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            background: rgba(0,0,0,.3);
        }
        .app-card-preview-placeholder {
            width: 100%;
            aspect-ratio: 1;
            background: rgba(255,153,0,.1);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: #f90;
        }
        .app-card-body {
            padding: .75rem;
            flex: 1;
        }
        .app-card-title {
            font-size: .95rem;
            font-weight: 600;
            line-height: 1.3;
            margin-bottom: .25rem;
        }
        .app-card-subtitle {
            font-size: .8rem;
            opacity: .6;
        }
        .app-card-tags {
            padding: 0 .75rem .6rem;
            display: flex;
            flex-wrap: wrap;
            gap: .3rem;
        }
        .app-card-tag {
            font-size: .7rem;
            padding: .15rem .45rem;
            border-radius: 999px;
            background: rgba(255,153,0,.2);
            color: #f90;
        }

        /* Action bar — second row of topbar */
        .action-bar {
            display: flex;
            gap: .75rem;
            flex-wrap: wrap;
            padding: .5rem 1.5rem;
            background: rgba(255,255,255,.03);
            border-bottom: 1px solid rgba(255,255,255,.08);
        }
        .action-bar button {
            padding: .4rem 1.1rem;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,.2);
            background: rgba(255,255,255,.08);
            color: inherit;
            font-size: .9rem;
            cursor: pointer;
            transition: background .15s;
        }
        .action-bar button:hover, .action-bar button.active {
            background: rgba(255,153,0,.25);
            border-color: #f90;
            color: #f90;
        }

        /* Section pages (history / about / settings) — replace the grid */
        .section-page {
            display: none;
            padding-bottom: 2rem;
        }
        .section-page.open { display: block; }
        .section-page h2 {
            font-size: 1.2rem;
            font-weight: 700;
            color: #f90;
            margin-bottom: 1.25rem;
        }

        /* Back button in topbar */
        .btn-back {
            display: none;
            align-items: center;
            gap: .4rem;
            padding: .35rem .85rem;
            border-radius: 7px;
            border: 1px solid rgba(255,255,255,.25);
            background: rgba(255,255,255,.08);
            color: inherit;
            font-size: .9rem;
            cursor: pointer;
            transition: background .15s;
        }
        .btn-back:hover { background: rgba(255,153,0,.25); border-color: #f90; color: #f90; }
        .in-section .btn-back   { display: flex; }
        .in-section .action-bar { display: none; }
        .in-section .app-grid   { display: none; }

        /* History panel — light background, dark text */
        #panel-history {
            background: #fff;
            color: #111;
            border-radius: 10px;
            padding: 1.25rem;
        }
        #panel-history h2 { color: #c70; }
        .history-empty { opacity: .6; font-style: italic; }
        .gametopitem {
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
        }
        .gametitlebar {
            background: rgba(255,153,0,.15);
            padding: .5rem .75rem;
            display: flex;
            gap: .75rem;
            flex-wrap: wrap;
            align-items: center;
        }
        .gametitle     { font-weight: 700; font-size: .95rem; }
        .gamepacktitle { opacity: .7; font-size: .85rem; }
        .gamesettings  { opacity: .6; font-size: .8rem; padding: .25rem .75rem; }
        .gamerecord {
            display: flex;
            gap: 1rem;
            padding: .5rem .75rem;
            border-top: 1px solid rgba(255,255,255,.07);
            flex-wrap: wrap;
            align-items: flex-start;
        }
        .datetime { font-size: .8rem; opacity: .6; white-space: nowrap; }
        .gameresults { display: flex; flex-wrap: wrap; gap: .5rem; }
        .gameresult {
            font-size: .82rem;
            background: rgba(255,255,255,.06);
            border-radius: 6px;
            padding: .2rem .55rem;
        }
        .gamelabel { display: inline; opacity: .7; }
        .gamelabel::after { content: ': '; }
        .gamevalue { display: inline; font-weight: 600; }

        /* Settings panel */
        .settings-form { display: flex; flex-direction: column; gap: 1rem; max-width: 360px; }
        .settings-form label { font-size: .9rem; opacity: .8; display: block; margin-bottom: .3rem; }
        .settings-form select, .settings-form input {
            width: 100%;
            padding: .45rem .7rem;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,.2);
            background: rgba(255,255,255,.08);
            color: inherit;
            font-size: .9rem;
        }
        .settings-form .btn-row { display: flex; gap: .75rem; margin-top: .5rem; }
        .btn {
            padding: .5rem 1.1rem;
            border-radius: 7px;
            border: 1px solid rgba(255,255,255,.2);
            background: rgba(255,255,255,.1);
            color: inherit;
            font-size: .9rem;
            cursor: pointer;
            transition: background .15s;
        }
        .btn-primary {
            background: #f90;
            border-color: #f90;
            color: #000;
            font-weight: 600;
        }
        .btn-primary:hover { background: #ffa820; }
        .btn:hover { background: rgba(255,255,255,.18); }

        /* About panel */
        #panel-about { color: #e8e8e8; }
        #panel-about p { color: #e8e8e8; }
        #panel-about h2 { color: #f90; }
        .credits-line { margin-bottom: .6rem; line-height: 1.6; }
        .credits-line a { color: #f90; }
    </style>
</head>
<body>

<!-- Top bar -->
<header class="topbar">
    <button class="btn-back" id="btn-back">&#8592; <?= tr('Back') ?></button>
    <span class="topbar-title" id="topbar-title"><?= esc($appTitle) ?></span>
    <span class="topbar-profile"><?= esc($profile) ?></span>
    <nav class="lang-switch">
        <?php foreach ($languages as $lng): ?>
            <a href="apps.php?profile=<?= urlencode($profile) ?>&lang=<?= urlencode($lng) ?>"
               class="<?= $locale === $lng ? 'active' : '' ?>"><?= esc(strtoupper($lng)) ?></a>
        <?php endforeach; ?>
    </nav>
</header>

<!-- Action bar — sits just below the topbar -->
<nav class="action-bar">
    <button id="btn-settings"><?= tr('Settings') ?></button>
    <button id="btn-history"><?= tr('History') ?></button>
    <button id="btn-about"><?= tr('About') ?></button>
</nav>

<main>

    <!-- Settings section -->
    <section class="section-page" id="panel-settings">
        <h2><?= tr('Settings') ?></h2>
        <div class="settings-form">
            <div>
                <label for="sel-language"><?= tr('Language') ?></label>
                <select id="sel-language">
                    <?php foreach ($languages as $lng): ?>
                        <option value="<?= esc($lng) ?>" <?= $locale === $lng ? 'selected' : '' ?>><?= esc(strtoupper($lng)) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="btn-row">
                <button class="btn btn-primary" id="btn-settings-save"><?= tr('Save') ?></button>
            </div>
            <div id="settings-msg" style="font-size:.85rem;opacity:.7;"></div>
        </div>
    </section>

    <!-- History section -->
    <section class="section-page" id="panel-history">
        <h2><?= tr('History') ?></h2>
        <div id="history-content"><em class="history-empty"></em></div>
    </section>

    <!-- About section -->
    <section class="section-page" id="panel-about">
        <h2><?= tr('About') ?></h2>
        <div id="about-content">
            <?php
            foreach ($credits as $line) {
                if (!$line) { echo '<br>'; continue; }
                // Strip "fontSize=N@" metadata prefix
                $text = preg_replace('/^[^@]*@/', '', $line);
                // Split on <...> tokens, process links before HTML-escaping
                $parts = preg_split('/(<[^>]+>)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
                $html = '';
                foreach ($parts as $part) {
                    if (preg_match('/^<([^|>]+)\|([^>]+)>$/', $part, $m)) {
                        // <url|title>
                        $html .= '<a href="' . esc($m[1]) . '" target="_blank">' . esc($m[2]) . '</a>';
                    } elseif (preg_match('/^<(https?:\/\/[^>]+)>$/', $part, $m)) {
                        // bare <url>
                        $html .= '<a href="' . esc($m[1]) . '" target="_blank">' . esc($m[1]) . '</a>';
                    } else {
                        $html .= htmlspecialchars($part, ENT_QUOTES, 'UTF-8');
                    }
                }
                echo '<p class="credits-line">' . $html . '</p>';
            }
            ?>
        </div>
    </section>

    <!-- App grid -->
    <div class="app-grid" id="app-grid">
        <?php foreach ($apps as $app):
            $gameUrl = 'index.php?profile=' . urlencode($profile)
                     . '&lang=' . urlencode($langParam ?: $locale)
                     . '&app=' . urlencode($app['name'])
                     . '&gamepack=' . urlencode($app['gamepackName'])
                     . '&back=' . urlencode($backUrl);
        ?>
        <a class="app-card" href="<?= esc($gameUrl) ?>">
            <?php if ($app['preview']): ?>
                <img class="app-card-preview"
                     src="<?= esc($app['preview']) ?>"
                     alt="<?= esc($app['title']) ?>"
                     loading="lazy">
            <?php else: ?>
                <div class="app-card-preview-placeholder">🎮</div>
            <?php endif; ?>
            <div class="app-card-body">
                <div class="app-card-title"><?= esc($app['title']) ?></div>
                <?php if ($app['subtitle']): ?>
                    <div class="app-card-subtitle"><?= esc($app['subtitle']) ?></div>
                <?php endif; ?>
            </div>
            <?php if ($app['tags']): ?>
                <div class="app-card-tags">
                    <?php foreach ($app['tags'] as $tag): ?>
                        <span class="app-card-tag"><?= esc($tag) ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </a>
        <?php endforeach; ?>
    </div>

</main>

<script>
(function() {
    var PROFILE  = <?= json_encode($profile, JSON_UNESCAPED_UNICODE) ?>;
    var LOCALE   = <?= json_encode($locale,  JSON_UNESCAPED_UNICODE) ?>;
    var API      = 'api/index.php';
    var SETTINGS_KEY = 'settings-' + PROFILE + '-global';
    var TR = <?= json_encode($tr, JSON_UNESCAPED_UNICODE) ?>;

    function t(k) { return TR[k] || k; }

    // ------------------------------------------------------------------
    // Section navigation (full-page replace)
    // ------------------------------------------------------------------
    var currentSection = null;
    var SECTION_TITLES = {
        settings: t('Settings'),
        history:  t('History'),
        about:    t('About')
    };
    var appTitle = document.getElementById('topbar-title').textContent;

    function openSection(name) {
        // Close any open section first
        if (currentSection) {
            document.getElementById('panel-' + currentSection).classList.remove('open');
        }
        currentSection = name;
        document.getElementById('panel-' + name).classList.add('open');
        document.getElementById('topbar-title').textContent = SECTION_TITLES[name] || name;
        document.body.classList.add('in-section');

        if (name === 'history')  loadHistory();
        if (name === 'settings') loadSettings();
    }

    function closeSection() {
        if (currentSection) {
            document.getElementById('panel-' + currentSection).classList.remove('open');
            currentSection = null;
        }
        document.body.classList.remove('in-section');
        document.getElementById('topbar-title').textContent = appTitle;
    }

    document.getElementById('btn-back').addEventListener('click', closeSection);
    document.getElementById('btn-settings').addEventListener('click', function() { openSection('settings'); });
    document.getElementById('btn-history').addEventListener('click',  function() { openSection('history');  });
    document.getElementById('btn-about').addEventListener('click',    function() { openSection('about');    });

    // Open section from query string
    var initSection = <?= json_encode($section) ?>;
    if (initSection) openSection(initSection);

    // ------------------------------------------------------------------
    // History
    // ------------------------------------------------------------------
    function loadHistory() {
        var el = document.getElementById('history-content');
        el.innerHTML = '<em class="history-empty">' + t('Loading…') + '</em>';

        fetch(API + '?profile=' + encodeURIComponent(PROFILE) + '&eventType=gameFinished')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var docs = data.docs || [];
            if (!docs.length) {
                el.innerHTML = '<em class="history-empty">' + t('History is empty') + '</em>';
                return;
            }

            // Group by ident
            var idents = [], map = {};
            docs.forEach(function(r) {
                var ident = r.ident || r.game;
                if (map[ident]) { map[ident].push(r); } else { idents.push(ident); map[ident] = [r]; }
            });

            var out = document.createElement('div');
            idents.forEach(function(ident) {
                var recs  = map[ident];
                var first = recs[0];
                var gi = document.createElement('div');
                gi.className = 'gametopitem';

                // Title bar
                var tb = document.createElement('div');
                tb.className = 'gametitlebar';
                tb.innerHTML =
                    '<span class="gametitle">'     + esc(first.game     || '') + '</span>' +
                    '<span class="gamepacktitle">' + esc(first.gamepack || '') + '</span>' +
                    '<span>'                       + esc(first.locale   || '') + '</span>';
                gi.appendChild(tb);

                // Settings row
                if (first.settings && Object.keys(first.settings).length) {
                    var sr = document.createElement('div');
                    sr.className = 'gamesettings';
                    sr.textContent = Object.entries(first.settings).map(function(kv) { return kv[0]+'='+kv[1]; }).join(', ');
                    gi.appendChild(sr);
                }

                recs.forEach(function(r) {
                    var dt   = new Date(r.timestamp);
                    var date = dt.toLocaleDateString(LOCALE === 'cz' ? 'cs-CZ' : 'en-US');
                    var time = dt.toLocaleTimeString(LOCALE === 'cz' ? 'cs-CZ' : 'en-US',
                                   { hour:'2-digit', minute:'2-digit', second:'2-digit' });
                    var rec = document.createElement('div');
                    rec.className = 'gamerecord';

                    var dtEl = document.createElement('div');
                    dtEl.className = 'datetime';
                    dtEl.innerHTML = '<div>' + esc(date) + '</div><div>' + esc(time) + '</div>';
                    rec.appendChild(dtEl);

                    var results = r.eventData3 || [];
                    if (results.length) {
                        var resEl = document.createElement('div');
                        resEl.className = 'gameresults';
                        results.forEach(function(s) {
                            if (typeof s !== 'string') return;
                            var idx = s.indexOf(':');
                            if (idx < 0) return;
                            var label = s.substring(0, idx).trim();
                            var value = s.substring(idx + 1).trim();
                            resEl.innerHTML +=
                                '<div class="gameresult">' +
                                '<span class="gamelabel">' + esc(label) + '</span>' +
                                '<span class="gamevalue">' + esc(value) + '</span></div>';
                        });
                        rec.appendChild(resEl);
                    }
                    gi.appendChild(rec);
                });
                out.appendChild(gi);
            });
            el.innerHTML = '';
            el.appendChild(out);
        })
        .catch(function() {
            el.innerHTML = '<em class="history-empty">Error loading history.</em>';
        });
    }

    // ------------------------------------------------------------------
    // Settings — load from DB, save language change as page redirect
    // ------------------------------------------------------------------
    function loadSettings() {
        fetch(API + '?_id=' + encodeURIComponent(SETTINGS_KEY))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
            if (data && data.settings && data.settings.language) {
                document.getElementById('sel-language').value = data.settings.language;
            }
        })
        .catch(function() {});
    }

    document.getElementById('btn-settings-save').addEventListener('click', function() {
        var lang = document.getElementById('sel-language').value;
        var doc = {
            _id: SETTINGS_KEY,
            profile: PROFILE,
            settings: { language: lang }
        };
        fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(doc)
        })
        .then(function() {
            // Reload page with the new language so titles update
            var url = new URL(window.location.href);
            url.searchParams.set('lang', lang);
            window.location.href = url.toString();
        });
    });

    // ------------------------------------------------------------------
    // Tiny HTML escaping helper (used in JS-built history)
    // ------------------------------------------------------------------
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
})();
</script>
</body>
</html>
