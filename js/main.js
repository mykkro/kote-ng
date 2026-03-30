var appgui;
var engine;

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener("deviceready", function() {
        // get network and platform info...
        var networkState = navigator.connection.type;
        var states = {};
        states[Connection.UNKNOWN] = 'Unknown connection';
        states[Connection.ETHERNET] = 'Ethernet connection';
        states[Connection.WIFI] = 'WiFi connection';
        states[Connection.CELL_2G] = 'Cell 2G connection';
        states[Connection.CELL_3G] = 'Cell 3G connection';
        states[Connection.CELL_4G] = 'Cell 4G connection';
        states[Connection.CELL] = 'Cell generic connection';
        states[Connection.NONE] = 'No network connection';

        console.log('Connection type: ' + states[networkState]);
        console.log(device.platform);

        // detect locale...
        // TODO user token will be used to distinguish records in the database...
        var usertoken = "7505d64a54e061b7acd54ccd58b49dc43500b635";
        var globalization = navigator.globalization;
        globalization.getLocaleName(function(locale) {
            // locale.value can be something like "en-US", "cs-CZ"
            var loc = (locale ? locale.value : null);
            /* PouchDB stuff... */
            var db = new PouchDB('kote');
            // for debugging purposes...
            POUCHDB = db;
            USERTOKEN = usertoken;
            FINDER = function() {
                return POUCHDB.createIndex(
                    {
                        index: {
                            fields: ["timestamp", 'usertoken', 'eventType']
                        }
                    }
                ).then(function() {
                    return POUCHDB.find({
                        selector: {
                            "eventType": "gameFinished",
                            "usertoken": USERTOKEN,
                            "timestamp": { $gt: null }
                        },
                        "sort": [{"timestamp": 'desc'}, {"usertoken":'asc'}, {"eventType": 'asc'}]
                    });
                });
            }
            FINDERBYGAME = function(game, gamepack, locale) {
                return POUCHDB.createIndex(
                    {
                        index: {
                            fields: ["timestamp", 'usertoken', 'eventType', 'game', 'gamepack', 'locale']
                        }
                    }
                ).then(function() {
                    return POUCHDB.find({
                        selector: {
                            "eventType": "gameFinished",
                            "usertoken": USERTOKEN,
                            "timestamp": { $gt: null },
                            "game": game,
                            "gamepack": gamepack,
                            "locale": locale
                        },
                        "sort": [{"timestamp": 'desc'}, {"usertoken":'asc'}, {"eventType": 'asc'}]
                    });
                });
            }
            startup((db && db.adapter) ? db : null, loc, usertoken);
        });
    });

    window.addEventListener('orientationchange', onOrientationChange, true);
    //for devices that don't fire orientationchange
    window.addEventListener("resize", onResize, false);
});

function testPost() {
    // testing sending request to server...
    var url = 'http://download.mykkro.cz/testing/api.php';
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ "username": "C-Tester", "another_thing" : "thing" }'
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        console.log("Got data:", data);
        alert("Success! " + data.success);
    })
    .catch(function(err) {
        console.log(err);
        alert("Error! " + err);
    });
}

function startup(db, locale, usertoken) {
    console.log("Starting up!", db, locale);

    onResize();

    appgui = new AppsGUI(db, locale, usertoken);
    appgui.onReady(function() {
        console.log("AppGUI ready!");
        appgui.showAppsPage();
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
