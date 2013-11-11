DROP DATABASE IF EXISTS matopeli;
CREATE DATABASE matopeli;
USE matopeli;

# ------------------------------
# Taulu: User
# ------------------------------

/* Username, Email ja SessionKey ovat sekä uniikkeja että indeksejä; lisäksi UserStatus ja PasswordHash ovat indeksejä
   UserStatus oletusarvo on 0 -> otettava huomioon koodatessa */

CREATE TABLE UserAccount (
  ID int NOT NULL AUTO_INCREMENT,
  UserName varchar(32) NOT NULL,
  PasswordHash char(40) NOT NULL,
  Email varchar(255),
  SessionKey varchar(16),
  LastLogin timestamp,
  UserStatus tinyint NOT NULL DEFAULT '0',
  HighScore smallint NOT NULL DEFAULT '0', -- Lisätty 1.11.2013
  PRIMARY KEY (ID),
  UNIQUE UserName (UserName),
  UNIQUE Email (Email),
  UNIQUE SessionKey (SessionKey),
  KEY UserStatus (UserStatus),
  KEY PasswordHash (PasswordHash)
) ENGINE=InnoDB;

# ------------------------------
# Taulu: Game
# ------------------------------

/* GameMode ja GameStatus oletusarvo on 0 -> otettava huomioon koodatessa */

CREATE TABLE Game (
  ID int NOT NULL AUTO_INCREMENT,
  GameDate timestamp,
  GameDuration time,
  GameMode tinyint NOT NULL DEFAULT '0',
  GameStatus tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (ID)
) ENGINE=InnoDB;


# ------------------------------
# Taulu: ChatMessage
# ------------------------------

/* UserAccountID oltava indeksi, muuten vierasavain ei mahdollinen */

CREATE TABLE ChatMessage (
  ID int NOT NULL AUTO_INCREMENT,
  UserAccountID int NOT NULL,
  Message varchar(255),
  MessageDate timestamp,
  PRIMARY KEY (ID),
  KEY UserAccountID (UserAccountID),
  CONSTRAINT ChatMessage_UserAccountID_FK FOREIGN KEY (UserAccountID)
  REFERENCES UserAccount (ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


# ------------------------------
# Taulu: Player
# ------------------------------

/* Pääavain on komposiitti, yhdistelmä kahdesta avaimesta, jotka myös ovat vierasavaimia
   Koska vierasavain on myös pääavain, sille ei tarvitse indeksiä, koska pääavain indeksoituu joka tapauksessa
   Score ja PlayerStatus oletusarvo on 0 -> otettava huomioon koodatessa */

CREATE TABLE Player (
  GameID int NOT NULL,
  UserAccountID int NOT NULL,
  Score smallint NOT NULL DEFAULT '0',
  PlayerStatus tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (GameID, UserAccountID),
  CONSTRAINT Player_GameID_FK FOREIGN KEY (GameID)
  REFERENCES Game (ID) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT Player_UserAccountID_FK FOREIGN KEY (UserAccountID)
  REFERENCES UserAccount (ID) ON UPDATE CASCADE
) ENGINE=InnoDB;


# ------------------------------
# Taulu: ReplayFrame
# ------------------------------

/* GameID oltava indeksi, muuten vierasavain ei mahdollinen
   Koska taulu on intensiivisessä käytössä, tehdään FieldData tekstikentälle indeksi sen ensimmäisistä 16 merkistä -> otettava huomioon koodatessa */

CREATE TABLE ReplayFrame (
  ID int NOT NULL AUTO_INCREMENT,
  GameID int NOT NULL,
  FieldData text NOT NULL,
  PRIMARY KEY (ID),
  KEY GameID (GameID),
  KEY FieldData_prefix (FieldData(16)),
  CONSTRAINT ReplayFrame_GameID_FK FOREIGN KEY (GameID)
  REFERENCES Game (ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


# ------------------------------
# Taulu: WormCustomization
# ------------------------------

/* Koska vierasavain on myös pääavain, sille ei tarvitse indeksiä, koska pääavain indeksoituu joka tapauksessa
   Väri color-kentässä on madolle oletusarvoisesti syvänsininen -> otettava huomioon koodatessa */

CREATE TABLE WormCustomization (
  UserAccountID int(11) NOT NULL,
  Color varchar(6) NOT NULL DEFAULT '0000FF',
  PRIMARY KEY (UserAccountID),
  CONSTRAINT WormCustomization_UserAccountID_FK FOREIGN KEY (UserAccountID)
  REFERENCES UserAccount (ID) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;