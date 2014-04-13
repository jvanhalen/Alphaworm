
var proton = new Proton;
var renderer;

var Worm = function() { 

    this.name = "wormee";
    this.color = "blue";
    this.startingLength = 5;
    this.location = [];
    this.direction = "right";
    this.velocity = 1;
    this.score = 0;

    // init worm
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

var Food = function() {
    this.color = "white";
    this.growth = Math.floor(Math.random()*1+1); 
}

var GameArea = function() {

    this.height = 30;
    this.width = 30;

    this.color = "lightblue";
}

var Game = function (messagehandler) {
    var self = this;

    self.name = null;
    self.messageHandler = messagehandler;
    self.inGame = false;
    self.score = 0;
    self.music = null;
    self.preferredVolume = 0.1;
    self.maxVolume = 1.0;


    self.word = undefined;
     // setup particle emitter
    self.proton = proton;
    var divelem = document.getElementById("particles");
    renderer = new Proton.Renderer('dom', proton, divelem);
    renderer.start();

    self.puff = function( x, y )
    {    
        
        var emitter = new Proton.Emitter();
        emitter.rate = new Proton.Rate(new Proton.Span(18, 12), new Proton.Span(.1, .2));
        emitter.addInitialize(new Proton.Mass(1));
        emitter.addInitialize(new Proton.Radius(1, 12));
        emitter.addInitialize(new Proton.Life(1, 2));
        emitter.addInitialize(new Proton.V(new Proton.Span(1, 4), new Proton.Span(0, 360), 'polar'));
        emitter.addBehaviour(new Proton.Alpha(1, 0));
        emitter.addBehaviour(new Proton.Scale(1, 0));
        emitter.addBehaviour(new Proton.Color('random'));
        emitter.addBehaviour(new Proton.CrossZone(new Proton.CircleZone(x, y, 250), 'dead'));
	    emitter.addBehaviour(new Proton.Gravity(3));
        //emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
        emitter.p.x = x;
        emitter.p.y = y;

        //add emitter to the proton
        proton.addEmitter(emitter);

        console.log("puffing away at", x, y);
        emitter.emit('once', true);
    },
    
    self.makeGameBoardPieces = function( x, y )
    {    
        
        var emitter = new Proton.Emitter();
        emitter.rate = new Proton.Rate(new Proton.Span(100), new Proton.Span(.1, .2));
	emitter.addInitialize(new Proton.ImageTarget(['media/bgpiece.png'], 20, 20));
        emitter.addInitialize(new Proton.Mass(0.8));

        emitter.addInitialize(new Proton.Life(1, 4));
        emitter.addInitialize(new Proton.V(new Proton.Span(20, 10), new Proton.Span(-45, 45), 'polar'));
	
	emitter.addBehaviour(new Proton.Rotate(new Proton.Span(0, 360), new Proton.Span(-15, 15), 'add'));

	emitter.addBehaviour(new Proton.Alpha(1, 0));
        emitter.addBehaviour(new Proton.Scale(1, 1));
        emitter.addBehaviour(new Proton.Color('random'));
        emitter.addBehaviour(new Proton.CrossZone(new Proton.CircleZone(x, y, window.innerWidth), 'dead'));
	emitter.addBehaviour(new Proton.Gravity(10));
        emitter.addBehaviour(new Proton.RandomDrift(10, 10, .05));
        emitter.p.x = x;
        emitter.p.y = y;

        //add emitter to the proton
        proton.addEmitter(emitter);

        console.log("Crushing board at", x, y);
        emitter.emit('once', true);
    }

    // event handler for food collect
    self.onFoodCollect = function( food ) {
        console.log("Collected letter", food.letter, "at", food.location);
        var cell = document.getElementById(food.location);
        var rect = cell.getBoundingClientRect();
        //console.log(rect.top, rect.right, rect.bottom, rect.left);

        
        var effectDiv = document.createElement("div");
        //effectDiv.appendChild(document.createTextNode(food.letter.toUpperCase()));
	var img = document.createElement('img');
	effectDiv.appendChild(img);
	img.src = './media/collectible.png';
        effectDiv.style["position"]= "absolute";
        effectDiv.style["z-index"]= "3";
        effectDiv.style["top"] = rect.top + "px";
        effectDiv.style["left"] = rect.left + "px";
        effectDiv.id = 'foodEffect';
        
        document.body.appendChild(effectDiv);
        
        
        var tween = new TWEEN.Tween( { s: 1 } )
            .to( { s: 12 }, 1000 )
            .easing( TWEEN.Easing.Back.Out )
            .onUpdate( function () {
                var tmp = document.getElementById("foodEffect");
                tmp.style.transform = "scale("+this.s+")";
                tmp.style["-webkit-transform"] = "scale("+this.s+")";
                tmp.style["-o-transform"] = "scale("+this.s+")";
                tmp.style["-ms-transform"] = "scale("+this.s+")";
                
            });

        var tweenFade = new TWEEN.Tween( { o: 1.0 } )
            .to( { o: 0.0 }, 500 )
            .easing( TWEEN.Easing.Exponential.Out )
            .onUpdate( function () {
                var tmp = document.getElementById("foodEffect");
                tmp.style.opacity = this.o;
                
            })            
            .onComplete( function(){
                var tmp = document.getElementById("foodEffect");
                document.body.removeChild(tmp);
            });

        tween.chain(tweenFade);
        tween.start();


        var x = rect.left;
        var y = rect.top;
        
        self.puff(x,y);

    },
    // event handler for word completion
    self.onWordComplete = function(message){
        var tmp = document.getElementById("completed");
        tmp.innerHTML = message + " completed!";
        tmp.style.opacity = 1.0;
        tmp.style.visibility = 'visible';
        tmp.style.transform = 'scaleX(1)';
        tmp.style["-webkit-transform"] = 'scaleX(1)';
        tmp.style["-o-transform"] = 'scaleX(1)';
        tmp.style["-ms-transform"] = 'scaleX(1)';
        var tween = new TWEEN.Tween( { y: 0 } )
            .to( { y: 400 }, 1000 )
            .easing( TWEEN.Easing.Bounce.Out )
            .onUpdate( function () {
                var tmp = document.getElementById("completed");
                tmp.style.top = this.y + 'px';
                tmp.style.left = (document.body.clientWidth / 2) + 'px';
            } ).start();
        var tweenTmp = new TWEEN.Tween( {} ).to( {}, 1000);
        
        var tween2 = new TWEEN.Tween( { o: 1.0, s: 1.0 } )
            .to( { o: 0.0, s:12 }, 1000 )
            .easing( TWEEN.Easing.Bounce.InOut  )
            .onUpdate( function () {
                var tmp = document.getElementById("completed");
                tmp.style.opacity = this.o;
                tmp.style.transform = 'scaleX('+this.s+')';
		tmp.style["-webkit-transform"] = 'scaleX('+this.s+')';
		tmp.style["-o-transform"] = 'scaleX('+this.s+')';
		tmp.style["-ms-transform"] = 'scaleX('+this.s+')';
                tmp.style.left = (document.body.clientWidth / 2) + 'px';
                if ( this.s >= 12 ) {
                    tmp.style.visibility = 'hidden';
                }
            } );
        tween.chain(tweenTmp);
        tweenTmp.chain(tween2);

    }
      // palauttaa tiedon mik‰ osa worm-spritest‰ 
    // piirret‰‰n mihinkin ruutuun.
    self.getWormTileByPosition = function ( positions, i ) {


	var worm = {
	    tail : {
		up : { rect: 'rect(41px,80px,60px,61px)', top:'-40px', left: '-60px' },
    		down: { rect: 'rect(41px,60px,60px,41px)', top:'-40px', left: '-40px' },
    		right: { rect: 'rect(61px,60px,80px,41px)', top:'-60px', left: '-40px' },
    		left:  { rect: 'rect(61px,80px,80px,61px)', top:'-60px', left: '-60px' }
	    },
	    head : {
		down : {rect: 'rect(61px,40px,80px,21px)', top:'-60px', left:'-20px' },
		up: { rect: 'rect(61px,20px,80px,1px)', top: '-60px', left: '0px' },
		right: { rect: 'rect(41px, 20px,60px,1px )', top: '-40px', left: '0px' },
		left: { rect: 'rect(41px, 40px , 60px, 21px )', top:'-40px', left: '-20px' }
	    },
	    body : {
		horizontal: { rect: 'rect(1px,20px,20px,1px)', top:'0px', left:'0px' },
		vertical: { rect: 'rect(1px,40px,20px,21px)', top:'0px', left:'-20px' },
		up_right: { rect: 'rect(21px,80px,40px,61px)', top:'-20px', left:'-60px'},
		up_left: { rect: 'rect(21px,60px,40px,41px)', top:'-20px', left:'-40px' },
		down_right: { rect: 'rect(21px,20px,40px,1px)', top:'-20px', left:'0px' },
		down_left: { rect: 'rect(21px,40px,40px,21px)', top:'-20px', left:'-20px' }
	    }
	}

        if ( self.gameArea === undefined) return worm.body.horizontal;
        
        // Locations are expected to be ordered from tail to head.

        var current = { x:0,y:0 }
        var next = { x:0,y:0 }
        var prev = { x:0, y:0 }

        current.y = Math.floor(positions[i] / self.gameArea.width); 
        current.x = positions[i] % self.gameArea.width;
        
        if ( i == 0 ){ // tail
            // next body part
            next.y = Math.floor(positions[i+1] / self.gameArea.width); 
            next.x = positions[i+1] % self.gameArea.width;

            if ( next.x == current.x ) 
            {
                if ( current.y < next.y )

		{
		    if ( next.y - current.y > 1 ) return worm.tail.up;
                    else			  return worm.tail.down;
		}
                else 
		{
		    if ( current.y - next.y > 1 ) return worm.tail.down;
                    else		          return worm.tail.up;
		}
            }
            else if ( next.y == current.y ) 
            { 
                if ( current.x < next.x ) 
		{
		    if (next.x - current.x > 1) return worm.tail.left;
                    else			return worm.tail.right;
                }
		else
		{
		    if ( current.x - next.x > 1 ) return worm.tail.right;
                    else			  return worm.tail.left;
		}

            }
        } 
        else if ( i == positions.length-1) // head
        {
            // compute previous
            prev.y = Math.floor(positions[i-1] / self.gameArea.width); 
            prev.x = positions[i-1] % self.gameArea.width;
            if ( prev.x == current.x ) 
            {
                if ( prev.y < current.y ) 
		{
                    if (  current.y - prev.y > 1 ) return worm.head.up;
		    else			   return worm.head.down;
                }
		else
		{
		    if (  prev.y - current.y > 1 ) return worm.head.down;
		    else			   return worm.head.up;
		}

            }
            else if ( prev.y == current.y ) 
            {
                if ( prev.x < current.x ) 

		{
		    if ( current.x - prev.x > 1 ) return worm.head.left;
		    else		          return worm.head.right;
		}
                else
		{
		    if ( prev.x - current.x > 1 ) return worm.head.right;
                    else		          return worm.head.left;
		}

            }
        }
        else  // regular body
        {
            // compute previous and next part 
            prev.y = Math.floor(positions[i-1] / self.gameArea.width); 
            prev.x = positions[i-1] % self.gameArea.width;
            next.y = Math.floor(positions[i+1] / self.gameArea.width); 
            next.x = positions[i+1] % self.gameArea.width;
            // go straight	  A
            //                    |
            //                    v

            if ( prev.y == next.y ) return worm.body.vertical;
            // go straight
            //
            // <--->
            if ( prev.x == next.x ) return worm.body.horizontal;
            


            // --->  Going right or left with border crossing
            if ( prev.x < current.x  ) {

		if ( current.x - prev.x > 1 ) 
		{
		    if ( current.y < next.y)  
		    {
			if ( next.y - current.y > 1 ) return worm.body.up_right;
			else			      return worm.body.down_right;
		    }
		    
                    if ( current.y > next.y) 
		    {
			if ( current.y - next.y > 1 ) return worm.body.down_right;
			else		              return worm.body.up_right;
		    }
		}
		else {
                    // k‰‰nnyt‰‰n alas
                    // ---+
                    //    |
                    //    V
		    
                    if ( current.y < next.y) 
		    {
			if ( next.y - current.y > 1 ) return worm.body.up_left;
			else			  return worm.body.down_left;
		    }
                    // k‰‰nnyt‰‰n ylˆs
                    //    A
                    //    |
                    // ---+
                    if ( current.y > next.y) 
		    {
			if ( current.y - next.y > 1 ) return worm.body.down_left;
			else		          return worm.body.up_left;
		    }
		}
            }
            // <--- Going left or right with border crossing
            else if ( prev.x > current.x  ) 
	    {
                
		if ( prev.x - current.x > 1 )
		{
		    if ( current.y < next.y) 
		    {
			if ( next.y - current.y > 1 ) return worm.body.up_left;
			else			      return worm.body.down_left;
                    }

                    if ( current.y > next.y) 
		    {
			if ( current.y - next.y > 1 ) return worm.body.down_left;
			else			      return worm.body.up_left;
		    }
		}
		else 
		{

                    if ( current.y < next.y) 
		    {
			if ( next.y - current.y > 1 ) return worm.body.up_right;
			else			      return worm.body.down_right;
                    }
                    
                    if ( current.y > next.y) 
		    {
			if ( current.y - next.y > 1 ) return worm.body.down_right;
			else			  return worm.body.up_right;
		    }
		}
            } 

            //   V going down or up with border crossing
            else if ( prev.y < current.y ) {


		if ( current.y - prev.y > 1 )
		{

                    if ( current.x < next.x) 
		    {
			if ( next.x - current.x > 1 ) return worm.body.down_left;
			else			  return worm.body.down_right;
		    }
                    // k‰‰nnyt‰‰n vasemmalle
                    //   |
                    // <-+
                    if ( current.x > next.x) 
		    {
			if ( current.x - next.x > 1 ) return worm.body.down_right;
			else			  return worm.body.down_left;
		    }
		}
		else
		{
                    // k‰‰nnyt‰‰n oikealle
                    //   | 
                    //   +-->                
                    if ( current.x < next.x) 
		    {
			if ( next.x - current.x > 1 ) return worm.body.up_left;
			else			  return worm.body.up_right;
		    }
                    // k‰‰nnyt‰‰n vasemmalle
                    //   |
                    // <-+
                    if ( current.x > next.x) 
		    {
			if ( current.x - next.x > 1 ) return worm.body.up_right;
			else			  return worm.body.up_left;
		    }
		}
            } 
            //   A
            //   | going up or down with border crossing.
            else if ( prev.y > current.y ) {


		if ( prev.y - current.y > 1 )
		{
		    if ( current.x < next.x) 
		    {
			if ( next.x - current.x > 1 ) return worm.body.up_left;
			else			      return worm.body.up_right;
		    }
                    // k‰‰nnyt‰‰n vasemmalle
                    // <-+
                    //   |
                    if ( current.x > next.x) 
		    {
			if ( current.x - next.x > 1  ) return worm.body.up_right;
			else		               return worm.body.up_left;
		    }
		}
		else {
                    // k‰‰nnyt‰‰n oikealle
                    //   +-->
                    //   | 
                    if ( current.x < next.x) 
		    {
			if ( next.x - current.x > 1 ) return worm.body.down_left;
			else			      return worm.body.down_right;
		    }
                    // k‰‰nnyt‰‰n vasemmalle
                    // <-+
                    //   |
                    if ( current.x > next.x) 
		    {
			if ( current.x - next.x > 1  ) return worm.body.down_right;
			else		               return worm.body.down_left;
		    }
		}

            }
            
        }
        // default, should not be here.
        console.log("ERROR: should not reach here! getWormTileByPosition");
        return worm.body.horizontal;
    }
    self.initBoardEffect = function() {
	var drop = new TWEEN.Tween( { s: 0.0 } )
	    .to( { s : 1.0 }, 1000)
	    .easing( TWEEN.Easing.Bounce.Out )
	    .onStart( function(){
		var tmp = document.getElementById('gameboard');
		tmp.style.top = "0px";
	    })
	    .onUpdate( function(){
		console.log('updating.....');
		for(var id = 0; id < self.gameArea.height*self.gameArea.width; id++){
		    var tmp = document.getElementById(id);
		    tmp.style["transform"] = "scale("+this.s+")";			
		    tmp.style["-webkit-transform"] = "scale("+this.s+")";			
		    tmp.style["-ms-transform"] = "scale("+this.s+")";			
		    tmp.style["-o-transform"] = "scale("+this.s+")";			
		}
			
	    }).start();



    }
    // earthquake occurs when worm hits itself or game ends.
    self.killBoardEffect = function() {


        var wiggle = new TWEEN.Tween( { s: 20.0 } )
            .to( { s:0.0 }, 1750 )
            .easing( TWEEN.Easing.Bounce.InOut )
            .onUpdate( function () {
                var tmp = document.getElementById("gameboard");
                tmp.style["top"] = this.s*Math.random() + "px";
                tmp.style["left"] = this.s*Math.random() +"px";
            }).start();
	var drop = new TWEEN.Tween( { y: 0.0 } )
	    .to( { y : window.innerHeight}, 750)
	    .easing( TWEEN.Easing.Exponential.In )
	    .onUpdate( function(){
                var tmp = document.getElementById("gameboard");
                tmp.style["top"] = this.y+"px";

	    })
	    .onComplete( function(){
		self.makeGameBoardPieces( window.innerWidth/2, window.innerHeight*1.25);
		self.displayEndStats();
	    })
	wiggle.chain(drop);
	
	
    },
    self.wiggleWorm = function( worm ){
	var tween = new TWEEN.Tween( { s: 4.0, w : worm })
	    .to ( { s: 0.0 }, 1750)
	    .easing( TWEEN.Easing.Bounce.Out)
	    .onUpdate( function(){
		for( var i = 0;i < this.w.length; i++) {
		    var tmp = document.getElementById(this.w.location[i]);
		    tmp.style["top"] = this.s*Math.random() + "px";
		    tmp.style["left"] = this.s*Math.random() + "px";
		}
	    })
	    .onComplete( function(){
		for( var i = 0;i < this.w.length; i++) {
		    var tmp = document.getElementById(this.w.location[i]);
		    tmp.style["top"] = "0px";
		    tmp.style["left"] = "0px";
		}
	    }).start();
    
    },

    self.displayEndStats = function( collected ) {
	// reset scaling for next round
	document.getElementById('gameoverstats').style["-webkit-transform"] = "scale(1)";
	document.getElementById('gameoverstats').style["transform"] = "scale(1)";
	document.getElementById('gameoverstats').style["-o-transform"] = "scale(1)";
	document.getElementById('gameoverstats').style["-ms-transform"] = "scale(1)";

	
	// hide stars
	for(var i = 1;i<4;i++){
	    var name = "star"+i;
	    document.getElementById(name).style["-webkit-transform"] = "scale(0)";
	    document.getElementById(name).style["transform"] = "scale(0)";
	    document.getElementById(name).style["-o-transform"] = "scale(0)";
	    document.getElementById(name).style["-ms-transform"] = "scale(0)";
	}
	function createStarTween(which){

	    var starTween = new TWEEN.Tween( { s: 0, id:which})
		.to ( { s: 1.0 }, 550)
		.easing( TWEEN.Easing.Elastic.Out)
		.onUpdate( function(){
		    var name = 'star'+this.id;
		    document.getElementById(name).style["-webkit-transform"] = "scale("+this.s+")";
		    document.getElementById(name).style["transform"] = "scale("+this.s+")";
		    document.getElementById(name).style["-o-transform"] = "scale("+this.s+")";
		    document.getElementById(name).style["-ms-transform"] = "scale("+this.s+")";
		    
		})
		.onComplete(function(){
		    if ( this.id < 3 ) {
			createStarTween(this.id+1).start();
		    } else {
			var tmp = new TWEEN.Tween( { s: 1.0})
			    .to ( { s: 0.0 }, 550)
			    .easing( TWEEN.Easing.Elastic.InOut)
			    .onUpdate( function(){
				var name = 'gameoverstats';
				document.getElementById(name).style["-webkit-transform"] = "scale("+this.s+")";
				document.getElementById(name).style["transform"] = "scale("+this.s+")";
				document.getElementById(name).style["-o-transform"] = "scale("+this.s+")";
				document.getElementById(name).style["-ms-transform"] = "scale("+this.s+")";
				
			    })
			    .onComplete(function(){
				document.getElementById(name).style.top = '-600px';
			    })
			    .start();
		    }
		});
	    return starTween;
	}

	var countTween = new TWEEN.Tween( { count: 0 })
	    .to ( { count: 75 }, 2000)
	    .easing( TWEEN.Easing.Quintic.Out)
	    .onUpdate( function(){
		
		var tmp = document.getElementById("numcollected");
		tmp.innerHTML = Math.floor(this.count);
		
	    });
	    
	
	

	var displayTween = new TWEEN.Tween( { y: -600 })
	    .to ( { y: 0.0 }, 750)
	    .easing( TWEEN.Easing.Bounce.Out)
	    .onUpdate( function(){
		
		var tmp = document.getElementById("gameoverstats");
		tmp.style["top"] = this.y + "px";
		tmp.style["left"] = window.innerWidth/2-200 + "px";
		
	    });
	countTween.chain(createStarTween(1));
	displayTween.chain(countTween);
	displayTween.start();
    },
    
    self.onGameStart = function() {

        self.initGame();	
	self.initBoardEffect();
        self.playMusic(self.preferredVolume);
    },

    self.onGameEnd = function( worms ) {
        //self.kaynnissa = false;
        //self.stopMusic();
	self.killBoardEffect();
	console.log(worms.length);
	for( var i = 0; i < worms.length; i++) {
	    self.wiggleWorm(worms[i]);
	}
	// prevent false word completions
	self.word = undefined;
	// prevent false letter collects
        self.foods = [];
    },

    self.init = function() {
        console.log("Called game.init()");

        self.initGame(null);
    },

    self.initGame = function(msg) {
        console.log("initGame:", msg);

        if (null == msg) {
            console.log("create empty gameboard");
            self.gameArea = new GameArea();
        }
        else {
            self.worm = new Worm();
            self.gameArea = new GameArea();
            self.amountOfFood = 8;
            self.foods = [];
            self.food = new Food();
        }

        self.initGameboard();
        self.score = 0;
	// for detecting letter collisions properly.
        self.foods = [];
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
	if ( self.music !== undefined ){
	    self.music.pause();
            delete self.music;
	}
    }

    self.initGameboard = function() {
        console.log("initGameboard");

        document.getElementById('gameboard').innerHTML = "";
        var gameboard = '<p id="score"></p>';
        // Create grid
        gameboard += '<table id="gamegrid">';
        for(var i=0; i<self.gameArea.height; i++) {
            gameboard += '<tr>'; // New row
            for(var j=0; j<self.gameArea.width; j++) {
                var id = (j+(i*self.gameArea.height));
                var grid = 
		    '<td><div class="cell"><img class="wormimage" id="' + id + '" src="./media/worm.png"></div></td>';
                gameboard += grid;
            }
            gameboard += '</tr>';
        }
        gameboard += '</table>';
        gameboard += "W = up, A = left, S = down, D = right";
        gameboard += "&nbsp;&nbsp;&nbsp;";
        gameboard += '<input id="start_game" type="submit" value="StartGame" onclick="messageHandler.game.startGame()">';
        
        document.getElementById('gameboard').innerHTML = gameboard;

        self.updateGameboard();
	// first time we are very small
        for(var i=0; i<self.gameArea.height*self.gameArea.width; i++) {
	    document.getElementById(i).style["-webkit-transform"] = "scale(0)";
	    document.getElementById(i).style["transform"] = "scale(0)";
	    document.getElementById(i).style["-o-transform"] = "scale(0)";
	    document.getElementById(i).style["-ms-transform"] = "scale(0)";
	}
    },

    self.updateGameboard = function() {
        //console.log("updateGameboard");
        for(var i=0; i<self.gameArea.height; i++) {
            for(var j=0; j<self.gameArea.width; j++) {
                var id = (j+(i*self.gameArea.height));

		document.getElementById(id).style["visibility"] = "hidden";
            }
        }
    },

    self.setFood = function() {
        // Check if any food is missing
        // Set foods to random positions
        while(this.foods.length < this.amountOfFood) {
            // A long worm may cause problems when an empty slot is selected
            // TODO: better algorithm for finding empty slot for food
            var x = Math.floor(Math.random()*this.gameArea.height*this.gameArea.width);
            if (document.getElementById(x).bgColor == this.gameArea.color) {
                this.foods.push(x);
                document.getElementById(x).bgColor = this.food.color;
            }
        }
    },

    self.removeFood = function(cell) {
        //console.log("Remove food", cell);
        for (var x=0; x<self.foods.length; x++) {
            if (self.foods[x] == cell) {
                self.foods.splice(x, 1);
            }
        }
        // Generate new food
        self.setFood();

    },

    self.updateMatch = function(msg) {
        //console.log("update match");

        self.updateGameboard();

        // Render worms
        for (var id=0; id<msg.worms.length; id++) {
            for (var x=0; x<msg.worms[id].location.length; x++) {

		var cell = document.getElementById(msg.worms[id].location[x]); 
		cell.src = './media/worm.png';
		var clipping = self.getWormTileByPosition(msg.worms[id].location, x);

		cell.style["visibility"] = "visible";
		cell.style["clip"] = clipping.rect;
		cell.style["top"] = clipping.top;
		cell.style["left"] = clipping.left;
		//background: color position size repeat origin clip attachment image;
                //document.getElementById(msg.worms[id].location[x]).bgColor = msg.worms[id].color;
            }
        }
	 // once there will be our copy of food, we can compare.
        if ( self.foods.length > 0 ){

            for (var x=0; x<msg.food.length; x++) {
                if ( self.foods[x].location != msg.food[x].location )
                {
                    self.onFoodCollect( self.foods[x] );
                    break;
                }
            }
        }
        // duplicate food. 
        self.foods = JSON.parse(JSON.stringify(msg.food));
        // Render foods
        for (var x=0; x<msg.food.length; x++) {

	    var cell = document.getElementById(msg.food[x].location);
	    /*cell.src = './media/collectible.png';
            cell.style["clip"] = 'auto';*/
	    cell.style["visibility"] = "visible"
            // Iteration 5 onwards - the alphabets
            cell.innerHTML = msg.food[x].character.toUpperCase();
	}
	// Logic for detecting word completion
        if ( self.word == undefined ){ self.word = msg.word; }
        else if ( msg.word.finnish != self.word.finnish ) {

            //console.log('Word change', self.word.finnish, "->", msg.word.finnish);
            //self.onWordComplete(self.word.english.toUpperCase());
            self.word = msg.word;
        }
	var from = msg.word['from'];
        var answer = msg.word['answer'];

        document.getElementById("score").innerHTML = "<strong>" + from.toUpperCase() + " = " + answer.toUpperCase() + "</strong><br />";





        // Print the word that needs a translation (the translation is there too, don't cheat! :)


        for (var x=0; x<msg.worms.length; x++) {
            // A little trick to play audio when score is increased
            if (msg.worms[x].name == self.name && self.score < msg.worms[x].score) {
                var audio = document.getElementById('pick_audio');
                audio.volume = self.maxVolume;
                audio.play();
                audio.volume = self.preferredVolume;
                self.score = msg.worms[x].score;
            }
            var separator = (x+1 != msg.worms.length) ? "&nbsp;&nbsp|&nbsp;&nbsp;" : "";
            document.getElementById("score").innerHTML += '<strong><font style="color: ' + msg.worms[x].color + ';">' + msg.worms[x].name +'</font></strong>';
            document.getElementById("score").innerHTML += ":&nbsp;" + msg.worms[x].score + separator;

        }
        if (msg.phase == "INIT") {
            console.log("Match INIT");
            self.initGame(msg);
            self.playMusic(self.preferredVolume);
            self.inGame = true;
	    self.onGameStart();
        }
        if (msg.phase == "END") {
            console.log("Match END");
            self.stopMusic();
            self.endGame();
	    self.onGameEnd( msg.worms );
        }
    },

    self.startGame = function() {
        console.log("Game: startGame");
            var msg = messages.message.START_SINGLEPLAYER_GAME_REQ.new();
            msg.username = self.messageHandler.getUsername();
            self.messageHandler.send(msg);
    },

    self.handleInput = function(event) {
        if(false == self.isRunning()) {
            console.log("handleInput: not in game");
            return false;
        }

        var direction = null;
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
                //console.log("W");
                direction = 'up';
                break;

            default:
                console.log(input);
                break;
        }

        //console.log("Game.handleInput", direction);
        
        if (direction != null) {
            var msg = messages.message.USER_INPUT.new();
            msg.direction = direction;
            msg.username = self.messageHandler.getUsername();
            self.messageHandler.send(msg);
        }

    },
    
    self.endGame = function() {
        self.inGame = false;
        self.stopMusic();
	
    },

    self.isRunning = function() {
        return self.inGame;
    }

    self.init();
}

// for tweening library to work.
animate();
function animate() {

    requestAnimationFrame( animate ); // js/RequestAnimationFrame.js needs to be included too.
    TWEEN.update();
    proton.update();
}
