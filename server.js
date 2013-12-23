#!/bin/env node

var MessageBroker = require('./server/messagebroker');
var MessageHandler = require('./server/messagehandler');
var DatabaseProxy = require('./server/databaseproxy');
var GameServer = require('./server/game');
var messages = require('./common/messages');
var os = require('os'); // For system load avg
var fs = require('fs');

var Server = function() {

    //  Määrittele scope
    var self = this;

    self.pingTmo = 1000;
    self.pingTimer = null;
    self.heartBeatTmo = 1000;
    self.heartBeatTimer = null;

    self.setupVariables = function() {
        //  Set the environment variables we need for OpenShift app
        self.ipaddress = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
        self.port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;

        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };

    self.init = function() {

        console.log("Server: initializing...");

        var http = require('http'),
            express = require('express');
        self.app = express();

        // Pass the websocket information to the client
        self.app.use('/websocketURI.js', function(req, res) {
            var port = 8000;
            // Modify the URI only if we pass an optional connection port in.
            var websocketURI = self.port ? ':' + self.port + '/' : '/';
            res.set('Content-Type', 'text/javascript');
            res.send('var websocketURI="' + websocketURI + '";');
        });

        // Enable some directories for client
        self.app.use('/client', express.static(__dirname + '/client'));
        self.app.use('/common', express.static(__dirname + '/common'));
        self.app.use('/media', express.static(__dirname + '/media'));

        // Palauta index.html selaimille
        self.app.get('/', function(req, res) {
            console.log("loading index.html");
            res.sendfile('index.html');
        });

        self.app.get('/graph', function(req, res) {
            console.log("loading client/system_graphs.html");
            res.sendfile('client/system_graphs.html');
        });

        self.serverapp = http.createServer(self.app);
        self.serverapp.listen(self.port, self.ipaddress);
        console.log("server running @ ", self.ipaddress, ":", self.port);

        // Luo palvelinoliot
        self.messageBroker = new MessageBroker(self);
        self.messageHandler = new MessageHandler();
        self.databaseProxy = new DatabaseProxy();
        self.gameServer = new GameServer(self.messageHandler);

        // Kytke oliot toisiinsa (molempiin suuntiin):
        // MessageBroker -> MessageHandler -> DatabaseProxy
        self.messageBroker.attachHandler(self.messageHandler);
        self.messageHandler.attachDatabaseProxy(self.databaseProxy);

        // DatabaseProxy -> MessageHandler -> MessageBroker
        self.databaseProxy.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);

        console.log("server started");
    },

    self.statistics = function() {
        var msg = messages.message.SERVER_STATS.new();
        msg.systemload = os.loadavg();
        msg.uptime = process.uptime();
        msg.memusage = process.memoryUsage();
        msg.system = os.hostname() + ": " + os.type() + ', ' + os.platform() + ', ' + os.arch();
        msg.connectedusers = self.messageBroker.connected;
        msg.authenticatedusers = self.messageBroker.authenticated,
        msg.totalusers = 0; // TODO: query database
        msg.userlist = [{username: "username",
                         ingame: false}];
        msg.avgoutput = self.messageBroker.avgOutput;
        msg.avginput = self.messageBroker.avgInput;
        var timestamp = new Date().getTime();
        msg.timestamp = timestamp;

        /*console.log("mem: " + (msg.memusage.rss/1000000).toFixed(2) + "/" +
                              (msg.memusage.heapTotal/1000000).toFixed(2) + "/" +
                              (msg.memusage.heapUsed/1000000).toFixed(2) +
                    " cpu: " + msg.systemload[0].toPrecision(2) + "/" +
                              msg.systemload[1].toPrecision(2) + "/" +
                              msg.systemload[2].toPrecision(2) +
                    " users: " + msg.connectedusers + "/" + msg.authenticatedusers + "/" + msg.totalusers + " (c/a/t)");
                    */
        // timestamp,avgOutput,avgInput,avgBandwith,players

        var data = timestamp +","
                   +msg.avgoutput+","
                   +msg.avginput+","
                   +msg.authenticatedusers+"\n";

        //var fs = require('fs');
        //fs.appendFileSync('client/bandwidth.csv', data);

        self.messageHandler.broadcast(msg);
    },

    self.ping = function() {

        var msg = messages.message.PING.new();
        msg.timestamp = new Date().getTime();
        msg.value = Math.floor(Math.random()*9999);

        self.messageHandler.broadcast(msg);
    },

    self.pong = function(msg) {
        console.log("ping response at", new Date().getTime() - msg.timestamp, "ms.");
    },
    
    self.heartBeat = function() {
        var newTick = new Date().getTime();
        if (newTick - self.previousTick > 1050 && newTick - self.previousTick < 950) {
            console.log("heartBeat deviation ("+newTick - self.previousTick+" ms)");
        }

        previousTick = newTick;
    }

    // Poll some statistics
    //self.timer = setInterval(self.statistics, 10000);

    // Ping-pong connected clients
    self.pingTimer = setInterval(self.ping, self.pingTmo);
    self.previousTick = new Date().getTime();
    self.heartBeatTimer = setInterval(self.heartBeat, self.heartBeatTmo);

    // Aseta palvelimen sisäiset muuttujat
    self.setupVariables();

    // Alusta ja käynnistä palvelin luotaessa
    self.init();
}

// Luo palvelininstanssi
var server = new Server("server");
