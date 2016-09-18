var fs = require('fs');
var http = require('http');
var request = require('request');
var apputil = require("./util.js");

var commandJsonDir = function() {
		return './public/commands.json';
};

var sortObject = function (o) {
    var sorted = {},
    key, a = [];
    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }
    a.sort();
    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    return sorted;
};

var listCommands = function(callback) {
	apputil.readFile(commandJsonDir(), function (error, commandsFileContent){
		if (error) {
			callback(error);
		} else {
			var storedCommands = null;
			try {
				storedCommands = JSON.parse(commandsFileContent);
			} catch(e) {
				apputil.log("Error: Could not parse stored commands:\r\n" + e);
				callback(e);
			}
			try {
				var list = "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">" +
					"<title>Taco Bot Commands</title></head><body><h1>Available Commands</h1>" +
					"<table border=\"0\">" +
					"<tr><th>Command</th><th>Response</th></tr>";
				storedCommands = sortObject(storedCommands);
				for (var storedCommand in storedCommands) {
					list += "<tr><td>!" + storedCommand + "</td><td>";
					// If JSON object is an array list out the options
					if (Object.prototype.toString.call(storedCommand) == "[object Array]") {
						for (var item in storedCommand) {
							if (storedCommand[item].indexOf("http") > -1 ||
								storedCommand[item].indexOf("www") > -1) {
								list += " \"<a href=\"" + storedCommand[item] + "\" target=\"_blank\">" +
								storedCommand[item] + "</a><br />";
							} else {
								list += "\" " + storedCommand[item] + "<br />";
							}
						}
					} else {
						// If not, just put the string content in the table slot
						if (storedCommands[storedCommand].indexOf("http") > -1) {
							list += "<a href=\"" + storedCommands[storedCommand] + "\" target=\"_blank\">" +
							storedCommands[storedCommand] + "</a>";
						} else {
							list += storedCommands[storedCommand];
						}
					}
					list += "</td></tr>";
				}
				list += "</table></body></html>";
				callback(null, list);
			} catch(err) {
				apputil.log("Error generating command list html:\r\n" + err);
				callback(err);
			}
		}
	});
};

var updateCommands = function(postData, callback) {
	var newCommand = null;
	var invalidCommandReg = /\W|_/g;
	try {
		newCommand = JSON.parse(postData);
		if (!newCommand) {
			callback("Submitted command is null");
		} else if (!newCommand.name) {
			callback("Submitted command is missing command.name");
		} else if (!newCommand.value) {
			callback("Submitted command is missing command.value");
		} else if (invalidCommandReg.test(newCommand.name)) {
			callback("Command name must not have any non-alphanumeric characters");
		} else if (newCommand.name.indexOf(" ") > -1) {
			callback("Command name must not have any non-alphanumeric characters");
		} else {
			var currentCommands = null;
			try {
				currentCommands = JSON.parse(fs.readFileSync(commandJsonDir()));
			} catch(err) {
				var message = "Error parsing commands.json:\r\n" + err;
				apputil.log(message);
				callback(err);
				// Below: disallows adding invalid commands
				// This shouldn't be needed, but just to be sure (paranoia)
				currentCommands = null;
			}
			if (currentCommands) {
				try {
					currentCommands[newCommand.name.toLowerCase()] = newCommand.value;
					fs.writeFileSync(commandJsonDir(), JSON.stringify(currentCommands));
					callback(null, "Command successfully added: !" +
						newCommand.name.toLowerCase() + " returns \"" +
						newCommand.value + "\"");
				} catch (error) {
					var message = "Error parsing commands.json while updating commands:\r\n" + error;
					apputil.log(message);
					callback(message);
				}
			} else {
				var message = "Error updating commands:\r\n\t Data read from commands.json was null?";
				apputil.log(message);
				callback(message);
			}
		}
	} catch(err) {
		var message = "Error: Submitted data was an invalid command or had invalid JSON:\r\n" + err;
		apputil.log(message);
		callback(message);
	}

};

var parseMessage = function(message) {
	var pattern = /\!([a-zA-Z0-9]+)/g;
	var matches = message.match(pattern);
	if (matches) {
		for (var i = 0; i < matches.length; i++) {
			matches[i] = matches[i].replace(/\!/g, '');
		}
	}
	return matches;
};

