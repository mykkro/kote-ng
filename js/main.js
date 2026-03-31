var appgui;
var engine;

document.addEventListener('DOMContentLoaded', function() {

    window.addEventListener('orientationchange', onOrientationChange, true);
    window.addEventListener("resize", onResize, false);

    var profile = (typeof KOTE_PROFILE !== 'undefined' && KOTE_PROFILE) ? KOTE_PROFILE : 'default';
    var loc = (typeof KOTE_LANG !== 'undefined' && KOTE_LANG) ? KOTE_LANG : (navigator.language || navigator.userLanguage || 'en');
    var db  = new KoteDB('api/index.php', profile);

    USERTOKEN = profile;
    POUCHDB   = db;

    FINDER = function() {
        return db.find({ selector: { eventType: 'gameFinished' } });
    };

    FINDERBYGAME = function(game, gamepack, locale) {
        return db.find({
            selector: {
                eventType: 'gameFinished',
                game:      game,
                gamepack:  gamepack,
                locale:    locale
            }
        });
    };

    startup(db, loc, profile);
});


function startup(db, locale, usertoken) {
    console.log("Starting up!", db, locale);

    onResize();

    appgui = new AppsGUI(db, locale, usertoken);
    appgui.onReady(function() {
        console.log("AppGUI ready!");
        // Direct-launch mode: ?app= was supplied (e.g. from apps.php).
        if (typeof KOTE_APP !== 'undefined' && KOTE_APP) {
            appgui.launchSpecificApp(KOTE_APP, typeof KOTE_GAMEPACK !== 'undefined' ? KOTE_GAMEPACK : 'default');
        } else {
            appgui.showAppsPage();
        }
    });
    appgui.init();
}


function onOrientationChange() {
    var msg;
    console.log("Orientation has changed");
    switch (Math.abs(window.orientation)) {
        case 90:
            console.log("Device is in Landscape mode");
            break;
        default:
            console.log("Device is in Portrait mode");
            break;
    }
    updatePage();
}

function onResize() {
    console.log("Resize event fired");
    updatePage();

    var ww = window.innerWidth;
    var hh = window.innerHeight;

    // resize stage
    var boxsize = Math.min(ww, hh);
    console.log("Resized:", ww, hh, boxsize);
    var fontSize = Math.floor(boxsize/55);
    var formWrapper = document.getElementById('form-wrapper');
    if (formWrapper) formWrapper.style.fontSize = fontSize + 'px';
    var stage = document.getElementById('stage');
    if (stage) {
        stage.style.width  = boxsize + 'px';
        stage.style.height = boxsize + 'px';
        stage.style.left   = Math.floor((ww - boxsize) / 2) + 'px';
        stage.style.top    = Math.floor((hh - boxsize) / 2) + 'px';
    }
    // Scale the 1000×1000 logical paper to fill #stage exactly.
    var paper = document.getElementById('paper');
    if (paper) {
        var scale = boxsize / 1000;
        paper.style.transform = 'scale(' + scale + ')';
    }
}


function updatePage() {
    var strongStart = "<strong>";
    var strongEnd = "</strong>";
    var or = strongStart + "Orientation: " + strongEnd +
        (window.orientation || 0) + " degrees";
    var br = "<br/>";
    strRes = or + br;
    sw = strongStart + "Width: " + strongEnd + screen.width;
    strRes += sw + br;
    sh = strongStart + "Height: " + strongEnd + screen.height;
    strRes += sh + br;
    ww = strongStart + "Inner width: " + strongEnd +
        window.innerWidth;
    strRes += ww + br;
    wh = strongStart + "Inner height: " + strongEnd +
        window.innerHeight;
    strRes += wh + br;
}
