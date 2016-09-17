var fs = require('fs');
var http = require('http');
var request = require('request');
var util = require("./util.js");

var getBadCommands = function(badCommandsFile, callback) {
	util.log("Bad commands requested.");
	util.readFile(badCommandsFile, function(error, badcommands){
		if (error) {
			callback("Error: \r\n" + error);
		} else {
			// fs.readFileSync returns a buffer. Convert to string here
			callback(null, badcommands.toString());
		}
	});
};

var getLog = function(logName, callback) {
	util.readFile(logName, function(error, logData){
		if (error) {
			callback("Error retrieving log: \r\n" + error);
		} else {
			// fs.readFileSync returns a buffer. Convert to string here
			callback(null, logData.toString());
		}
	});
};

var liveswitch = function(configFile, callback) {
		var config = null;
		try {
			config = JSON.parse(fs.readFileSync(configFile));
			if (config.testmode === true | config.testmode === "true") {
				config.testmode = false;
			} else {
				config.testmode = true;
			}
		} catch(err) {
			callback("Error reading " + configFile + ":\r\n" + err);
		}
		try {			
			fs.writeFileSync(configFile, JSON.stringify(config));
			callback(null, config);
		} catch (err) {
			callback("Error writing to " + configFile + ":\r\n" + err);
		}
};

module.exports = {
	badcommands: getBadCommands,
	log: getLog,
	toggletestmode: liveswitch
};