var jokePick = 0;
var huskerPick = 0;
var jokeStartup = true;
var huskerStartup = true;
var jokes = [];
var husker = [];
try {
	jokes = JSON.parse(fs.readFileSync(commandJsonDir())).joke;
	husker = JSON.parse(fs.readFileSync(commandJsonDir())).huskersermon;
}
catch (err) { apputil.log("Error: Failed to read command.json at startup\r\n" + err); }
var checkForCommandArray = function(command, commandObject, callback) {
	if (command == "joke" && Object.prototype.toString.call(commandObject) == "[object Array]") {
		console.log("jokes.length: " + jokes.length);
		// Initial joke shuffle
		console.log("Startup: " + jokeStartup);
		if (jokeStartup) {
			console.log("Hit code: jokePick = 0");
			jokes = apputil.shuffle(jokes);
			jokeStartup = false;
		}
		// Reset pool if jokePicks are exhausted
		if (jokePick >= jokes.length - 1) {
			console.log("Hit code: jokePick >= jokes.length - 1");
			jokes = apputil.shuffle(jokes);
			jokePick = 0;
		}
		// Reset pool if new jokes are added
		console.log("jokes.length: " + jokes.length + " commandObject.length: " + commandObject.length);
		if (jokes.length < commandObject.length) {
			console.log("Hit code: jokes.length < commandObject.length - 1");
			jokes = [];
			try { jokes = JSON.parse(fs.readFileSync(commandJsonDir())).joke; }
			catch (err) {
				var errmessage = "Error: Failed to reload command.json for new jokes\r\n" + err;
				apputil.log(errmessage);
				callback(errmessage);
			}
			jokes = apputil.shuffle(jokes);
			jokePick = 0;
		}
		var pickObject = jokes[jokePick];
		console.log("jokes.length: " + jokes.length +
			"\r\ncommandObject.length: " + commandObject.length + "\r\njokePick: " + jokePick);
		jokePick++;
		callback(null, pickObject);
	} else if(command == "huskersermon" && Object.prototype.toString.call(commandObject) == "[object Array]") {
		console.log("husker.length: " + husker.length);
		// Initial joke shuffle
		console.log("Startup: " + huskerStartup);
		if (huskerStartup) {
			console.log("Hit code: huskerPick = 0");
			husker = apputil.shuffle(husker);
			huskerStartup = false;
		}
		// Reset pool if huskerStartups are exhausted
		if (huskerPick >= husker.length - 1) {
			console.log("Hit code: huskerPick >= husker.length - 1");
			husker = apputil.shuffle(husker);
			huskerPick = 0;
		}
		// Reset pool if new husker are added
		console.log("husker.length: " + husker.length + " commandObject.length: " + commandObject.length);
		if (husker.length < commandObject.length) {
			console.log("Hit code: husker.length < commandObject.length - 1");
			husker = [];
			try { husker = JSON.parse(fs.readFileSync(commandJsonDir())).joke; }
			catch (err) {
				var errmessage = "Error: Failed to reload command.json for new husker\r\n" + err;
				apputil.log(errmessage);
				callback(errmessage);
			}
			husker = apputil.shuffle(husker);
			huskerPick = 0;
		}
		var pickObject = husker[huskerPick];
		console.log("husker.length: " + husker.length +
			"\r\ncommandObject.length: " + commandObject.length + "\r\nhuskerPick: " + huskerPick);
		huskerPick++;
		callback(null, pickObject);

	} else {
		callback(null, commandObject);
	}
};

var processCommand = function(command, post, config) {
	apputil.readFile(commandJsonDir(), function (error, commandsFileContent){
		if (error) {
			apputil.log(error);
		} else {
			var storedCommands = null;
			try {
				storedCommands = JSON.parse(commandsFileContent);
			} catch(e) {
				apputil.log("Error: Could not parse stored commands:\r\n" + e);
			}
			var commandFound = false;
			for (var storedCommand in storedCommands) {
				if (command.toLowerCase() == storedCommand) {
					commandFound = true;
					checkForCommandArray(storedCommand, storedCommands[storedCommand],
						function(err, reply) {
						if (!err) {
							apputil.groupme_text_post(reply, config, function(e, result){
								if (!e) {
									apputil.log(result);
								} else {
									apputil.log(e);
								}
							});
						} else {
							apputil.log(err);
						}
					});

				}
			}
			if (!commandFound) {
				apputil.log("Command not found: " + command.toLowerCase() + "\r\n", "commands_not_found.txt");
			}
		}
	});
};

module.exports = {

	commandJsonDir: commandJsonDir,

	list: listCommands,

	update : updateCommands,

	investigate: function(groupmePost, config) {
		try {
			var messageObject = JSON.parse(groupmePost);
		} catch (err) {
			apputil.log("Bad JSON in message from GroupMe:\r\nMessage:\r\n" + groupmePost
				+ "\r\nError:\r\n" + err);
		}
		if (messageObject) {
			var commands = parseMessage(messageObject.text);
			if (commands &&
				messageObject.sender_id != "329044" &&
				messageObject.sender_id != "329214" &&
				messageObject.sender_id != "356826") {
				for (var i = 0; i < commands.length; i++) {
					processCommand(commands[i], messageObject, config);
				}
			} // No else actions, since this will be done every GroupMe message
		}
	}
};
