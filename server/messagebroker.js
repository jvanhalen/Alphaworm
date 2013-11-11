var messages = require('../common/messages');

var MessageBroker = function(server) {

    // Määrittele scope
    var self = this;

    self.clients  = {}; // Index with username
    self.serverapp = server.serverapp;
    self.connected = 0;
    self.authenticated = 0;
    self.skipped = 0;
    self.receivedMessages = 0;
    self.sentTotal = 0;
    self.receivedTotal = 0;
    self.avgThroughPut = 0;
    self.avgInput = 0;
    self.avgOutput = 0;

    self.init = function() {
        console.log("MessageBroker: initializing websocket");
        self.tpinterval = setInterval(self.calculateThroughput, 10000);
        var WebSocketServer = require('ws').Server;
        self.wss = new WebSocketServer({server: self.serverapp});
        self.wss.on('connection', function(websocket) {
            //

            console.log("MessageBroker: client connected to port", websocket._socket.remotePort);
            websocket.username = null;
            self.connected++;

            // YHTEYDEN KATKETESSA
            websocket.on('close', function() {
                console.log("MessageBroker: client disconnected (" + websocket.username +")");
                var username = websocket.username;

                // Set websocket's username to null
                websocket.username = null;

                // Notify other server objects about the disconnection
                if (username != null) {
                    self.disconnectClient(username);
                    console.log(username, "disconnected");
                    var msg = messages.message.DISCONNECT_REQ.new();
                    msg.username = username;
                    self.receive(username, msg);

                }
                else {
                    self.connected--;
                }
            });

            // VIESTI VASTAANOTETTAESSA
            websocket.on('message', function(data, flags) {
                self.receivedMessages++;    // Possible overflow?

                // TODO: Tarkista datan tyyppi ennen parsimista - muuten palvelin kaatuu
                self.dataReceived(data.length);
                data = JSON.parse(data);

                // Separate authentication and registration messages from others
                // handle string lower case
                if(data.name == "AUTH_REQ" || data.name == "REG_REQ" && typeof data.username === 'string') {
                    console.log("authentication request from", data.username);
                    var lcusername = data.username.toLowerCase();
                    if (null == websocket.username && undefined == self.clients[lcusername]) {
                        self.messageHandler.authenticate(websocket, data);
                    }
                    else {
                        console.log("MessageBroker: websocket already authenticated as", websocket.username);
                        var resp = messages.message.AUTH_RESP.new();
                        resp.response = "NOK";
                        websocket.send(JSON.stringify(resp));
                    }
                }
                else if (websocket.username != null) {
                    // Handle disconnect here, then delegate
                    switch(data.name) {
                        case 'DISCONNECT_REQ':
                            self.disconnectClient(websocket.username);
                            break;

                        case 'PONG':
                            server.pong(data);
                            break;

                        default:
                            // User has authenticated, proceed to message handling
                            self.receive(websocket.username, data);
                            break;
                    }
                }
                else {
                    // Skip message
                    //console.log("skipped", data);
                    //TODO: prevent DDos?
                    self.skipped++;
                    if (self.skipped % 1) { // Change 1 to 1000 in production
                        console.log("MessageBroker has skipped", self.skipped, "messages");
                    }
                }
            });
        });
    },

    self.dataSent = function(bytes) {
        self.sentTotal += bytes;
        //self.sent.push({timestamp: new Date().getTime(), bytes: bytes});
    },

    self.dataReceived = function(bytes) {
        self.receivedTotal += bytes;
        //self.sent.push({timestamp: new Date().getTime(), bytes: bytes});
    },

    self.calculateThroughput = function() {
        if(0 == self.sentTotal) {
            prevSentData = 0;
            prevRecData = 0;
        }
        if(0 == self.receivedTotal) {
            prevRecData = 0;
        }
        // Calculate average from last elapsed second
        self.avgOutput = ((self.sentTotal - prevSentData)/10000).toFixed(2);
        self.avgInput = ((self.receivedTotal - prevRecData)/10000).toFixed(2);
        console.log("Output:", self.avgOutput, "KiB, Input:", self.avgInput, "KiB");
        self.avgThroughPut = self.avgOutput+self.avgInput;
        prevSentData = self.sentTotal;
        prevRecData = self.receivedTotal;
    },

    self.receive = function(from, data) {
        //console.log("MessageBroker.receive", data);
        // Käytä JSON.parse-funktiota vastaanotetun datan parsimiseen
        if(self.messageHandler) {
            self.messageHandler.receive(from, data);
        }
        else {
            console.log("MessageBroker: MessageHandler is not attached");
        }
    },

    self.send = function(to, msg) {
        //console.log("MessageBroker: send to", to + ":", msg);
        if (undefined !== to && null != to) {
            var open = require('ws').OPEN;
            var lcto = to.toLowerCase();
            if (undefined !== self.clients[lcto]) {
                if (self.clients[lcto].readyState == open) {
                    var stringified = JSON.stringify(msg);
                    self.dataSent(stringified.length);
                    self.clients[lcto].send(stringified);
                }
            }
        }
    },

    self.broadcast = function(msg) {
        //console.log("broadcast msg:", msg.name);
        var totaldata = 0;
        for(var key in self.clients) {
            var open = require('ws').OPEN;
            if (self.clients[key].readyState == open) {
                var stringified = JSON.stringify(msg);
                totaldata += stringified.length;
                self.clients[key].send(stringified);
            }
        }
        self.dataSent(totaldata);

    },

    self.connectClient = function(websocket, username) {
        if (typeof username === 'string') {
            console.log("MessageBroker: connected client", username);
            // Add username to websocket
            websocket.username = username;
            // Create new entry with lower case username
            self.clients[username.toLowerCase()] = websocket;
            self.authenticated++;
            //code
        }
        else {
            console.log("MessageBroker: fatal error in connectClient - username is not 'string'", username);
        }
    },

    self.disconnectClient = function(username) {
        if (typeof username === 'string') {
            console.log("MessageBroker: disconnect client:", username);
            // Add username to websocket
            delete self.clients[username.toLowerCase()];
            self.authenticated--;
            self.connected--;
        }
        else {
            console.log("MessageBroker: fatal error in disconnectClient - username is not 'string'", username);
        }

    },

    self.isConnected = function(username) {
        if (undefined === self.clients[username.toLowerCase()]) {
            return false;
        }
        return true;
    }

    self.attachHandler = function(handler) {
        self.messageHandler = handler;
        console.log("MessageBroker: MessageHandler attached");
    }

    self.init();
}

module.exports = MessageBroker;