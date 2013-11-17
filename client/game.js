var worm = function() {  // Tällä määrittelyllä varaudutaan siihen että lieroja on tulevaisuudessa useampiakin
    this.name = "liero";
    this.color = "blue";
    this.startingLength = 5;
    this.location = [];
    this.direction = "right"; // Menosuunta: right, left, up, down
    this.velocity = 1;
    this.score = 0;

    // Alusta worm
    for(var x=0; x<this.startingLength; x++) {
        this.location[x] = x;
    }
}

var food = function() {
    this.color = "red";
    this.growth = Math.floor(Math.random()*1+1); // Paljonko worm kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var gameArea = function() {
    this.height = 25;
    this.width = 25;
    this.color = "lightblue";   // Ruudukon väri
}

var Peli = function () {
    var self = this;
    self.name = null;
    self.messageBroker = undefined;
    self.messageHandler = undefined;
    self.kaynnissa = false;
    self.score = 0;
    self.music = null;
    self.preferredVolume = 0.1;
    self.maxVolume = 1.0;

    self.init = function() {

        self.messageBroker = new MessageBroker();
        self.messageHandler = new MessageHandler(self);

        self.messageBroker.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);

    },

    self.initGame = function(uusipeli) {
        console.log("initGame");

        if (null == uusipeli) {
            console.log("luo tyhjä pelilauta");
            self.gameArea = new gameArea();
        }
        else {
            self.worm = new worm();
            self.gameArea = new gameArea();
            self.amountOfFood = 12;
            self.foods = [];
            self.food = new food();
        }

        self.initGameboard();
        self.kaynnissa = true;
        self.score = 0;
    },

    self.playMusic = function(volume) {
        console.log("Game: playMusic");
        if (self.music == null) {
            console.log("Game: creating new audio instance");
            self.music = new Audio('../media/retro.ogg');
            if (typeof self.music.loop == 'boolean')
            {
                self.music.loop = true;
            }
            else
            {
                self.music.addEventListener('ended', function() {
                    self.music.volume = self.preferredVolume;
                    self.music.currentTime = 0;
                    self.music.play();
                }, false);
            }
            self.music.volume = volume;
        }
        self.music.play();
    },

    self.stopMusic = function() {
        console.log("Game: stopMusic");
        self.music.pause();
        delete self.music;
    }

    self.initGameboard = function() {
        console.log("initGameboard");

        document.getElementById('pelilauta').innerHTML = "";
        var pelilauta = '<p id="pistetilanne"></p>';
        // Luo ruudukko
        pelilauta += '<table id="peliruudukko">';
        for(var i=0; i<self.gameArea.height; i++) {
            pelilauta += '<tr>'; // Luo uusi rivi
            for(var j=0; j<self.gameArea.width; j++) {
                var id = (j+(i*self.gameArea.height));
                var ruutu = '<td id="' + id + '">&nbsp;</td>';
                pelilauta += ruutu;
            }
            pelilauta += '</tr>';
        }
        pelilauta += '</table>';
        //pelilauta += '<input id="input" name="syotekentta" size="1" maxLength="1" />';
        pelilauta += "W = up, A = left, S = down, D = right";
        pelilauta += "&nbsp;&nbsp;&nbsp;";
        pelilauta += '<input id="aloitapeli_painike" type="submit" value="AloitaPeli" onclick="game.aloitaPeli()">';

        document.getElementById('pelilauta').innerHTML = pelilauta;

        self.varitaPelilauta();
    },

    self.varitaPelilauta = function() {
        //console.log("varitaPelilauta");
        for(var i=0; i<self.gameArea.height; i++) {
            for(var j=0; j<self.gameArea.width; j++) {
                var id = (j+(i*self.gameArea.height));
                document.getElementById(id).bgColor = self.gameArea.color;
                document.getElementById(id).innerHTML = "&nbsp;";

            }
        }
    },

    self.setFood = function() {
        // Tarkista puuttuuko ruokia
        // Aseta foods satunnaiseen kohtaan
        while(this.foods.length < this.amountOfFood) {
            // Huomaa että pidempi worm voi hidastaa sopivan ruoan sijoituspaikan arpomista (pitää ehkä arpoa useampi satunnaisluku)
            // Ei haittaa meitä tässä tapauksessa
            var x = Math.floor(Math.random()*this.gameArea.height*this.gameArea.width);
            if (document.getElementById(x).bgColor == this.gameArea.color) {
                this.foods.push(x);
                document.getElementById(x).bgColor = this.food.color;
            }
        }
    },

    self.removeFood = function(ruutu) {
        //console.log("Poista food", ruutu);
        for (var x=0; x<self.foods.length; x++) {
            if (self.foods[x] == ruutu) {

                self.foods.splice(x, 1);
            }
        }
        // Arvo uusi food
        self.setFood();

    },

    self.updateMatch = function(msg) {
        //console.log("updateMatch", msg);

        // Puhdista pelilauta
        self.varitaPelilauta();

        // Render worms
        for (var id=0; id<msg.worms.length; id++) {
            for (var x=0; x<msg.worms[id].location.length; x++) {
                document.getElementById(msg.worms[id].location[x]).bgColor = msg.worms[id].color;
            }
        }

        // Render foods
        for (var x=0; x<msg.food.length; x++) {
            document.getElementById(msg.food[x].location).bgColor = msg.food[x].color;
            document.getElementById(msg.food[x].location).innerHTML = "<strong>" + msg.food[x].letter.toUpperCase() + "</strong>";
        }

        // Update score
        var word = "<h2>" + msg.word.finnish.toUpperCase() + " = ";
        for(var k=0; k<msg.word.answer.length; k++) {
            word += msg.word.answer[k].toUpperCase() + "&nbsp;";
        }
        document.getElementById("pistetilanne").innerHTML = word + "</h2>";

        for (var x=0; x<msg.worms.length; x++) {
            // A little trick to play audio when score is increased
            if (msg.worms[x].name == self.name && self.score < msg.worms[x].score) {
                var audio = document.getElementById('pick_audio');
                audio.volume = self.maxVolume;
                audio.play();
                audio.volume = self.preferredVolume;
                self.score=msg.worms[x].score;
            }
            var separator = (x+1 != msg.worms.length) ? "&nbsp;&nbsp|&nbsp;&nbsp;" : "";
            document.getElementById("pistetilanne").innerHTML += '<strong><font color="' + msg.worms[x].color + '">' + msg.worms[x].name +'</font></strong>';
            document.getElementById("pistetilanne").innerHTML += ":&nbsp;" +  msg.worms[x].score + separator;

        }
        if (msg.phase == "INIT") {
            self.initGame();
            self.playMusic(self.preferredVolume);
        }
        if (msg.phase == "END") {
            self.stopMusic();
            self.endGame();
        }
    },

    self.aloitaPeli = function() {
        console.log("Game: aloitaPeli");
            var msg = messages.message.QUEUE_MATCH.new();
            msg.username = self.messageHandler.getUsername();
            self.messageHandler.send(msg);
            self.kaynnissa = true;
    },

    self.kasittelePainallus = function(event) {
        var direction = null;
        // Toimiikohan alla oleva ORaus kaikissa selaimissa?
        var input = event.which | event.keyCode | event.charCode;
        switch (input) {
            case 65:
            case 97:
            case 37:
                //console.log("A");
                direction = 'left';
                break;

            case 68:
            case 100:
            case 39:
                //console.log("D");
                direction = 'right';
                break;

            case 83:
            case 115:
            case 40:
                //console.log("S");
                direction = 'down';
                break;

            case 87:
            case 119:
            case 38:
                //onsole.log("W");
                direction = 'up';
                break;

            default:
                console.log(input);
                break;
        }

        if (direction != null) {
            // Lähetä päivitys palvelimelle
            var msg = messages.message.USER_INPUT.new();
            msg.direction = direction;
            msg.username = self.messageHandler.getUsername();
            self.messageHandler.send(msg);
        }
        return false;
    },

    self.endGame = function() {
        self.kaynnissa = false;
        self.stopMusic();
    },

    self.isRunning = function() {
        return self.kaynnissa;
    },

    self.challenge = function(username) {
        var msg = messages.message.CHALLENGE_REQ.new();
        msg.challenger = self.name;
        msg.challengee = username;

        self.messageHandler.send(msg);
    },

    self.setUsername = function(name) {
        self.name = name;
    },

    self.getUsername = function() {
        return self.name;
    }

    self.init();
}
