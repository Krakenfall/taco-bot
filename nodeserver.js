var http = require('http');
var fs = require('fs');
var commands = require("./commands.js");
var apputil = require("./util.js");
var dtg_bot = require("./dtg_bot.js");
var api = require("./api.js");
var dns = require('dns');
var express = require('express');
var app = express();
var ipr = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;

var config = null;
var configFile = "appconfig.json";

try {	
	config = JSON.parse(fs.readFileSync(configFile));
} catch(error) {
	console.log("Could not read config file at \\" + configFile + ":\r\n" + error);
}

var staticFilesDir = function() {
	if (/^win/.test(process.platform)) {
		return __dirname + "\\public"
	} else {
		return __dirname + "/public"
	}
};

try {
	var c = JSON.parse(fs.readFileSync(commands.commandJsonDir()));
	c["commands"] = "http://" + config.domain + ":" + config.port + "/commandlist";
	fs.writeFileSync(commands.commandJsonDir(), JSON.stringify(c));
	apputil.log("Successfully updated commands list url with port " + config.port);
} catch (error) {
	apputil.log("Could not update commands list url in commands.json with port specification:\r\n" + error);
}

app.use(express.static(staticFilesDir()));

app.get('/', function(req, res) {
	res.send('No thank you.');
});

app.post("/command", function(req, res) {
	var body = "";
	req.on('data', function (chunk) {
	  body += chunk;
	});
	req.on('end', function () {
	  res.writeHead(200);
	  console.log('Command Posted: ' + body);
	  res.end(commands.investigate(body, config));
	});
});

app.get("/commandlist", function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
	commands.list(function(error, commandPage) {
		if (error) {
			res.end("Whoops! Something went wrong.");
		} else {
			res.end(commandPage);
		}
	});
});

app.get("/add", function(req, res) {
	res.redirect('/addcommand.html');
});

app.post("/addcommand", function(req, res) {
	var incoming = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
	var ip = incoming.match(ipr);
	dns.resolve(config.domain, function(err, addresses, family) {
		if (ip == addresses[0] || ip == "127.0.0.1") {
			var body = "";
			req.on('data', function (chunk) {
			  body += chunk;
			});
			req.on('end', function () {
			  res.writeHead(200, {'Content-Type': 'text/html'});
			  apputil.log('New command Posted: ' + body);
			  var addMessage = "Adding new command failed with error:\r\n";
			  try {
			  commands.update(body, function(error, message) {
				if(!error) {
					addMessage = message;
				} else {
					addMessage += error;
				}
				apputil.log(addMessage);
				res.end(addMessage);
			  });
			  } catch (err) {
				apputil.log(addMessage + err);
				res.end(addMessage + err);
			  }
			});
		} else {
			apputil.log("IP: " + ip + " tried to access /addcommand. cbarr.net: " + addresses[0],
				config.accessLogFile);
			res.status(500).send('Access denied');
		}
	});
});

app.get("/log", function(req, res) {
	var incoming = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
	var ip = incoming.match(ipr);
	dns.resolve(config.domain, function(err, addresses, family) {
		if (ip == addresses[0] || ip == "127.0.0.1") {
			api.log(config.logFile, function(error, logData){
				if (error) {
					apputil.log(error);
					res.end(error);
				} else {
					res.end(logData);
				}
			});
		}
		else {
			apputil.log("IP: " + ip + " tried to access /log. cbarr.net: " + addresses[0],
				config.accessLogFile);
			res.status(500).send('Access denied');
		}
	});
});

app.get("/badcommands", function(req, res) {
	var incoming = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
	var ip = incoming.match(ipr);
	dns.resolve(config.domain, function(err, addresses, family) {
		if (ip == addresses[0] || ip == "127.0.0.1") {
			api.badcommands(config.badCommandsFile, function(error, badcommands){
				if (error) {
					apputil.log(error);
					res.end(error);
				} else {
					res.end(badcommands);
				}
			});
		}
		else {
			apputil.log("IP: " + ip + " tried to access /badcommands. cbarr.net: " + addresses[0],
				config.accessLogFile);
			res.status(500).send('Access denied');
		}
	});
});

app.get("/testmode", function(req, res) {
	var incoming = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
	var ip = incoming.match(ipr);
	dns.resolve(config.domain, function(err, addresses, family) {
		if (ip == addresses[0] || ip == "127.0.0.1") {
			res.end(config.testmode.toString());
		}
		else {
			apputil.log("IP: " + ip + " tried to access /testmode. cbarr.net: " + addresses[0],
				config.accessLogFile);
			res.status(500).send('Access denied');
		}
	});
});

app.get("/toggletestmode", function(req, res) {
	var incoming = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
	var ip = incoming.match(ipr);
	dns.resolve(config.domain, function(err, addresses, family) {
		if (ip == addresses[0] || ip == "127.0.0.1") {
			api.toggletestmode(configFile, function(error, newConfig) {
				if (!error) {
					config = newConfig;
					var message = "Test mode successfully toggled. Test mode now set to " + newConfig.testmode;
					apputil.log(message);
					res.end(message);
				} else {
					apputil.log(error);
					res.end(error);
				}				
			});
		}
		else {
			apputil.log("IP: " + ip + " tried to access /toggletestmode. cbarr.net: " + addresses[0],
				config.accessLogFile);
			res.status(500).send('Access denied');
		}
	});
});

app.use(function(err, req, res, next) {
  apputil.log("Error with server:\r\nError:\r\n" + err + "\r\nStack:" + err.stack);
  res.status(500).send('Something broke!');
});

apputil.log("Beginning dtg_bot loop.");
if (config.reddit) {
	setInterval(function(){
		dtg_bot.run(config, function(error) {
			if (error) {
				apputil.log("Failed when running dtg_bot:\r\n" + error);
			}
		});
	}, 60 * 5 * 1000);
} else {
	apputil.log("Warning: No reddit access key found in appconfig.json. Dtg_bot functions will be inactive.");
}
app.listen(config.port, function () {
	apputil.log("Server listening on port " + config.port);
});

