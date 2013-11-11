var messages = require('../common/messages');
var game = require('./game');

var MessageHandler = function() {

    var self = this;
    self.databaseProxy = undefined;
    self.messageBroker = undefined;
    self.gameServer = undefined;

    self.receive = function(from, msg) {

        switch (msg.name) {
            case 'CHAT_SYNC':
                var resp = messages.message.CHAT_SYNC.new();
                resp.username = msg.username;
                resp.text = msg.text;
                self.broadcast(resp);
                break;

            case 'PONG':
                console.log("received pong");
                break;

            case 'QUEUE_MATCH':
                console.log("QUEUE_MATCH from user:", msg.username);
                self.gameServer.queueMatch(from, msg);
                break;

            case 'USER_INPUT':
                self.gameServer.userData(from, msg);
                break;

            case 'DISCONNECT_REQ':
                console.log("MessageHandler: DISCONNECT_REQ from", msg.username);
                // Notify GameServer
                self.gameServer.userData(from, msg);
                // Send update to clients
                self.removeFromPlayerList(msg.username);
                self.sendSystemMessage(msg.username + " disconnected.");
                break;

            case 'CHALLENGE_REQ':
                self.gameServer.handleChallengeRequest(from, msg);
                break;


            case 'CHALLENGE_RESP':
                self.gameServer.handleChallengeResponse(from, msg);
                break;

            default:
                console.log("Default branch reached: ", msg);
                break;
        }
    },

    self.authenticate = function(from, msg) {

        switch (msg.name) {
            case 'AUTH_REQ':
                self.databaseProxy.getLogin(from, msg);
            break;

            case 'REG_REQ':
                //console.log("client requested registration:", msg.username, msg.passwordhash);
                self.databaseProxy.newUserAccount(from, msg);
                break;

            default:
                console.log("MessageHandler: default branch reached in authentication");
                break;
        }
    },

    self.sendSystemMessage = function(text) {
        var resp = messages.message.CHAT_SYNC.new();
        resp.username = "System notice";
        resp.text = text;
        self.broadcast(resp);
    },

    self.broadcast = function(msg) {
        if (self.messageBroker) {
            self.messageBroker.broadcast(msg);
        }
    },

    self.send = function(to, msg) {
        if (self.messageBroker) {
            self.messageBroker.send(to, msg);
        }
    },

    self.attachBroker = function(msgBroker) {
        self.messageBroker = msgBroker;
        console.log("MessageHandler: MessageBroker attached");
    },

    self.attachGameServer = function(gameServer) {
        self.gameServer = gameServer;
    },

    self.attachDatabaseProxy = function(dbproxy) {
        self.databaseProxy = dbproxy;
    },

    self.connectClient = function(websocket, username) {
        //console.log("MessageHandler.connectClient:", username)
        self.messageBroker.connectClient(websocket, username);

        // Send full playerlist to the authenticated user
        setTimeout(self.sendFullPlayerList(websocket, username));

        // Send updates to other authenticated users
        self.addToPlayerList(username);
        self.sendSystemMessage(username + " connected.");
    },

    self.sendFullPlayerList = function(websocket, username) {
        console.log("sending full player list to", username);
        // Send full player list to new players and
        // update to already connected clients (containing only the previously connected user)
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "full";

        for(var item in self.messageBroker.clients) {
            var user = self.messageBroker.clients[item].username;
            if(null != user) {

                var player = {username: user,
                              authenticated: self.messageBroker.isConnected(user),
                              ingame: self.gameServer.isIngame(user),
                              rank: 0}

                msg.players.push(player);
            }
        }
        websocket.send(JSON.stringify(msg));
        
        // Send ranking list to connected player
        self.databaseProxy.sendRankings(websocket, username);
    },

    self.removeFromPlayerList = function(username) {
        console.log("sending player list update 'remove'");
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "update";

        var player = {username: username,
                      authenticated: self.messageBroker.isConnected(username),
                      ingame: self.gameServer.isIngame(username),
                      rank: 0}

        msg.players.push(player);
        self.broadcast(msg);
    },

    self.addToPlayerList = function(username) {
        console.log("sending player list update 'add'");
        var msg = messages.message.PLAYER_LIST.new();
        msg.type = "update";

        var ingame = self.gameServer.isIngame(username);

        var player = {username: username,
                      authenticated: self.messageBroker.isConnected(username),
                      ingame: ingame,
                      rank: 0}

        msg.players[0] = player;
        self.broadcast(msg);
    }
}

module.exports = MessageHandler;