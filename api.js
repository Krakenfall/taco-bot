var fs = require('fs');
var http = require('http');
var request = require('request');
var configService = require('./services/configuration.js');

var util = require("./util.js");

var getBadCommands = function(badCommandsFile, callback) {
	util.log("Bad commands requested.");
	util.readFile(badCommandsFile, function(error, badcommands){
		if (error) {
			callback("Error: \r\n" + error.stack);
		} else {
			// fs.readFileSync returns a buffer. Convert to string here
			callback(null, badcommands.toString());
		}
	});
};

var getLog = function(logName, callback) {
	util.readFile(logName, function(error, logData){
		if (error) {
			callback("Error retrieving log: \r\n" + error.stack);
		} else {
			// fs.readFileSync returns a buffer. Convert to string here
			callback(null, logData.toString());
		}
	});
};

var liveswitch = function(callback) {
		var config = {};
		var configFileName = configService.CONFIG_FILE_NAME;
		try {
			config = configService.GetConfigurationSync(configFileName);
			config.testmode = !config.testmode;
		}
		catch(err) {
			callback("Error reading " + configFileName + ":\r\n" + err.stack);
		}

		try {
			configService.SaveConfiguration(config, configFileName);
			callback(null, config);
		}
		catch (err) {
			callback("Error saving config to " + configFileName + ":\r\n" + err.stack);
		}
};

module.exports = {
	badcommands: getBadCommands,
	log: getLog,
	toggletestmode: liveswitch
};
