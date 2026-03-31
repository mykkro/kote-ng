/**
 * KoteDB — REST API client replacing PouchDB.
 *
 * All operations are scoped to a named profile (e.g. "default", "alice").
 * The profile is set at construction time and automatically stamped onto
 * every document that is stored.
 *
 * Implements the PouchDB subset used by this app:
 *   put(doc, [callback])   — upsert document by _id (profile is added automatically)
 *   get(_id)               — fetch document by _id; rejects with {status:404} if missing
 *   createIndex(config)    — no-op (server handles indexing); returns resolved Promise
 *   find(query)            — query by selector fields; returns Promise<{docs:[...]}>
 */
class KoteDB {
    constructor(apiUrl, profile) {
        this.apiUrl  = apiUrl  || 'api/index.php';
        this.profile = profile || 'default';
        this.adapter = 'rest';
    }

    put(doc, callback) {
        // Stamp the profile onto every document before storing.
        var stored = Object.assign({}, doc, { profile: this.profile });

        return fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stored)
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (callback) callback(null, data);
            return data;
        })
        .catch(function(err) {
            if (callback) callback(err);
            throw err;
        });
    }

    get(id) {
        var url = this.apiUrl + '?_id=' + encodeURIComponent(id);
        return fetch(url).then(function(r) {
            if (r.status === 404) {
                return r.json().then(function() {
                    var err = new Error('not_found');
                    err.status = 404;
                    err.name   = 'not_found';
                    throw err;
                });
            }
            return r.json();
        });
    }

    createIndex() {
        return Promise.resolve({ result: 'created' });
    }

    find(query) {
        var selector = (query && query.selector) ? query.selector : {};
        var params   = new URLSearchParams();

        // Always scope by this profile unless the selector overrides it.
        params.set('profile', selector.profile || this.profile);

        var passThrough = ['eventType', 'game', 'gamepack', 'locale'];
        for (var i = 0; i < passThrough.length; i++) {
            var key = passThrough[i];
            var val = selector[key];
            if (val !== undefined && val !== null && typeof val === 'string') {
                params.set(key, val);
            }
        }

        var url = this.apiUrl + '?' + params.toString();
        return fetch(url).then(function(r) { return r.json(); });
    }
}

window.KoteDB = KoteDB;
