var fs = require('fs');
var http = require('http');
var request = require('request');

var log = function(data, file) {
	var logFile = "";
	if (file) {
		logFile = file;
	} else {
		logFile = "nodeserver.log";
	}
	try {
		fs.appendFileSync(logFile, new Date() + "\r\n");
		console.log(data);
		fs.appendFileSync(logFile, data + "\r\n\r\n");
	} catch (error) {
		console.log("Error: Failed to log data in " + file + "\r\nData: " + data);
	}
};

var getFileContents = function(filename, callback) {
	var contents = null;
	try {
		contents = fs.readFileSync(filename);
	} catch(err) {
		callback("Error: Could not read file " + filename + "\r\n" + err);
	}
	callback(null, contents);
};

var groupme_text_post = function(text, config, callback) {
	var bot = null;
	try {
		if (config.testmode) {
			bot = config.testbot;
		} else {
			bot = config.bot;
		}
	} catch (err) {
		var message = "Error with bot info:\r\n" + err;
		log(message);
		callback(message);
	}
	try {
		var message = "Success! Posted:\r\n";
		request.post("https://api.groupme.com/v3/bots/post", 
			{json: {"bot_id": bot.id, "text": text}},
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				message += text + " Response: \r\n" + body;
				callback(null, message);
			}
			else if (!error && response.statusCode == 202) {
				message += text + " Response: \r\n" + body;
				callback(null, message);
			} else {
				message = "Failed to submit GroupMe message.\r\nResponse Code: " + 
					response.statusCode + "\r\nError: " + error + "\r\nMessage body:\r\n" + text;
				log(message);
				callback(message);
			}
		});
	} catch (err) {
		message = "Error submitting groupme message: " + err;
		log(message);
	}
};

function shuffle(list) {
    for(var j, x, i = list.length; i; j = parseInt(Math.random() * i), x = list[--i], list[i] = list[j], list[j] = x);
    return list;
};

// Load config from file

module.exports = {
	readFile: getFileContents,
	groupme_text_post: groupme_text_post,
	log: log,
	shuffle: shuffle
};