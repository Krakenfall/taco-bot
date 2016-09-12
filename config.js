var fs = require('fs');

var config = null;
var configFile = "appconfig.json";

try {	
	config = JSON.parse(fs.readFileSync(configFile));
} catch(error) {
	console.log("Could not read config file at \\" + configFile + ":\r\n" + error);
}


module.exports = {
	config: config
};