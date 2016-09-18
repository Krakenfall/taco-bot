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

var liveswitch = function(configFileName, callback) {
		var config = {};

		try {
			config = require(configFileName);
			config.testmode = !config.testmode;
		}
		catch(err) {
			callback("Error reading " + configFileName + ":\r\n" + err);
		}

		try {
			fs.writeFileSync(configFileName, JSON.stringify(config, null, 2));
			callback(null, config);
		}
		catch (err) {
			callback("Error writing to " + configFileName + ":\r\n" + err);
		}
};

module.exports = {
	badcommands: getBadCommands,
	log: getLog,
	toggletestmode: liveswitch
};
