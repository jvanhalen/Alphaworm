var worm = function() {  // T√§ll√§ m√§√§rittelyll√§ varaudutaan siihen ett√§ lieroja on tulevaisuudessa useampiakin
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
    

    // worm sprite
    this.sprite = new Image();
    this.sprite.onload = function() {
        console.log('Loaded worm sprite');
    }
    this.sprite.src = './media/worm.png';
    console.log(this.sprite.src);
}

var food = function() {
    this.color = "red";
    this.growth = Math.floor(Math.random()*1+1); // Paljonko worm kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var gameArea = function() {
    this.height = 30;
    this.width = 30;
    this.color = "lightblue";   // Ruudukon v√§ri
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

    // palauttaa tiedon mik‰ osa worm-spritest‰ 
    // piirret‰‰n mihinkin ruutuun.
    self.getWormTileByPosition = function ( positions, i ) {
        if ( self.gameArea === undefined) return '-1px -1px';
        
        // Oletus: sijainnit ovat j‰rjestyksess h‰nn‰st‰ p‰‰h‰n.

        var current = { x:0,y:0 }
        var next = { x:0,y:0 }
        var prev = { x:0, y:0 }

        current.y = Math.floor(positions[i] / self.gameArea.width); 
        current.x = positions[i] % self.gameArea.width;
        
        if ( i == 0 ){
            // tsekkaa seuraava
            next.y = Math.floor(positions[i+1] / self.gameArea.width); 
            next.x = positions[i+1] % self.gameArea.width;
            if ( next.x == current.x ) return '-1px -1px';
            if ( next.y == current.y ) return '-21px -1px';
        } 
        else if ( i == positions.length-1)
        {
            // tsekkaa edelt‰v‰
            prev.y = Math.floor(positions[i-1] / self.gameArea.width); 
            prev.x = positions[i-1] % self.gameArea.width;
            if ( prev.x == current.x ) return '-1px -1px';
            if ( prev.y == current.y ) return '-21px -1px';
        }
        else {
            // tsekkaa edelt‰v‰ ja seuraava
            prev.y = Math.floor(positions[i-1] / self.gameArea.width); 
            prev.x = positions[i-1] % self.gameArea.width;
            next.y = Math.floor(positions[i+1] / self.gameArea.width); 
            next.x = positions[i+1] % self.gameArea.width;
            // menn‰‰n suoraan    A
            //                    |
            //                    v
            if ( prev.y == next.y ) return '-21px -1px';
            // menn‰‰n suoraan    
            //
            // <--->
            if ( prev.x == next.x ) return '-1px -1px';
            
            // ---> 
            if ( prev.x < current.x  ) {
                // k‰‰nnyt‰‰n alas
                // ---+
                //    |
                //    V
                if ( current.y < next.y) return '-21px -21px';
                // k‰‰nnyt‰‰n ylˆs
                //    A
                //    |
                // ---+
                if ( current.y > next.y) return '-41px -21px';
            }
            // <---
            else if ( prev.x > current.x  ) {
                
                // k‰‰nnyt‰‰n alas
                //    +---
                //    |
                //    V
                if ( current.y < next.y) return '-1px -21px';
                
                // k‰‰nnyt‰‰n ylˆs
                //    A
                //    |
                //    +---
                if ( current.y > next.y) return '-61px -21px';
            } 
            //   |
            //   V
            else if ( prev.y < current.y ) {

                // k‰‰nnyt‰‰n oikealle
                //   | 
                //   +-->                
                if ( current.x < next.x) return '-61px -21px';
                // k‰‰nnyt‰‰n vasemmalle
                //   |
                // <-+
                if ( current.x > next.x) return '-41px -21px';
            } 
            //   A
            //   |
            else if ( prev.y > current.y ) {

                // k‰‰nnyt‰‰n oikealle
                //   +-->
                //   | 
                if ( current.x < next.x) return '-1px -21px';
                // k‰‰nnyt‰‰n vasemmalle
                // <-+
                //   |
                if ( current.x > next.x) return '-21px -21px';
            }
            
        }
        // default, should not be here.
        console.log("ERROR: should not reach here! getWormTileByPosition");
        return "-1px -1px";
    }

    self.init = function() {

        self.messageBroker = new MessageBroker();
        self.messageHandler = new MessageHandler(self);

        self.messageBroker.attachHandler(self.messageHandler);
        self.messageHandler.attachBroker(self.messageBroker);
        

    },

    self.initGame = function(uusipeli) {
        console.log("initGame");

        if (null == uusipeli) {
            console.log("luo tyhj√§ pelilauta");
            self.gameArea = new gameArea();
            self.worm = new worm();
        }
        else {
            console.log("Creating worm");
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

                document.getElementById(id).style.background = self.gameArea.color;
                document.getElementById(id).innerHTML = "&nbsp;";

            }
        }
    },

    self.setFood = function() {
        // Tarkista puuttuuko ruokia
        // Aseta foods satunnaiseen kohtaan
        while(this.foods.length < this.amountOfFood) {
            // Huomaa ett√§ pidempi worm voi hidastaa sopivan ruoan sijoituspaikan arpomista (pit√§√§ ehk√§ arpoa useampi satunnaisluku)
            // Ei haittaa meit√§ t√§ss√§ tapauksessa
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

                var cell = document.getElementById(msg.worms[id].location[x]); 
                //background: color position size repeat origin clip attachment image;
                cell.style["background"] = "#000000 url('"+self.worm.sprite.src+"') no-repeat " + 
                                           self.getWormTileByPosition(msg.worms[id].location, x);
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
            // L√§het√§ p√§ivitys palvelimelle
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
