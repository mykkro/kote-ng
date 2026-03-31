<?php
/**
 * KoTe entry point.
 *
 * Query string:
 *   ?profile=NAME   — select a named profile (default: "default")
 *
 * The profile name is injected into the page as window.KOTE_PROFILE so that
 * the JavaScript layer can pass it to KoteDB for all database operations.
 * Only alphanumeric characters, hyphens and underscores are allowed in the
 * profile name; anything else is stripped.
 */

$raw     = isset($_GET['profile']) ? $_GET['profile'] : 'default';
$profile = preg_replace('/[^a-zA-Z0-9_\-]/', '', $raw);
if ($profile === '') $profile = 'default';

// ?lang=en | ?lang=cz | ?lang=en-US | ?lang=cs-CZ  (empty = auto-detect in browser)
$lang = isset($_GET['lang']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['lang']) : '';

// ?app=NAME&gamepack=NAME — direct-launch a specific app (used by apps.php)
$app      = isset($_GET['app'])      ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['app'])      : '';
$gamepack = isset($_GET['gamepack']) ? preg_replace('/[^a-zA-Z0-9_\-]/', '', $_GET['gamepack']) : '';

// ?back=URL — where the Exit button should return to (must be a same-site relative URL)
$back = '';
if (!empty($_GET['back'])) {
    $raw_back = $_GET['back'];
    // Only allow relative URLs starting with known pages
    if (preg_match('/^(apps\.php|index\.php)[?&a-zA-Z0-9=_%\-\.]*$/', $raw_back)) {
        $back = $raw_back;
    }
}
?><!DOCTYPE html>
<!--
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
     KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
-->
<html>
    <head>
        <meta http-equiv="Content-Security-Policy" content="default-src * ws: blob:; style-src * 'unsafe-inline' 'self' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: 'unsafe-inline' 'self'; media-src 'self' mediastream;">

        <meta name="format-detection" content="telephone=no">
        <meta name="msapplication-tap-highlight" content="no">
        <meta name="viewport" content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width">

        <link rel="apple-touch-icon" sizes="57x57" href="img/favicon/apple-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="60x60" href="img/favicon/apple-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="72x72" href="img/favicon/apple-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="76x76" href="img/favicon/apple-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="114x114" href="img/favicon/apple-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="120x120" href="img/favicon/apple-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="144x144" href="img/favicon/apple-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="152x152" href="img/favicon/apple-icon-152x152.png">
        <link rel="apple-touch-icon" sizes="180x180" href="img/favicon/apple-icon-180x180.png">
        <link rel="icon" type="image/png" sizes="192x192"  href="img/favicon/android-icon-192x192.png">
        <link rel="icon" type="image/png" sizes="32x32" href="img/favicon/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="96x96" href="img/favicon/favicon-96x96.png">
        <link rel="icon" type="image/png" sizes="16x16" href="img/favicon/favicon-16x16.png">
        <link rel="manifest" href="img/favicon/manifest.json">
        <meta name="msapplication-TileColor" content="#ffffff">
        <meta name="msapplication-TileImage" content="img/favicon/ms-icon-144x144.png">
        <meta name="theme-color" content="#ffffff">

        <link rel="stylesheet" type="text/css" href="css/font-awesome/font-awesome.css">
        <link rel="stylesheet" type="text/css" href="css/font-awesome/flaticon.css">

        <link rel="stylesheet" href="css/style.css" media="screen">
        <link rel="stylesheet" href="css/formix.css" media="screen">
        <link rel="stylesheet" href="css/rotations.css" media="screen">
        <link rel="stylesheet" href="css/widgets.html.css" media="screen">

        <link rel="stylesheet" type="text/css" href="css/main.css">
        <title>KoTe</title>

        <!-- Runtime configuration injected server-side -->
        <script>
            var KOTE_PROFILE  = <?php echo json_encode($profile); ?>;
            var KOTE_LANG     = <?php echo json_encode($lang); ?>;
            var KOTE_APP      = <?php echo json_encode($app); ?>;
            var KOTE_GAMEPACK = <?php echo json_encode($gamepack ?: 'default'); ?>;
            var KOTE_BACK_URL = <?php echo json_encode($back); ?>;
        </script>
    </head>
    <body>
        <div class="app">
            <div id="stage">
                <div id="paper"></div>
                <div id="html-widgets">
                </div>
                <div id="settings-form-outer">
                    <div id="settings-form">
                        <div id="form-wrapper">
                            <div id="form"></div>
                        </div>
                    </div>
                </div>
                <div id="about-form-outer">
                    <div id="about-form">
                    </div>
                </div>
                <div id="history-form-outer">
                    <div id="history-form">
                    </div>
                </div>
            </div>
        </div>

        <script type="text/javascript" src="js/hammer.min.js"></script>
        <script type="text/javascript" src="js/hammer-time.min.js"></script>
        <script src="js/underscore.string.js"></script>
        <script src="js/sprintf.min.js"></script>
        <script src="js/easytimer.min.js"></script>
        <script src="js/utils.js"></script>
        <script src="js/Base.js"></script>
        <script src="js/timer.js"></script>
        <script src="js/widgets.js"></script>
        <script src="js/widgets.test.js"></script>
        <script src="js/widgets.html.js"></script>
        <script src="js/formix.js"></script>
        <script src="js/ellipse-distance.js"></script>
        <script src="js/tasks.js"></script>
        <script src="js/Game.js"></script>
        <script src="js/TimedGame.js"></script>
        <script src="js/NBackGame.js"></script>
        <script src="js/SoundPlayer.js"></script>
        <script src="js/Meta.js"></script>
        <script src="js/HistoryLogger.js"></script>
        <script src="js/AppsGUI.js"></script>
        <script src="js/GameGUI.js"></script>
        <script src="js/Grid.js"></script>

        <script src="js/KoteDB.js"></script>
        <script type="text/javascript" src="js/main.js"></script>
    </body>
</html>
