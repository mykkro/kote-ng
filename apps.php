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
if (!in_array($section, ['history', 'about', 'settings', 'game'])) $section = '';

$gameParam     = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['game']     ?? '');
$gamepackParam = preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['gamepack'] ?? '') ?: 'default';

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
    $appLocale = null;
    foreach ($app['locales'] as $l) {
        if ($l['name'] === $locale) { $appLocale = $l; break; }
    }
    if (!$appLocale) continue;

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

    $title        = $gpLocale['metadata']['title']        ?? $appLocale['metadata']['title']        ?? $app['name'];
    $subtitle     = $gpLocale['metadata']['subtitle']     ?? $appLocale['metadata']['subtitle']     ?? '';
    $description  = $gpLocale['metadata']['description']  ?? $appLocale['metadata']['description']  ?? '';
    $instructions = $gpLocale['metadata']['instructions'] ?? $appLocale['metadata']['instructions'] ?? '';
    $subtitle     = trim($subtitle);
    $description  = trim($description);
    $instructions = trim($instructions);

    $config = $app['config'] ?? [];
    if (!empty($gamepack['config'])) $config = $gamepack['config'];

    $tags = [];
    foreach ($app['tags'] ?? [] as $tag) {
        $tags[] = $tr[$tag] ?? $tag;
    }

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
        'description'  => $description,
        'instructions' => $instructions,
        'preview'      => $previewUrl,
        'tags'         => $tags,
        'config'       => $config ?: [],
        'hasConfig'    => !empty($config),
        'settingsKey'  => 'settings-' . $profile . '-' . $app['name'] . '-' . $locale,
    ];
}

// ---------------------------------------------------------------------------
// Build the self-referencing URL
// ---------------------------------------------------------------------------
$selfBase = 'apps.php?profile=' . urlencode($profile);
if ($langParam) $selfBase .= '&lang=' . urlencode($langParam);
$backUrl  = $selfBase;
$appTitle = $fwMeta['title'] ?? 'KoTe';

