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

    // Title / subtitle / description / instructions — gamepack locale wins over app locale
    $title        = $gpLocale['metadata']['title']        ?? $appLocale['metadata']['title']        ?? $app['name'];
    $subtitle     = $gpLocale['metadata']['subtitle']     ?? $appLocale['metadata']['subtitle']     ?? '';
    $description  = $gpLocale['metadata']['description']  ?? $appLocale['metadata']['description']  ?? '';
    $instructions = $gpLocale['metadata']['instructions'] ?? $appLocale['metadata']['instructions'] ?? '';
    $subtitle     = trim($subtitle);
    $description  = trim($description);
    $instructions = trim($instructions);

    // Config fields: gamepack-level config overrides app-level config (null = inherit)
    $config = $app['config'] ?? [];
    if (!empty($gamepack['config'])) $config = $gamepack['config'];

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
        #panel-history .history-empty { color: #555; }
        #panel-history .gametopitem { border-color: #ccc; }
        #panel-history .gametitlebar { background: rgba(200,120,0,.15); }
        #panel-history .gametitle    { color: #222; }
        #panel-history .gamepacktitle{ color: #555; }
        #panel-history .gamesettings { color: #444; }
        #panel-history .datetime     { color: #555; }
        #panel-history .gamerecord   { border-color: #e0e0e0; }
        #panel-history .gameresult   { background: rgba(0,0,0,.06); color: #222; }
        #panel-history .gamesettings { color: #333; }
        #panel-history .gamelabel    { color: #333; }
        #panel-history .gamevalue    { color: #111; }
        .history-empty { opacity: .6; font-style: italic; }

        /* History inside game launcher tab — same dark-text treatment */
        .game-tab-box .gametopitem   { border-color: #ccc; background: #fff; border-radius: 6px; }
        .game-tab-box .gametitlebar  { background: rgba(200,120,0,.15); }
        .game-tab-box .gametitle     { color: #222; }
        .game-tab-box .gamepacktitle { color: #555; }
        .game-tab-box .gamesettings  { color: #333; }
        .game-tab-box .gamerecord    { border-color: #e0e0e0; }
        .game-tab-box .datetime      { color: #555; }
        .game-tab-box .gameresult    { background: rgba(0,0,0,.06); color: #222; }
        .game-tab-box .gamelabel     { color: #333; }
        .game-tab-box .gamevalue     { color: #111; }
        .game-tab-box .history-empty { color: #555; }
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

        /* Game launcher panel */
        #panel-game { color: #e8e8e8; }
        .game-launcher { display: flex; flex-direction: column; align-items: center; gap: 1.25rem; }
        .game-preview-wrap {
            width: 100%; max-width: 420px;
            border-radius: 12px; overflow: hidden;
            cursor: pointer; position: relative;
        }
        .game-preview-wrap img {
            width: 100%; display: block;
            transition: opacity .15s;
        }
        .game-preview-wrap:hover img { opacity: .85; }
        .game-preview-placeholder {
            width: 100%; aspect-ratio: 1;
            background: rgba(255,153,0,.1);
            display: flex; align-items: center; justify-content: center;
            font-size: 5rem; color: #f90;
            cursor: pointer;
        }
        .game-preview-wrap .play-overlay {
            position: absolute; inset: 0;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: opacity .2s;
        }
        .game-preview-wrap:hover .play-overlay { opacity: 1; }
        .play-overlay-circle {
            width: 72px; height: 72px; border-radius: 50%;
            background: rgba(0,0,0,.55);
            display: flex; align-items: center; justify-content: center;
            font-size: 2rem; color: #fff;
        }
        .game-title-block { text-align: center; }
        .game-title-block h2 { font-size: 1.5rem; font-weight: 700; color: #f90; margin-bottom: .25rem; }
        .game-title-block p  { font-size: .9rem; opacity: .7; }
        .game-action-btns {
            display: flex; flex-wrap: wrap; gap: .6rem; justify-content: center;
        }
        .game-action-btns .btn-launch {
            font-size: 1.1rem; padding: .65rem 2rem;
        }
        .game-tab-content { width: 100%; max-width: 640px; }
        .game-tab-box {
            background: rgba(255,255,255,.07);
            border-radius: 10px; padding: 1.25rem;
            margin-top: .5rem;
        }
        .game-tab-box h3 { font-size: 1rem; font-weight: 700; color: #f90; margin-bottom: .85rem; }
        .instructions-text { line-height: 1.7; font-size: .92rem; white-space: pre-wrap; }
        .settings-field { margin-bottom: .85rem; }
        .settings-field label { display: block; font-size: .85rem; opacity: .75; margin-bottom: .3rem; }
        .settings-field select, .settings-field input[type=number] {
            width: 100%; padding: .4rem .6rem;
            border-radius: 6px; border: 1px solid rgba(255,255,255,.2);
            background: rgba(255,255,255,.08); color: inherit; font-size: .9rem;
        }

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

    <!-- Game launcher section -->
    <section class="section-page" id="panel-game">
        <div class="game-launcher" id="game-launcher">
            <div class="game-preview-wrap" id="game-preview-wrap">
                <img id="game-preview-img" src="" alt="" style="display:none">
                <div class="game-preview-placeholder" id="game-preview-placeholder" style="display:none">&#127918;</div>
                <div class="play-overlay"><div class="play-overlay-circle">&#9654;</div></div>
            </div>
            <div class="game-title-block">
                <h2 id="game-title"></h2>
                <p id="game-subtitle"></p>
            </div>
            <div class="game-action-btns" id="game-action-btns"></div>
            <div class="game-tab-content" id="game-tab-content"></div>
        </div>
    </section>

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
        <?php foreach ($apps as $app): ?>
        <a class="app-card" href="#"
           data-app="<?= esc($app['name']) ?>"
           data-gamepack="<?= esc($app['gamepackName']) ?>">
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
    // Section navigation (full-page replace)
    // ------------------------------------------------------------------
    var currentSection = null;
    var SECTION_TITLES = {
        game:     '',   // filled dynamically
        settings: t('Settings'),
        history:  t('History'),
        about:    t('About')
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
        // Reset game tab content so it reloads fresh next time
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
            var appName     = card.dataset.app;
            var gamepackName= card.dataset.gamepack;
            var app = APPS_DATA.find(function(a) { return a.name === appName && a.gamepackName === gamepackName; });
            if (app) openGameLauncher(app);
        });
    });

    // Auto-open game launcher from ?game= query param
    if (INIT_GAME) {
        var initApp = APPS_DATA.find(function(a) { return a.name === INIT_GAME && a.gamepackName === INIT_GAMEPACK; });
        if (initApp) openGameLauncher(initApp);
    }

    // ------------------------------------------------------------------
    // Game launcher
    // ------------------------------------------------------------------
    var currentGame = null;

    function openGameLauncher(app) {
        currentGame = app;

        // Preview
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

        // Title
        document.getElementById('game-title').textContent   = app.title;
        document.getElementById('game-subtitle').textContent = app.subtitle || '';

        // Buttons
        var btns = document.getElementById('game-action-btns');
        btns.innerHTML = '';

        function makeBtn(label, cls, cb) {
            var b = document.createElement('button');
            b.className = 'btn ' + cls;
            b.textContent = label;
            b.addEventListener('click', cb);
            return b;
        }

        btns.appendChild(makeBtn(t('Start'), 'btn-primary btn-launch', function() { launchGame(app); }));
        if (app.hasConfig) {
            btns.appendChild(makeBtn(t('Settings'), '', function() { toggleGameTab('settings', app); }));
        }
        if (app.instructions) {
            btns.appendChild(makeBtn(t('Instructions'), '', function() { toggleGameTab('instructions', app); }));
        }
        btns.appendChild(makeBtn(t('History'), '', function() { toggleGameTab('history', app); }));

        // Reset tab
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
            tc.innerHTML = '<div class="game-tab-box"><h3>' + esc(t('Instructions')) + '</h3>'
                + '<p class="instructions-text">' + esc(app.instructions) + '</p></div>';
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
        container.innerHTML = '<div class="game-tab-box"><em>' + esc(t('Loading…')) + '</em></div>';
        fetch(API + '?_id=' + encodeURIComponent(app.settingsKey))
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
            var saved = (data && data.settings) ? data.settings : {};
            var box = document.createElement('div');
            box.className = 'game-tab-box';
            var h = '<h3>' + esc(t('Settings')) + '</h3><form id="game-settings-form">';
            app.config.forEach(function(field) {
                var val = saved[field.name] !== undefined ? saved[field.name] : field.default;
                h += '<div class="settings-field"><label>' + esc(field.title || field.name) + '</label>';
                if (field.type === 'string' && field.values) {
                    h += '<select name="' + esc(field.name) + '">';
                    field.values.forEach(function(v, i) {
                        var lbl = (field.valueLabels && field.valueLabels[i]) ? field.valueLabels[i] : v;
                        h += '<option value="' + esc(v) + '"' + (String(val) === String(v) ? ' selected' : '') + '>' + esc(lbl) + '</option>';
                    });
                    h += '</select>';
                } else {
                    h += '<input type="number" name="' + esc(field.name) + '" value="' + esc(val) + '"'
                       + (field.minValue !== undefined ? ' min="' + esc(field.minValue) + '"' : '')
                       + (field.maxValue !== undefined ? ' max="' + esc(field.maxValue) + '"' : '') + '>';
                }
                h += '</div>';
            });
            h += '<div class="btn-row"><button type="button" class="btn btn-primary" id="btn-save-game-settings">' + esc(t('Save')) + '</button></div></form>';
            box.innerHTML = h;
            container.innerHTML = '';
            container.appendChild(box);

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
                    msg.style.cssText = 'color:#6d6;margin-top:.5rem;font-size:.85rem;';
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
        container.innerHTML = '<div class="game-tab-box"><em>' + esc(t('Loading…')) + '</em></div>';
        fetch(API + '?profile=' + encodeURIComponent(PROFILE)
                  + '&eventType=gameFinished'
                  + '&game='     + encodeURIComponent(app.name)
                  + '&gamepack=' + encodeURIComponent(app.gamepackName))
        .then(function(r) { return r.json(); })
        .then(function(data) {
            var docs = data.docs || [];
            var box = document.createElement('div');
            box.className = 'game-tab-box';
            box.innerHTML = '<h3>' + esc(t('History')) + '</h3>';
            if (!docs.length) {
                box.innerHTML += '<em class="history-empty">' + esc(t('History is empty')) + '</em>';
            } else {
                buildHistoryDocs(docs, box);
            }
            container.innerHTML = '';
            container.appendChild(box);
        })
        .catch(function() {
            container.innerHTML = '<div class="game-tab-box"><em>Error loading history.</em></div>';
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
            el.innerHTML = '<em class="history-empty">Error loading history.</em>';
        });
    }

    function buildHistoryDocs(docs, container) {
        // Group by ident
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
                + '<span>' + esc(first.locale || '') + '</span>';
            gi.appendChild(tb);
            if (first.settings && Object.keys(first.settings).length) {
                var sr = document.createElement('div'); sr.className = 'gamesettings';
                sr.textContent = Object.entries(first.settings).map(function(kv){ return kv[0]+'='+kv[1]; }).join(', ');
                gi.appendChild(sr);
            }
            recs.forEach(function(r) {
                var dt   = new Date(r.timestamp);
                var jsFmt= LOCALE === 'cz' ? 'cs-CZ' : 'en-US';
                var rec  = document.createElement('div'); rec.className = 'gamerecord';
                var dtEl = document.createElement('div'); dtEl.className = 'datetime';
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
