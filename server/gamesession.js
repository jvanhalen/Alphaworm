var messages = require('../common/messages');

var EventEmitter = require('events').EventEmitter,
    util = require('util');

var worm = function(name, number) {
    var color = ["blue", "green", "orange", "brown", "red", "Black"];
    var self = this;
    self.alive = true; // true / false
    self.name = name;
    self.color = color[number]; // Pick a color for the worm
    self.startingLength = 5;
    self.length = self.startingLength;
    self.location = [];
    self.direction = "right"; // Direction: right, left, up, down
    self.newDirection = "right";
    self.velocity = 1;
    self.score = 0;

    // Initialize worm
    for(var x=0; x<self.startingLength; x++) {
        self.location[x] = x+number*8*40;
    }

    //console.log("worm", name, "location:", self.location);
}

var food = function(location) {
    var self = this;
    self.location = location;
    self.color = "red";
    self.growth = 1; // Growth per food
}

var gameArea = function() {
    var self = this;
    self.cells = {};
    self.height = 40;
    self.width = 40;
    self.color = "lightblue"; // Game area color
}

var GameSession = function(playerList, messageHandler, databaseProxy) {

    var self = this;

    self.tick = 170; // 140-180 seems to be optimal

    self.messageHandler = messageHandler;
    self.databaseProxy = databaseProxy;

    self.timer = 0;
    self.amountOfFood = 12;
    self.gameArea = {};
    self.worms = [];
    self.foods = [];
    self.sessionId = 1;
    self.playerList = playerList;

    self.init = function() {
        console.log("creating new game for", self.playerList.length, "players: ", self.playerList);

        self.gameArea = new gameArea();
        for (var x=0; x<self.playerList.length; x++) {
            self.worms.push(new worm(self.playerList[x], x));
        }
        self.initGameboard();
        self.setWorms();
        self.setFood();

        var msg = messages.message.MATCH_SYNC.new();
        msg.phase = "INIT";
        msg.msgid = 101;

        msg.height = self.gameArea.height;
        msg.width = self.gameArea.width;
        msg.worms = self.worms;
        msg.food = self.foods;

        self.syncPlayers(msg);

        self.timer = setInterval(self.update, self.tick);
    },

    self.initGameboard = function() {
        //console.log("initGameboard");
        for(var i=0; i<self.gameArea.height*self.gameArea.width; i++) {
            self.gameArea.cells[i] = {color: self.gameArea.color};
        }
    },

    self.setWorms = function() {
        // Set worms to initial locations
        for (var i=0; i<self.worms.length; i++) {
            for(var x=0; x<self.worms[i].startingLength; x++) {
                self.gameArea.cells[self.worms[i].location[x]].color = self.worms[i].color;
            }
        }
    },

    self.setFood = function() {
        //console.log("setFood");
        var i = 0;

        while(self.foods.length < self.amountOfFood) {
            var x = Math.floor(Math.random()*self.gameArea.height*self.gameArea.width);

            if (self.gameArea.cells[x].color == self.gameArea.color) {
                var newFood = new food(x);
                self.foods.push(newFood);
                self.gameArea.cells[x].color = newFood.color;
            }
        }
    },

    self.removeFood = function(location) {
        for (var x=0;x<self.foods.length; x++) {
            if (self.foods[x].location == location) {
                self.foods.splice(x, 1);
            }
        }
        self.setFood();
    },

    self.syncPlayers = function(msg) {
        //console.log("Game.syncPlayers", msg);
        for (var x=0; x<self.playerList.length; x++) {
            self.messageHandler.send(self.playerList[x], msg);
        }
    },

    self.userInput = function(username, input) {
        //console.log("GameSession.userInput", username, input);
        // TODO: check user input validity
        // TODO: Route msg to user specific match
        for (var x=0; x<self.worms.length; x++) {
            //console.log("handling worm", x);
            if (self.worms[x].name == username) {
                switch (input) {
                    case "up":
                    case "left":
                    case "down":
                    case "right":
                        self.worms[x].newDirection = input;
                        break;
                    default:
                        console.log("invalid input", input);
                        break;
                }
            }
        }
    },

    self.disconnect = function(username) {
        console.log("GameSession.disconnect", username);
        for (var x=0; x<self.worms.length; x++) {
            if (self.worms[x].name == username) {
                self.worms[x].alive = false;
                break;
            }
        }
        // Update clients
    },

    self.end = function() {
        console.log("GameSession.end");
        clearInterval(self.timer);

        // Update possible highscores
        for(var item in self.worms) {
            var username = self.worms[item].name;
            var score = self.worms[item].score;
            self.databaseProxy.setHighscore(username, score);
        }

        // Indicate end game
        self.emit('end', self.playerList);

    },

    self.update = function() {
        //console.log("update");

        // Check and update worm position
        for (var x=0; x<self.worms.length; x++) {
            var input = 0;
            var change = 0;
        
            if(self.worms[x].alive == true)
            {
                // Check for movement
                switch (self.worms[x].newDirection) {
                    case "up":
                        if (self.worms[x].direction != "down") {
                            self.worms[x].direction = "up";
                        }
                        break;

                    case "left":
                        if (self.worms[x].direction != "right") {
                            self.worms[x].direction = "left";
                        }
                        break;

                    case "down":
                        if (self.worms[x].direction != "up") {
                            self.worms[x].direction = "down";
                        }
                        break;

                    case "right":
                        if (self.worms[x].direction != "left") {
                            self.worms[x].direction = "right";
                        }
                        break;
                    default:
                        console.log("invalid worm direction input:", self.worms[x].direction, "wanted:", self.worms[x].newDirection);
                        break;
                }
                //console.log("handling worm", x);
                switch(self.worms[x].direction) {
                    case "right":
                        change += self.worms[x].velocity;
                        break;
                    case "left":
                        change -= self.worms[x].velocity;
                        break;
                    case "up":
                        change -= (self.gameArea.height)*(self.worms[x].velocity);
                        break;
                    case "down":
                        change += (self.gameArea.height)*(self.worms[x].velocity);
                        break;
                    default:
                        console.log("invalid worm direction:", self.worms[x].direction);
                        break;
                }

                // move worm

                // Store head location and calculate new location
                var length = self.worms[x].location.length;
                var oldHead = self.worms[x].location[length-1];
                var newHead = self.worms[x].location[length-1] + change;

                // Käsittele pelilaudan reunojen ylitykset
                // TODO: switch case
                if (self.worms[x].direction == "right" &&
                    0 == (newHead % self.gameArea.width) &&
                    0 != newHead ) {
                    newHead = oldHead - (self.gameArea.width-1);
                }
                if (self.worms[x].direction == "left" && 0 == (oldHead % (self.gameArea.width))) {
                    newHead = oldHead + (self.gameArea.width-1);
                }
                if (self.worms[x].direction == "up" && oldHead < self.gameArea.width) {
                    newHead = oldHead + (self.gameArea.height * (self.gameArea.width-1));
                }
                if (self.worms[x].direction == "down" && oldHead >= (self.gameArea.width*(self.gameArea.height - 1))) {
                    newHead = oldHead % (self.gameArea.width);
                }

                if (self.gameArea.cells[newHead].color == self.foods[0].color) {
                    //console.log("food hit, increase worm");
                    var score = 1;

                    console.log("+1 score");
                    self.worms[x].score += score;

                    self.gameArea.cells[newHead].color = self.worms[x].color;
                    self.worms[x].location.push(newHead);
                    self.removeFood(newHead);

                }
                else if (self.gameArea.cells[newHead].color != self.gameArea.color || self.worms[x].location.length < 3) {
                    // TODO: end game
                    console.log("end game", self.gameArea.color, "!=", self.gameArea.cells[newHead].color);
                    self.worms[x].alive = false;
                }
                else {
                    // No hit, set new head and cut piece of tail
                    //console.log("no food, move worm");
                    self.worms[x].location.push(newHead);
                    self.gameArea.cells[self.worms[x].location[0]].color = self.gameArea.color;
                    self.gameArea.cells[newHead].color = self.worms[x].color;
                    self.worms[x].location.shift();
                }
            }
        }

        // Update all players in the match
        var msg = messages.message.MATCH_SYNC.new();
        var alive = false;

        for (var item in self.worms) {
            if (self.worms[item].alive == true) {
                alive=true;
                break;
            }
        }
        if (alive) {
            msg.phase = "RUN";
        }
        else {
            msg.phase = "END";
        }
        msg.msgid = 101;

        msg.worms = self.worms;
        msg.food = self.foods;

        self.syncPlayers(msg);
        if (msg.phase == "END") {
            self.end();
        }
        //console.log(self.worms);
    }

    self.init();

}

util.inherits(GameSession, EventEmitter);


module.exports = GameSession;