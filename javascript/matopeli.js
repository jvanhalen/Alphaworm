

var mato = function(){  // Tällä määrittelyllä varaudutaan siihen että lieroja on tulevaisuudessa useampiakin
   this.nimi = "liero";
   this.vari = "blue";
   this.aloitusPituus = 5;
   this.sijainti = [];
   this.suunta = "oikea"; // Menosuunta: oikea, vasen, ylos, alas
   this.nopeus = 1;
   this.pisteet = 0;

   // Alusta mato
   for(var x=0; x<this.aloitusPituus; x++) {
      this.sijainti[x] = x;
   }
}

var ruoka = function(){
   this.vari = "red";
   this.kasvu = Math.floor(Math.random()*1+1); // Paljonko mato kasvaa ruoan napsittuaan, laita esim. +0 --> +1
}

var pelialue = function() {
   this.korkeus = 40;
   this.leveys = 40;
   this.vari = "lightblue";   // Ruudukon väri
}

var peli = {
   ajastin: 0,
   mato: new mato(),
   pelialue: new pelialue(),
   ruoanMaara: 8,
   ruoat: [],
   ruoka: new ruoka(),

   alusta: function() {
      this.mato = new mato();
      this.pelialue = new pelialue();
      this.alustaPelilauta();
      this.asetaRuoat();

      // Huomioi setInterval scope .bind(this)
      peli.ajastin = self.setInterval(peli.paivitaTilanne.bind(this), 150);
   },

   alustaPelilauta: function() {

      document.getElementById('pelilauta').innerHTML = "";
      var pelilauta = '<p id="pistetilanne"></p>';
      // Luo ruudukko
      pelilauta += '<table width="400" height="400">';
      for(var i=0; i<this.pelialue.korkeus; i++) {
         pelilauta += '<tr>'; // Luo uusi rivi
         for(var j=0; j<this.pelialue.leveys; j++) {
            var id = (j+(i*this.pelialue.korkeus));
            var ruutu = '<td id="' + id + '"></td>';
            pelilauta += ruutu;
         }
         pelilauta += '</tr>';
      }
      pelilauta += '</table>';
      pelilauta += '<input id="syote" name="syotekentta" size="1" maxLength="1" />';
      pelilauta += "W = ylos, A = vasemmalle, S = alas, D = oikealle";

      document.getElementById('pelilauta').innerHTML = pelilauta;

      this.varitaPelilauta();
   },

   varitaPelilauta: function() {
      for(var i=0; i<this.pelialue.korkeus; i++) {
         for(var j=0; j<this.pelialue.leveys; j++) {
            var id = (j+(i*this.pelialue.korkeus));
            document.getElementById(id).bgColor = this.pelialue.vari;
         }
      }

      // Aseta liero aloituskohtaan
      for(var x=0;x<this.mato.aloitusPituus;x++) {
         document.getElementById(this.mato.sijainti[x]).bgColor = this.mato.vari;
      }

   },
   asetaRuoat: function() {
      // Tarkista puuttuuko ruokia
      // Aseta ruoat satunnaiseen kohtaan
       while(this.ruoat.length < this.ruoanMaara) {
         // Huomaa että pidempi mato voi hidastaa sopivan ruoan sijoituspaikan arpomista (pitää ehkä arpoa useampi satunnaisluku)
         // Ei haittaa meitä tässä tapauksessa
         var x = Math.floor(Math.random()*this.pelialue.korkeus*this.pelialue.leveys);
         if (document.getElementById(x).bgColor == this.pelialue.vari) {
            this.ruoat.push(x);
            document.getElementById(x).bgColor = this.ruoka.vari;
         }
      }
   },

   poistaRuoka: function(ruutu) {
      //console.log("Poista ruoka", ruutu);
      for (var x=0;x<this.ruoat.length; x++) {
         if (this.ruoat[x] == ruutu) {
            this.ruoat.splice(x, 1);
         }
      }
      // Arvo uusi ruoka
      this.asetaRuoat();

   },

   paivitaTilanne: function() {
      console.log(this);

      // Lue ja käsittele syöte
      document.getElementById("syote").focus();
      var syote = document.getElementById("syote").value;
      var muutos = 0;

      // TODO: parempi näppäinpainallusten kontrolli (nuolinäppäimet, WASD, etc.)
      switch (syote.toLowerCase()) {

         case "w":
            if (this.mato.suunta != "alas") {
               this.mato.suunta = "ylos";
            }
            break;

         case "a":
            if (this.mato.suunta != "oikea") {
               this.mato.suunta = "vasen";
            }
            break;

         case "s":
            if (this.mato.suunta != "ylos") {
               this.mato.suunta = "alas";
            }
            break;

         case "d":
            if (this.mato.suunta != "vasen") {
               this.mato.suunta = "oikea";
            }
            break;
         default:
            break;
      }

      document.getElementById("syote").value = "";

      switch(this.mato.suunta) {
         case "oikea":
            muutos += this.mato.nopeus;
            break;
         case "vasen":
            muutos -= this.mato.nopeus;
            break;
         case "ylos":
            muutos -= (this.pelialue.korkeus)*(this.mato.nopeus);
            break;
         case "alas":
            muutos += (this.pelialue.korkeus)*(this.mato.nopeus);
            break;
         default:
            break;
      }

      // Liikuta matoa

      // Talleta hännän sijainti
      var hanta = this.mato.sijainti[0];

      // Talleta nykyinen pään sijainti ja laske uuden pään sijainti
      var pituus = this.mato.sijainti.length;
      var wanhaPaa = this.mato.sijainti[pituus-1];
      var uusiPaa = this.mato.sijainti[pituus-1] + muutos;

      // Käsittele pelilaudan reunojen ylitykset
      // TODO: switch case
      if (this.mato.suunta == "oikea" &&
         0 == (uusiPaa % this.pelialue.leveys) &&
         0 != uusiPaa ){
         uusiPaa = wanhaPaa - (this.pelialue.leveys-1);
      }
      if (this.mato.suunta == "vasen" && 0 == (wanhaPaa % (this.pelialue.leveys))) {
         uusiPaa = wanhaPaa + (this.pelialue.leveys-1);
      }
      if (this.mato.suunta == "ylos" && wanhaPaa < this.pelialue.leveys) {
         uusiPaa = wanhaPaa + (this.pelialue.korkeus * (this.pelialue.leveys-1));
      }
      if (this.mato.suunta == "alas" && wanhaPaa >= (this.pelialue.leveys*(this.pelialue.korkeus - 1))) {
         uusiPaa = wanhaPaa % (this.pelialue.leveys);
      }

      console.log("suunta", this.mato.suunta, " wanhaPaa:", wanhaPaa, "uusiPaa:", uusiPaa);
      // Tarkista osuimmeko ruokaan
      if (document.getElementById(uusiPaa).bgColor == this.ruoka.vari) {
         // Osuimme, kasvata matoa
         this.mato.sijainti.push(uusiPaa);
         this.poistaRuoka(uusiPaa);

         // Kasvata pistemäärää
         this.mato.pisteet++;
      }
      else if (document.getElementById(uusiPaa).bgColor == this.mato.vari) {
         // TODO: lopeta peli
         clearInterval(this.ajastin);
         alert("Bite me Elmo! Pisteitä " + this.mato.pisteet);
         location.reload();   // Lataa sivu uudemman kerran (ei kovin elegantti tapa)
      }
      else {
         // Emme osuneet, aseta uusi pää ja leikkaa pala hännästä
         this.mato.sijainti.push(uusiPaa);
         this.mato.sijainti.shift();
         // Poista häntä taulukosta
         document.getElementById(hanta).bgColor = this.pelialue.vari;
      }

      //console.log(this.mato.sijainti)
      // Renderöi uusi mato
      for (var x=0;x<this.mato.sijainti.length; x++) {
         document.getElementById(this.mato.sijainti[x]).bgColor = this.mato.vari;
      }

      // Päivitä pistetilanne
      document.getElementById("pistetilanne").innerHTML = "Pisteesi: " + this.mato.pisteet.toString();

      // TODO: Nopeuta matoa kun pituus kasvaa
   }
}