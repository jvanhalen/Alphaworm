// Sama koodi pitää toimia clientiessä ja serverissä, siksi tällainen funktiomäärittely
(function(exports){

    message = {
        id: "1",

        CHAT_SYNC: {
            message: {
                name: "CHAT_SYNC",
                username: null,  // Keneltä viesti tuli (username)
                text: null       // Viestin sisältö
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        MATCH_SYNC: {
            message: {
                name: "MATCH_SYNC",
                phase: "INIT/RUN/END",
                msgid: null,
                worms: [],
                foods: [],
                word: {},    //{finnish: null, english: null}
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        USER_INPUT: {
            message: {
                name: "USER_INPUT",
                username: "username",
                direction: "left/right/up/down"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        QUEUE_MATCH: {
            message: {
                name: "QUEUE_MATCH",
                username: "username",
                matchid: "uuid",
                players: [{}] // Usernames and their responses {username: "username", response: "OK/NOK"}
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        REG_REQ: {
            message: {
                name: "REG_REQ",   // Client lähettää tämän palvelimelle
                username: null,     // Clientin kyättäjäname (lue html-lomakkeesta)
                passwordhash: null  // SHA1-koodattu salasanatiiviste (lue html-lomakkeesta ja generoi SHA1-tiiviste)
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        REG_RESP: {
            message: {
                name: "REG_RESP",  // Palvelin vastaa clientille
                response: "OK/NOK"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        AUTH_REQ: {
            message: {
                name: "AUTH_REQ",   // Client lähettää tämän palvelimelle
                username: null,     // Clientin käyttäjäname (lue html-lomakkeesta)
                passwordhash: null  // SHA1-koodattu salasanatiiviste (lue html-lomakkeesta ja generoi SHA1-tiiviste)
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        AUTH_RESP: {
            message: {
                name: "AUTH_RESP",  // Palvelin vastaa clientille
                username: "username_from_database",
                response: "OK/NOK"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        DISCONNECT_REQ: {
            message: {
                name: "DISCONNECT_REQ",
                username: "username"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        DISCONNECT_RESP: {
            message: {
                name: "DISCONNECT_RESP",
                username: "username",
                response: "OK"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PING: {
            message: {
                name: "PING",
                timestamp: null,
                value: 0    // Satunnainen merkkijono, vastaus samalla numerolla
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PONG: {
            message: {
                name: "PONG",
                timestamp: null,
                value: 0      // Palvelimen generoima merkkijono, vastaus samalla merkkijonolla
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        SERVER_STATS: {
            message: {
                name: "SERVER_STATS",
                uptime: "string",
                systemload: "string",
                memusage: "string",
                system: "string",
                connectedusers: 0,
                authenticatedusers: 0,
                totalusers: 0,
                avgoutput: 0,
                avginput: 0,
                timestamp: 0
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        PLAYER_LIST: {
            message: {
                name: "PLAYER_LIST",
                type: "full/update",   // Always check whether this is an update or a full list
                players: [{username: "Wobotti",
                          ingame: true,
                          authenticated: true,    // false if user disconnected, otherwise true
                          rank: 0,
                          highscore: 0}]
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        CHALLENGE_REQ: {
            message: {
                name: "CHALLENGE_REQ",
                challenger: "username",
                challengee: "username"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        CHALLENGE_RESP: {
            message: {
                name: "CHALLENGE_RESP",
                challenger: "username",
                challengee: "username",
                response: "OK/NOK"
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
        RANKING_LIST: {
            message: {
                name: "RANKING_LIST",
                players: [{username: "Wobotti", // Players are already in descending order (highest rank -> lowest)
                           highscore: 0}]
            },
            new: function() {
                return JSON.parse(JSON.stringify(this.message));
            }
        },
    }

    exports.message = message;

})(typeof exports === 'undefined'? this['messages']={}: exports);