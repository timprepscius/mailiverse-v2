CREATE DATABASE postfix DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
CREATE USER 'postfix'@'localhost' IDENTIFIED BY 'postfix';
GRANT ALL PRIVILEGES ON postfix.* TO 'postfix'@'localhost';

USE postfix;

CREATE TABLE IF NOT EXISTS user (
	name 	VARCHAR(255) NOT NULL DEFAULT '',
	password VARCHAR(255),
	mark	TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (name)
);
