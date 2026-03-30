
var HistoryLogger = Base.extend({
    constructor: function(db, locale, usertoken) {
        console.log("History.constructor", db, locale, usertoken);
        this.db = db;
        this.locale = locale;
        this.usertoken = usertoken;
    },
    stringifySettings: function(settings) {
        out = [];
        for(key in settings) {
            out.push(key+"="+settings[key]);
        }
        return out.join(",");
    },
    logGameEvent: function(game, gamepack, locale, settings, eventType, eventData, eventData2, eventData3) {
        var timestamp = new Date().toISOString();
        var settingsStr = this.stringifySettings(settings);
        var idStr = game + ":" + gamepack + ":" + locale + ":" + settingsStr;
        console.log("Log game event:", this.usertoken, timestamp, idStr, idStr.hashCode(), eventType, eventData, eventData2, eventData3);
        var logItem = {
            "$type": "game-event",
            "_id": timestamp,
            "usertoken": this.usertoken,
            "timestamp": timestamp,
            "game": game,
            "gamepack": gamepack,
            "locale": locale,
            "settings": settings,
            "ident": idStr,
            "hash": idStr.hashCode(),
            "eventType": eventType,
            "eventData": eventData,
            "eventData2": eventData2,
            "eventData3": eventData3
        }
        this.storeToDB(logItem);
    },
    storeToDB: function(logItem) {
        var self = this;
        if(!self.db) {
            // database not available...
            // TODO use local storage!
        } else {
          self.db.put(logItem, function callback(err, result) {
            // console.log("PouchDB.put:", err, result);
          });
        }
    },
    renderHistory: function(loc, data, messageIfEmpty) {
        var makeGameTitle = function(gameTitle) {
            return h('span', { 'class': 'gametitle' }, gameTitle);
        }

        var makeGamepackTitle = function(gamepackTitle) {
            return h('span', { 'class': 'gamepacktitle' }, gamepackTitle);
        }

        var makeLocaleWidget = function(locale) {
            return h('span', null, locale);
        }

        var makeSettingsWidget = function(settings) {
            var si = [];
            for(var s in settings) {
                si.push(s + "=" + settings[s]);
            }
            return h('div', { 'class': 'gamesettings' }, si.join(", "));
        }

        var makeGameItem = function(rec) {
            var game     = rec.game;
            var gamepack = rec.gamepack;
            var locale   = rec.locale;
            return h('div', { 'class': 'gameitem' },
                h('div', { 'class': 'gametitlebar' },
                    makeGameTitle(game),
                    makeGamepackTitle(gamepack),
                    makeLocaleWidget(locale)
                ),
                makeSettingsWidget(rec.settings)
            );
        }

        var makeDateTime = function(date, time) {
            return h('div', { 'class': 'datetime' },
                h('div', { 'class': 'gamedate' }, date),
                h('div', { 'class': 'gametime' }, time)
            );
        }

        var makeResults = function(results) {
            var res = h('div', { 'class': 'gameresults' });
            var rr = [];
            results.forEach(function(r) {
                if(typeof(r) == "string") {
                    var parts = r.split(":");
                    if(parts.length == 2) {
                        rr.push({ label: parts[0], value: parts[1] });
                    }
                }
            });
            rr.forEach(function(r) {
                console.log(r.label, r.value);
                res.appendChild(
                    h('div', { 'class': 'gameresult' },
                        h('div', { 'class': 'gamelabel' }, r.label),
                        h('div', { 'class': 'gamevalue' }, r.value)
                    )
                );
            });
            return res;
        }

        var records = data.docs || [];
        var historyForm = document.getElementById('history-form');
        historyForm.innerHTML = '';

        if(records.length == 0) {
            historyForm.appendChild(h('div', { 'class': 'historyempty' }, messageIfEmpty));
            return;
        }

        // group records by ident
        var idents   = [];
        var identMap = {};
        records.forEach(function(r) {
            if(r.ident in identMap) {
                identMap[r.ident].push(r);
            } else {
                idents.push(r.ident);
                identMap[r.ident] = [r];
            }
        });

        var out = h('div', { 'class': 'output' });
        historyForm.appendChild(out);

        idents.forEach(function(ident) {
            var records = identMap[ident];
            var first   = records[0];
            var gi = h('div', { 'class': 'gametopitem' });
            gi.appendChild(makeGameItem(first));
            records.forEach(function(r) {
                var ts   = r.timestamp;
                var dt   = new Date(ts);
                var date = dt.toLocaleDateString(loc);
                var time = dt.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                var result = r.eventData3 || [];
                console.log("Rec:", date, time, result);
                gi.appendChild(
                    h('div', { 'class': 'gamerecord' },
                        makeDateTime(date, time),
                        makeResults(result)
                    )
                );
            });
            out.appendChild(gi);
        });
    }
});
