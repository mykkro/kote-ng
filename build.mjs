/**
 * KoTe Phase 1 build script.
 *
 * Concatenates all framework JS files (in the same order as the <script> tags in
 * index.html) into a single dist/bundle.js.  cordova.js is intentionally kept
 * separate — it is a platform-specific shim that must be swapped per target.
 *
 * Output: dist/bundle.js  +  dist/index.html
 *
 * Run with: node build.mjs
 */

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root      = __dirname;

// ---------------------------------------------------------------------------
// JS files to concatenate — same order as the <script> tags in index.html,
// with cordova.js excluded (it stays as its own tag, loaded before the bundle).
// ---------------------------------------------------------------------------
const JS_FILES = [
  'js/hammer.min.js',
  'js/hammer-time.min.js',
  'js/underscore.string.js',
  'js/sprintf.min.js',
  'js/easytimer.min.js',
  'js/utils.js',
  'js/Base.js',
  'js/timer.js',
  'js/widgets.js',
  'js/widgets.test.js',
  'js/widgets.html.js',
  'js/formix.js',
  'js/ellipse-distance.js',
  'js/tasks.js',
  'js/Game.js',
  'js/TimedGame.js',
  'js/NBackGame.js',
  'js/SoundPlayer.js',
  'js/Meta.js',
  'js/HistoryLogger.js',
  'js/AppsGUI.js',
  'js/GameGUI.js',
  'js/Grid.js',
  'js/KoteDB.js',
  'js/main.js',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readFile(relPath) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  [WARN] Not found, skipping: ${relPath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function formatBytes(n) {
  return n >= 1024 * 1024
    ? (n / 1024 / 1024).toFixed(1) + ' MB'
    : (n / 1024).toFixed(0) + ' KB';
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });

// 1. Concatenate JS ---------------------------------------------------------
console.log('\nBundling JS…');
let bundle = `/* KoTe bundle — generated ${new Date().toISOString()} */\n`;

for (const file of JS_FILES) {
  const src = readFile(file);
  if (src) {
    bundle += `\n\n/* ─── ${file} ─── */\n`;
    bundle += src;
    console.log(`  + ${file}`);
  }
}

const bundlePath = path.join(distDir, 'bundle.js');
fs.writeFileSync(bundlePath, bundle, 'utf-8');
console.log(`\n✓ dist/bundle.js  (${formatBytes(bundle.length)})`);

// 2. Produce dist/index.php ------------------------------------------------
//
// Strategy: read index.php, strip the individual <script> tags covered by
// bundle.js, and insert a single <script src="bundle.js">.  cordova.js and
// the inline KOTE_PROFILE <script> block stay as-is.
//
console.log('\nGenerating dist/index.php…');
let html = readFile('index.php');

// Remove every <script> tag whose src is one of the bundled JS files.
for (const file of JS_FILES) {
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`[ \\t]*<script[^>]+src="${escaped}"[^>]*>\\s*</script>[ \\t]*\\n?`, 'g');
  html = html.replace(re, '');
}

// Insert the bundle tag right before </body>
html = html.replace(
  '</body>',
  '        <script src="bundle.js"></script>\n    </body>',
);

const htmlPath = path.join(distDir, 'index.php');
fs.writeFileSync(htmlPath, html, 'utf-8');
console.log(`✓ dist/index.php`);

// 3. Summary ----------------------------------------------------------------
const remaining = (html.match(/<script/g) || []).length;
const bundledCount = JS_FILES.filter(f => fs.existsSync(path.join(root, f))).length;
console.log(`\n  Bundled ${bundledCount} scripts → 1  (cordova.js kept separate)`);
console.log(`  <script> tags remaining in dist/index.php: ${remaining}`);
console.log('\nDone.\n');
