var MessageBroker = function() {

    var self = this;
    self.messageHandler = undefined;

    self.init = function() {
        console.log("MessageBroker started");

        // The websocketURI if received from the server
        //self.ws = new WebSocket('ws://lierot-jvanhalen.rhcloud.com:8000');
        console.log("websocketURI = ", websocketURI);
        self.ws = new WebSocket('wss://' + websocketURI + '/');

        self.ws.onmessage = function (event) {
            var msg = JSON.parse(event.data);
            self.messageHandler.receive(msg);
        };

        self.ws.onerror = function (event) {
            console.log("websocket failed");
            self.messageHandler.receive({name: "CHAT_SYNC",
                                         username: "System notice",  // Keneltä viesti tuli (username)
                                         text: "<strong>Connection failed.<strong>"       // Viestin sisältö
            });
        };

        self.ws.onopen = function (event) {
            console.log("websocket connected");
            self.messageHandler.receive({name: "CHAT_SYNC",
                                         username: "System notice",  // Keneltä viesti tuli (username)
                                         text: "<strong>Connection established.</strong>"       // Viestin sisältö
            });
        };

        self.ws.onclose = function (event) {
            console.log("websocket connected");
            self.messageHandler.receive({name: "CHAT_SYNC",
                                         username: "System notice",  // Keneltä viesti tuli (username)
                                         text: "<strong>Connection closed.</strong>"       // Viestin sisältö
            });
        };
    },

    self.send = function(data) {
        //console.log("data:", data);
        self.ws.send(JSON.stringify(data)); // Käytä JSON.stringify serialisoimaan lähetettävä data
    }

    self.attachHandler = function(messageHandler) {
        self.messageHandler = messageHandler;
    },

    // Alusta websocket luonnin yhteydessä
    self.init();
}