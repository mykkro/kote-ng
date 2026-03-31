class HistoryLogger extends Base {
    constructor(db, locale, usertoken) {
        super();
        this.db = db;
        this.locale = locale;
        this.usertoken = usertoken;
        this.currentSessionId = null;
    }

    logGameEvent(game, gamepack, locale, settings, eventType, eventData, eventData2, eventData3) {
        var timestamp = new Date().toISOString();

        // Session lifecycle: create UUID on gameStarted, clear after finish/abort.
        if (eventType === 'gameStarted') {
            this.currentSessionId = generateUUID();
        }

        var sessionId = this.currentSessionId;

        var logItem = {
            '$type':      'game-event',
            '_id':        sessionId || timestamp,
            'sessionId':  sessionId,
            'profile':    this.usertoken,
            'timestamp':  timestamp,
            'game':       game,
            'gamepack':   gamepack,
            'locale':     locale,
            'settings':   settings,
            'eventType':  eventType,
            'eventData':  eventData,
            'eventData2': eventData2,
            'eventData3': eventData3
        };

        this.storeToDB(logItem);

        if (eventType === 'gameFinished' || eventType === 'gameAborted') {
            this.currentSessionId = null;
        }
    }

    storeToDB(logItem) {
        var self = this;
        if (!self.db) return;
        self.db.put(logItem);
    }

    renderHistory(loc, data, messageIfEmpty) {
        var records = data.docs || [];
        var historyForm = document.getElementById('history-form');
        historyForm.innerHTML = '';

        if (records.length === 0) {
            historyForm.appendChild(h('div', { 'class': 'historyempty' }, messageIfEmpty));
            return;
        }

        // Group records by ident (game + gamepack + locale + settings combo).
        var idents   = [];
        var identMap = {};
        records.forEach(function(r) {
            var ident = r.ident || r.game;
            if (ident in identMap) {
                identMap[ident].push(r);
            } else {
                idents.push(ident);
                identMap[ident] = [r];
            }
        });

        var out = h('div', { 'class': 'output' });
        historyForm.appendChild(out);

        idents.forEach(function(ident) {
            var recs  = identMap[ident];
            var first = recs[0];
            var gi    = h('div', { 'class': 'gametopitem' });
            gi.appendChild(makeGameItem(first));
            recs.forEach(function(r) {
                var ts   = r.timestamp;
                var dt   = new Date(ts);
                var date = dt.toLocaleDateString(loc);
                var time = dt.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                var report = r.eventData3 || [];
                gi.appendChild(
                    h('div', { 'class': 'gamerecord' },
                        makeDateTime(date, time),
                        makeResults(report)
                    )
                );
            });
            out.appendChild(gi);
        });

        // ---- helpers ----

        function makeGameItem(rec) {
            return h('div', { 'class': 'gameitem' },
                h('div', { 'class': 'gametitlebar' },
                    h('span', { 'class': 'gametitle' },     rec.game     || ''),
                    h('span', { 'class': 'gamepacktitle' }, rec.gamepack || ''),
                    h('span', null,                         rec.locale   || '')
                ),
                makeSettingsWidget(rec.settings)
            );
        }

        function makeSettingsWidget(settings) {
            var si = [];
            for (var s in (settings || {})) {
                si.push(s + '=' + settings[s]);
            }
            return h('div', { 'class': 'gamesettings' }, si.join(', '));
        }

        function makeDateTime(date, time) {
            return h('div', { 'class': 'datetime' },
                h('div', { 'class': 'gamedate' }, date),
                h('div', { 'class': 'gametime' }, time)
            );
        }

        function makeResults(results) {
            var res = h('div', { 'class': 'gameresults' });
            (results || []).forEach(function(r) {
                if (typeof r === 'string') {
                    var parts = r.split(':');
                    if (parts.length >= 2) {
                        res.appendChild(
                            h('div', { 'class': 'gameresult' },
                                h('div', { 'class': 'gamelabel' }, parts[0]),
                                h('div', { 'class': 'gamevalue' }, parts.slice(1).join(':').trim())
                            )
                        );
                    }
                }
            });
            return res;
        }
    }
}
