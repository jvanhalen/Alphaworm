var messages = require('../common/messages');

var DatabaseProxy = function() {

    // Määrittele scope
    var self = this;
    self.messageHandler = undefined;
    self.connection = 0;

    // olion sisäiset muuttujat
    var mydb;
    var mysql;

    self.init = function() {

        // yhteyden tiedot
        mydb = {
            "hostname": process.env.OPENSHIFT_MYSQL_DB_HOST,
            "user": process.env.OPENSHIFT_MYSQL_DB_USERNAME,
            "password": process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
            "database": "matopeli"
        };

        // Alusta yhteys tietokantaan
        console.log("Connecting database...");
        mysql = require('mysql');

        self.connection = mysql.createConnection({

          host : mydb.hostname,

          port : 3306,

          database: mydb.database,

          user : mydb.user,

          password : mydb.password

        });

    },

    self.attachHandler = function(msghandler) {
        self.messageHandler = msghandler;
    },

    self.getLogin = function(socket, data) {
        console.log("getlogin", data);

      var resp = messages.message.AUTH_RESP.new();
      resp.response="NOK";
      resp.username = data.username;

      self.connection.query("SELECT PasswordHash, ID, UserStatus, UserName FROM UserAccount WHERE UserName = ?", [ data.username ], function(err, rows){
          if(err != null) {
            socket.send(JSON.stringify(resp));
            console.log("Query error:" + err);
          } else {
            console.log(rows[0]);
                if(rows[0] !== undefined) {
                    //console.log(rows);
                    if(rows[0].PasswordHash == data.passwordhash) {
                        //console.log("passwordhashes match");
                        resp.response = "OK";
                        resp.username = rows[0].UserName;
                        socket.send(JSON.stringify(resp));  // Send response first
                        self.messageHandler.connectClient(socket, resp.username);
                    }
                    else {
                        //console.log("passwordhashes did not match", rows[0].PasswordHash, data.passwordhash);
                        socket.send(JSON.stringify(resp));
                    }
                }
          }
      });
    },

    self.setHighScore = function(username, score) {
        self.connection.query("UPDATE UserAccount SET HighScore=? WHERE UserName = ? AND ? > HighScore", [ score, username, score ], function(err, rows){
            if(err != null) {
                console.log("DatabaseProxy setHighScore failed", err);
            }
            else {
                // TODO: better ranking list handling
                console.log("DatabaseProxy new highscore", score, "set for", username);
                self.updateRankings();
            }
          });
    },

    self.updateRankings = function() {
        self.connection.query("SELECT UserName, HighScore FROM UserAccount ORDER BY HighScore DESC LIMIT 100", [], function(err, rows){
            if(err != null) {
                console.log("DatabaseProxy updateRankings failed", err);
            }
            else {
                var msg = messages.message.RANKING_LIST.new();
                msg.players = [];
                for(var item in rows) {
                    msg.players.push({ username: rows[item].UserName, highscore: rows[item].HighScore });
                }
                self.messageHandler.broadcast(msg);
            }
          });
    },

    self.sendRankings = function(websocket, username) {
        self.connection.query("SELECT UserName, HighScore FROM UserAccount ORDER BY HighScore DESC LIMIT 100", [], function(err, rows){
            if(err != null) {
                console.log("DatabaseProxy sendRankings failed", err);
            }
            else {
                var msg = messages.message.RANKING_LIST.new();
                msg.players = [];
                for(var item in rows) {
                    msg.players.push({ username: rows[item].UserName, highscore: rows[item].HighScore });
                }
                self.messageHandler.send(username, msg);
            }
          });
    },
    /*  ====================================================================================
     Metodi: newUserAccount: (UserName: string, PasswordHash: string, Email: string) : void
     Toiminta: Luodaan uusi käyttäjätili tietokantaan, oletuksena tili on inaktiivinen ja käyttäjä ei-sisäänkirjautunut
     Palauttaa MessageHandlerin kautta: tulokset
     ====================================================================================  */

    self.newUserAccount = function(socket, data) {
        console.log("newUserAccount", data);
        var resp = messages.message.REG_RESP.new();
        resp.response="NOK";
        var email = data.username+"@inter.net";
        self.connection.query('INSERT INTO UserAccount (UserName, PasswordHash, Email) \
                            VALUES (?, ?, ?)', [ data.username, data.passwordhash, email ], function(err, rows){
        if(err != null) {
            console.log("Query error:" + err);
            socket.send(JSON.stringify(resp));
        } else {
            console.log(rows);
            socket.send(JSON.stringify(resp));  // Send response first
            // Shows the result on console window
            if(rows.affectedRows == 1) {
                if(rows.PasswordHash == data.passwordhash) {
                    resp.response = "OK";
                    resp.username = rows.UserName;
                    socket.send(JSON.stringify(resp));  // Send response first
                }
                else {
                socket.send(JSON.stringify(resp));
                }
            }
            console.log("Success!");
        }
    });

    }

    // Alusta tietokantayhteys olion luonnin yhteydessä
    self.init();
}

module.exports = DatabaseProxy;