?><!DOCTYPE html>
<html lang="<?= esc($locale) ?>" data-bs-theme="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= esc($appTitle) ?></title>
    <link rel="stylesheet" href="css/bootstrap/bootstrap.min.css">
    <style>
        body { background: #1a1a2e; }

        /* Section visibility */
        .section-page { display: none; }
        .section-page.open { display: block; }
        .in-section #btn-back   { display: inline-flex !important; }
        .in-section #action-bar { display: none !important; }
        .in-section #app-grid   { display: none !important; }

        /* App cards */
        .app-card { text-decoration: none; color: inherit; transition: transform .15s; }
        .app-card:hover { transform: translateY(-3px); color: inherit; }
        .app-card-preview { width: 100%; aspect-ratio: 1; object-fit: cover; }
        .app-card-preview-placeholder {
            width: 100%; aspect-ratio: 1;
            display: flex; align-items: center; justify-content: center;
            font-size: 3rem; color: #f90; background: rgba(255,153,0,.1);
        }

        /* Game launcher preview */
        .game-preview-wrap { position: relative; cursor: pointer; max-width: 400px; }
        .game-preview-wrap img { width: 100%; display: block; border-radius: .5rem; transition: opacity .15s; }
        .game-preview-wrap:hover img { opacity: .85; }
        .play-overlay {
            position: absolute; inset: 0; display: flex;
            align-items: center; justify-content: center; opacity: 0; transition: opacity .2s;
        }
        .game-preview-wrap:hover .play-overlay { opacity: 1; }
        .play-overlay-circle {
            width: 68px; height: 68px; border-radius: 50%;
            background: rgba(0,0,0,.6);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.8rem; color: #fff;
        }
        .game-preview-placeholder {
            width: 100%; aspect-ratio: 1; max-width: 400px;
            display: flex; align-items: center; justify-content: center;
            font-size: 5rem; color: #f90; background: rgba(255,153,0,.1);
            cursor: pointer; border-radius: .5rem;
        }
        .instructions-text { white-space: pre-wrap; line-height: 1.7; }

        /* History items — base (dark bg) */
        .gametopitem  { border: 1px solid rgba(255,255,255,.12); border-radius: .5rem; margin-bottom: 1rem; overflow: hidden; }
        .gametitlebar { background: rgba(255,153,0,.15); padding: .5rem .75rem; display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
        .gametitle    { font-weight: 700; }
        .gamepacktitle{ opacity: .7; font-size: .85rem; }
        .gamesettings { font-size: .8rem; color: #bbb; padding: .2rem .75rem; }
        .gamerecord   { display: flex; gap: 1rem; padding: .5rem .75rem; border-top: 1px solid rgba(255,255,255,.07); flex-wrap: wrap; }
        .datetime     { font-size: .8rem; opacity: .6; white-space: nowrap; }
        .gameresults  { display: flex; flex-wrap: wrap; gap: .4rem; }
        .gameresult   { font-size: .82rem; background: rgba(255,255,255,.08); border-radius: .35rem; padding: .15rem .5rem; }
        .gamelabel    { opacity: .8; }
        .gamelabel::after { content: ': '; }
        .gamevalue    { font-weight: 600; }
        .history-empty { opacity: .6; font-style: italic; }

        /* History items — light bg override (used in history panel and game tab) */
        .history-light .gametopitem   { border-color: #ccc; background: #fff; }
        .history-light .gametitlebar  { background: rgba(200,120,0,.12); }
        .history-light .gametitle     { color: #111; }
        .history-light .gamepacktitle { color: #555; }
        .history-light .gamesettings  { color: #333; }
        .history-light .gamerecord    { border-color: #e0e0e0; }
        .history-light .datetime      { color: #555; opacity: 1; }
        .history-light .gameresult    { background: rgba(0,0,0,.06); color: #111; }
        .history-light .gamelabel     { color: #333; opacity: 1; }
        .history-light .gamevalue     { color: #111; }
        .history-light .history-empty { color: #555; opacity: 1; }

        /* Credits */
        .credits-line { margin-bottom: .5rem; line-height: 1.6; }
    </style>
</head>
<body>

<!-- Navbar -->
<nav class="navbar bg-dark border-bottom border-secondary px-3 py-2">
    <div class="d-flex align-items-center gap-2 w-100">
        <button class="btn btn-outline-secondary btn-sm d-none" id="btn-back">&#8592; <?= tr('Back') ?></button>
        <span class="fw-bold fs-5 me-auto" id="topbar-title" style="color:#f90"><?= esc($appTitle) ?></span>
        <span class="text-secondary small me-2"><?= esc($profile) ?></span>
        <nav class="d-flex gap-2">
            <?php foreach ($languages as $lng): ?>
                <a href="apps.php?profile=<?= urlencode($profile) ?>&lang=<?= urlencode($lng) ?>"
                   class="text-decoration-none <?= $locale === $lng ? 'text-warning fw-bold' : 'text-secondary' ?>"><?= esc(strtoupper($lng)) ?></a>
            <?php endforeach; ?>
        </nav>
    </div>
</nav>

<!-- Action bar -->
<div class="d-flex gap-2 px-3 py-2 bg-dark border-bottom border-secondary" id="action-bar">
    <button class="btn btn-outline-secondary btn-sm" id="btn-settings"><?= tr('Settings') ?></button>
    <button class="btn btn-outline-secondary btn-sm" id="btn-history"><?= tr('History') ?></button>
    <button class="btn btn-outline-secondary btn-sm" id="btn-about"><?= tr('About') ?></button>
</div>

<main class="container-xl py-4">

    <!-- Game launcher section -->
    <section class="section-page" id="panel-game">
        <div class="d-flex flex-column align-items-center gap-3">
            <div class="game-preview-wrap" id="game-preview-wrap">
                <img id="game-preview-img" src="" alt="" style="display:none">
                <div class="game-preview-placeholder" id="game-preview-placeholder" style="display:none">&#127918;</div>
                <div class="play-overlay"><div class="play-overlay-circle">&#9654;</div></div>
            </div>
            <div class="text-center">
                <h2 class="fw-bold" id="game-title" style="color:#f90"></h2>
                <p class="text-secondary mb-0" id="game-subtitle"></p>
            </div>
            <div class="d-flex flex-wrap gap-2 justify-content-center" id="game-action-btns"></div>
            <div class="w-100" style="max-width:640px" id="game-tab-content"></div>
        </div>
    </section>

    <!-- Global settings section -->
    <section class="section-page" id="panel-settings">
        <h4 class="mb-3" style="color:#f90"><?= tr('Settings') ?></h4>
        <div style="max-width:360px">
            <div class="mb-3">
                <label class="form-label" for="sel-language"><?= tr('Language') ?></label>
                <select class="form-select form-select-sm" id="sel-language">
                    <?php foreach ($languages as $lng): ?>
                        <option value="<?= esc($lng) ?>" <?= $locale === $lng ? 'selected' : '' ?>><?= esc(strtoupper($lng)) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <button class="btn btn-warning btn-sm" id="btn-settings-save"><?= tr('Save') ?></button>
        </div>
    </section>

    <!-- Global history section -->
    <section class="section-page" id="panel-history">
        <h4 class="mb-3" style="color:#f90"><?= tr('History') ?></h4>
        <div id="history-content" class="history-light"><em class="history-empty"></em></div>
    </section>

    <!-- About section -->
    <section class="section-page" id="panel-about">
        <h4 class="mb-3" style="color:#f90"><?= tr('About') ?></h4>
        <div id="about-content">
            <?php
            foreach ($credits as $line) {
                if (!$line) { echo '<br>'; continue; }
                $text = preg_replace('/^[^@]*@/', '', $line);
                $parts = preg_split('/(<[^>]+>)/', $text, -1, PREG_SPLIT_DELIM_CAPTURE);
                $html = '';
                foreach ($parts as $part) {
                    if (preg_match('/^<([^|>]+)\|([^>]+)>$/', $part, $m)) {
                        $html .= '<a href="' . esc($m[1]) . '" target="_blank" class="link-warning">' . esc($m[2]) . '</a>';
                    } elseif (preg_match('/^<(https?:\/\/[^>]+)>$/', $part, $m)) {
                        $html .= '<a href="' . esc($m[1]) . '" target="_blank" class="link-warning">' . esc($m[1]) . '</a>';
                    } else {
                        $html .= htmlspecialchars($part, ENT_QUOTES, 'UTF-8');
                    }
                }
                echo '<p class="credits-line text-light">' . $html . '</p>';
            }
            ?>
        </div>
    </section>

    <!-- App grid -->
    <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 g-3" id="app-grid">
        <?php foreach ($apps as $app): ?>
        <div class="col">
            <a class="app-card card bg-dark border-secondary h-100" href="#"
               data-app="<?= esc($app['name']) ?>"
               data-gamepack="<?= esc($app['gamepackName']) ?>">
                <?php if ($app['preview']): ?>
                    <img class="app-card-preview card-img-top"
                         src="<?= esc($app['preview']) ?>"
                         alt="<?= esc($app['title']) ?>"
                         loading="lazy">
                <?php else: ?>
                    <div class="app-card-preview-placeholder card-img-top">&#127918;</div>
                <?php endif; ?>
                <div class="card-body p-2">
                    <div class="card-title fw-semibold small mb-1"><?= esc($app['title']) ?></div>
                    <?php if ($app['subtitle']): ?>
                        <div class="card-text text-secondary" style="font-size:.75rem"><?= esc($app['subtitle']) ?></div>
                    <?php endif; ?>
                </div>
                <?php if ($app['tags']): ?>
                    <div class="card-footer p-2 d-flex flex-wrap gap-1 border-secondary">
                        <?php foreach ($app['tags'] as $tag): ?>
                            <span class="badge rounded-pill" style="background:rgba(255,153,0,.2);color:#f90;font-size:.65rem"><?= esc($tag) ?></span>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </a>
        </div>
        <?php endforeach; ?>
    </div>

</main>

<script src="js/bootstrap/bootstrap.bundle.min.js"></script>
<script>
(function() {
    var PROFILE      = <?= json_encode($profile,      JSON_UNESCAPED_UNICODE) ?>;
    var LOCALE       = <?= json_encode($locale,       JSON_UNESCAPED_UNICODE) ?>;
    var LOCALE_PARAM = <?= json_encode($langParam,    JSON_UNESCAPED_UNICODE) ?>;
    var INIT_GAME    = <?= json_encode($gameParam,    JSON_UNESCAPED_UNICODE) ?>;
    var INIT_GAMEPACK= <?= json_encode($gamepackParam,JSON_UNESCAPED_UNICODE) ?>;
    var API          = 'api/index.php';
    var SETTINGS_KEY = 'settings-' + PROFILE + '-global';
    var TR           = <?= json_encode($tr, JSON_UNESCAPED_UNICODE) ?>;
    var APPS_DATA    = <?= json_encode($apps, JSON_UNESCAPED_UNICODE) ?>;
    var selfBase     = 'apps.php?profile=' + encodeURIComponent(PROFILE) + (LOCALE_PARAM ? '&lang=' + encodeURIComponent(LOCALE_PARAM) : '');

    function t(k) { return TR[k] || k; }
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ------------------------------------------------------------------
    // Section navigation
    // ------------------------------------------------------------------
    var currentSection = null;
    var SECTION_TITLES = {
        game: '', settings: t('Settings'), history: t('History'), about: t('About')
    };
    var appTitleText = document.getElementById('topbar-title').textContent;

    function openSection(name, title) {
        if (currentSection) {
            document.getElementById('panel-' + currentSection).classList.remove('open');
        }
        currentSection = name;
        document.getElementById('panel-' + name).classList.add('open');
        document.getElementById('topbar-title').textContent = title || SECTION_TITLES[name] || name;
        document.body.classList.add('in-section');
        if (name === 'history')  loadHistory();
        if (name === 'settings') loadGlobalSettings();
    }

    function closeSection() {
        if (currentSection) {
            document.getElementById('panel-' + currentSection).classList.remove('open');
            currentSection = null;
        }
        document.body.classList.remove('in-section');
        document.getElementById('topbar-title').textContent = appTitleText;
        document.getElementById('game-tab-content').innerHTML = '';
        document.getElementById('game-tab-content').dataset.tab = '';
    }

    document.getElementById('btn-back').addEventListener('click', closeSection);
    document.getElementById('btn-settings').addEventListener('click', function() { openSection('settings'); });
    document.getElementById('btn-history').addEventListener('click',  function() { openSection('history');  });
    document.getElementById('btn-about').addEventListener('click',    function() { openSection('about');    });

    var initSection = <?= json_encode($section) ?>;
    if (initSection) openSection(initSection);

    // ------------------------------------------------------------------
    // App card clicks → game launcher
    // ------------------------------------------------------------------
    document.querySelectorAll('.app-card[data-app]').forEach(function(card) {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            var app = APPS_DATA.find(function(a) {
                return a.name === card.dataset.app && a.gamepackName === card.dataset.gamepack;
            });
            if (app) openGameLauncher(app);
        });
    });

    if (INIT_GAME) {
        var initApp = APPS_DATA.find(function(a) { return a.name === INIT_GAME && a.gamepackName === INIT_GAMEPACK; });
        if (initApp) openGameLauncher(initApp);
    }

    // ------------------------------------------------------------------
    // Game launcher
    // ------------------------------------------------------------------
    function openGameLauncher(app) {
        var img  = document.getElementById('game-preview-img');
        var ph   = document.getElementById('game-preview-placeholder');
        var wrap = document.getElementById('game-preview-wrap');
        if (app.preview) {
            img.src = app.preview; img.alt = app.title;
            img.style.display = 'block'; ph.style.display = 'none';
        } else {
            img.style.display = 'none'; ph.style.display = 'flex';
        }
        wrap.onclick = function() { launchGame(app); };

        document.getElementById('game-title').textContent    = app.title;
        document.getElementById('game-subtitle').textContent = app.subtitle || '';

        var btns = document.getElementById('game-action-btns');
        btns.innerHTML = '';

        function makeBtn(label, cls, cb) {
            var b = document.createElement('button');
            b.className = 'btn btn-sm ' + cls;
            b.textContent = label;
            b.addEventListener('click', cb);
            return b;
        }

        btns.appendChild(makeBtn(t('Start'), 'btn-warning', function() { launchGame(app); }));
        if (app.hasConfig) {
            btns.appendChild(makeBtn(t('Settings'), 'btn-outline-secondary', function() { toggleGameTab('settings', app); }));
        }
        if (app.instructions) {
            btns.appendChild(makeBtn(t('Instructions'), 'btn-outline-secondary', function() { toggleGameTab('instructions', app); }));
        }
        btns.appendChild(makeBtn(t('History'), 'btn-outline-secondary', function() { toggleGameTab('history', app); }));

        var tc = document.getElementById('game-tab-content');
        tc.innerHTML = ''; tc.dataset.tab = '';

        openSection('game', app.title);
    }

    function launchGame(app) {
        var backUrl = selfBase + '&game=' + encodeURIComponent(app.name) + '&gamepack=' + encodeURIComponent(app.gamepackName);
        window.location.href = 'index.php'
            + '?profile='  + encodeURIComponent(PROFILE)
            + '&lang='     + encodeURIComponent(LOCALE_PARAM || LOCALE)
            + '&app='      + encodeURIComponent(app.name)
            + '&gamepack=' + encodeURIComponent(app.gamepackName)
            + '&back='     + encodeURIComponent(backUrl);
    }

    function toggleGameTab(tabName, app) {
        var tc = document.getElementById('game-tab-content');
        if (tc.dataset.tab === tabName) {
            tc.innerHTML = ''; tc.dataset.tab = ''; return;
        }
        tc.dataset.tab = tabName;
        if (tabName === 'instructions') {
            tc.innerHTML = '<div class="card bg-dark border-secondary mt-3 p-3">'
                + '<h6 class="text-warning mb-2">' + esc(t('Instructions')) + '</h6>'
                + '<p class="instructions-text mb-0 text-light">' + esc(app.instructions) + '</p></div>';
        } else if (tabName === 'settings') {
            renderGameSettings(tc, app);
        } else if (tabName === 'history') {
            renderGameHistory(tc, app);
        }
    }

    // ------------------------------------------------------------------
    // Game settings form
    // ------------------------------------------------------------------
    function renderGameSettings(container, app) {
        container.innerHTML = '<div class="card bg-dark border-secondary mt-3 p-3"><em class="text-secondary">' + esc(t('Loading…')) + '</em></div>';
        fetch(API + '?_id=' + encodeURIComponent(app.settingsKey))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
            var saved = (data && data.settings) ? data.settings : {};
            var h = '<div class="card bg-dark border-secondary mt-3 p-3">'
                  + '<h6 class="text-warning mb-3">' + esc(t('Settings')) + '</h6>'
                  + '<form id="game-settings-form" style="max-width:360px">';
            app.config.forEach(function(field) {
                var val = saved[field.name] !== undefined ? saved[field.name] : field.default;
                h += '<div class="mb-3"><label class="form-label small">' + esc(field.title || field.name) + '</label>';
                if (field.type === 'string' && field.values) {
                    h += '<select class="form-select form-select-sm" name="' + esc(field.name) + '">';
                    field.values.forEach(function(v, i) {
                        var lbl = (field.valueLabels && field.valueLabels[i]) ? field.valueLabels[i] : v;
                        h += '<option value="' + esc(v) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(lbl) + '</option>';
                    });
                    h += '</select>';
                } else {
                    h += '<input type="number" class="form-control form-control-sm" name="' + esc(field.name) + '" value="' + esc(val) + '"'
                       + (field.minValue !== undefined ? ' min="' + esc(field.minValue) + '"' : '')
                       + (field.maxValue !== undefined ? ' max="' + esc(field.maxValue) + '"' : '') + '>';
                }
                h += '</div>';
            });
            h += '<button type="button" class="btn btn-warning btn-sm" id="btn-save-game-settings">' + esc(t('Save')) + '</button>'
               + '</form></div>';
            container.innerHTML = h;

            document.getElementById('btn-save-game-settings').addEventListener('click', function() {
                var form = document.getElementById('game-settings-form');
                var settings = {};
                app.config.forEach(function(field) {
                    var el = form.elements[field.name];
                    if (el) settings[field.name] = field.type === 'int' ? parseInt(el.value, 10) : el.value;
                });
                fetch(API, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ _id: app.settingsKey, profile: PROFILE, settings: settings })
                }).then(function() {
                    var msg = document.createElement('p');
                    msg.className = 'text-success mt-2 small';
                    msg.textContent = t('Saved');
                    form.appendChild(msg);
                    setTimeout(function() { if (msg.parentNode) msg.parentNode.removeChild(msg); }, 2000);
                });
            });
        });
    }

    // ------------------------------------------------------------------
    // Game history (filtered)
    // ------------------------------------------------------------------
    function renderGameHistory(container, app) {
        container.innerHTML = '<div class="card bg-dark border-secondary mt-3 p-3"><em class="text-secondary">' + esc(t('Loading…')) + '</em></div>';
        fetch(API + '?profile=' + encodeURIComponent(PROFILE)
                  + '&eventType=gameFinished'
                  + '&game='     + encodeURIComponent(app.name)
                  + '&gamepack=' + encodeURIComponent(app.gamepackName))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var docs = data.docs || [];
            var wrap = document.createElement('div');
            wrap.className = 'card bg-dark border-secondary mt-3 p-3';
            wrap.innerHTML = '<h6 class="text-warning mb-3">' + esc(t('History')) + '</h6>';
            var inner = document.createElement('div');
            inner.className = 'history-light';
            if (!docs.length) {
                inner.innerHTML = '<em class="history-empty">' + esc(t('History is empty')) + '</em>';
            } else {
                buildHistoryDocs(docs, inner);
            }
            wrap.appendChild(inner);
            container.innerHTML = '';
            container.appendChild(wrap);
        })
        .catch(function() {
            container.innerHTML = '<div class="card bg-dark border-secondary mt-3 p-3"><em class="text-danger">Error loading history.</em></div>';
        });
    }

    // ------------------------------------------------------------------
    // Global history (all games)
    // ------------------------------------------------------------------
    function loadHistory() {
        var el = document.getElementById('history-content');
        el.innerHTML = '<em class="history-empty">' + t('Loading…') + '</em>';
        fetch(API + '?profile=' + encodeURIComponent(PROFILE) + '&eventType=gameFinished')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var docs = data.docs || [];
            if (!docs.length) {
                el.innerHTML = '<em class="history-empty">' + t('History is empty') + '</em>'; return;
            }
            el.innerHTML = '';
            buildHistoryDocs(docs, el);
        })
        .catch(function() {
            el.innerHTML = '<em class="text-danger">Error loading history.</em>';
        });
    }

    function buildHistoryDocs(docs, container) {
        var idents = [], map = {};
        docs.forEach(function(r) {
            var ident = r.ident || r.game;
            if (map[ident]) { map[ident].push(r); } else { idents.push(ident); map[ident] = [r]; }
        });
        idents.forEach(function(ident) {
            var recs = map[ident], first = recs[0];
            var gi = document.createElement('div'); gi.className = 'gametopitem';
            var tb = document.createElement('div'); tb.className = 'gametitlebar';
            tb.innerHTML = '<span class="gametitle">' + esc(first.game || '') + '</span>'
                + '<span class="gamepacktitle">' + esc(first.gamepack || '') + '</span>'
                + '<span class="small">' + esc(first.locale || '') + '</span>';
            gi.appendChild(tb);
            if (first.settings && Object.keys(first.settings).length) {
                var sr = document.createElement('div'); sr.className = 'gamesettings';
                sr.textContent = Object.entries(first.settings).map(function(kv){ return kv[0]+'='+kv[1]; }).join(', ');
                gi.appendChild(sr);
            }
            recs.forEach(function(r) {
                var dt    = new Date(r.timestamp);
                var jsFmt = LOCALE === 'cz' ? 'cs-CZ' : 'en-US';
                var rec   = document.createElement('div'); rec.className = 'gamerecord';
                var dtEl  = document.createElement('div'); dtEl.className = 'datetime';
                dtEl.innerHTML = '<div>' + esc(dt.toLocaleDateString(jsFmt)) + '</div>'
                               + '<div>' + esc(dt.toLocaleTimeString(jsFmt, {hour:'2-digit',minute:'2-digit',second:'2-digit'})) + '</div>';
                rec.appendChild(dtEl);
                var results = r.eventData3 || [];
                if (results.length) {
                    var resEl = document.createElement('div'); resEl.className = 'gameresults';
                    results.forEach(function(s) {
                        if (typeof s !== 'string') return;
                        var idx = s.indexOf(':'); if (idx < 0) return;
                        resEl.innerHTML += '<div class="gameresult">'
                            + '<span class="gamelabel">' + esc(s.substring(0,idx).trim()) + '</span>'
                            + '<span class="gamevalue">' + esc(s.substring(idx+1).trim()) + '</span></div>';
                    });
                    rec.appendChild(resEl);
                }
                gi.appendChild(rec);
            });
            container.appendChild(gi);
        });
    }

    // ------------------------------------------------------------------
    // Global settings (language)
    // ------------------------------------------------------------------
    function loadGlobalSettings() {
        fetch(API + '?_id=' + encodeURIComponent(SETTINGS_KEY))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
            if (data && data.settings && data.settings.language)
                document.getElementById('sel-language').value = data.settings.language;
        }).catch(function() {});
    }

    document.getElementById('btn-settings-save').addEventListener('click', function() {
        var lang = document.getElementById('sel-language').value;
        fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ _id: SETTINGS_KEY, profile: PROFILE, settings: { language: lang } })
        }).then(function() {
            var url = new URL(window.location.href);
            url.searchParams.set('lang', lang);
            window.location.href = url.toString();
        });
    });

})();
</script>
</body>
</html>
