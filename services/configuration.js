var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var util = require('util');

var configFileStats = null;
var config = null;

const CONFIG_FILE_NAME = 'appconfig.json';


function loadConfiguration (ConfigFileName) {
  return fs.readFileAsync(ConfigFileName)
    .then((fileContents) => JSON.parse(fileContents))
    .then((loadedConfiguration) => config = loadedConfiguration);
};

function updateConfiguration(ConfigFileName) {
  return fs.statAsync(ConfigFileName)
    .then((stats) => {
      if (stats && stats.isFile()) { // if we have valid stats compare modification times
         if (!configFileStats || stats.mtime !== configFileStats.mtime) {
           configFileStats = stats;

           return loadConfiguration(ConfigFileName);
         }
      }

      // stat failed the file does not exist or there was another problem loading
      // the file.
      return Promise.reject({message: `Unable to update configuration file: ${ConfigFileName}`});
    }
  );
}


function getConfiguration (ConfigFileName) {
  var configFileName = (ConfigFileName == null)? CONFIG_FILE_NAME : ConfigFileName;

  return updateConfiguration(configFileName)
    .then(() => config);
}


// this method will make transition to the promises version eaiser
function getConfigurationSync (ConfigFileName) {
  var configFileName = (ConfigFileName == null)? CONFIG_FILE_NAME : ConfigFileName;
  var fileStat;

  try{
    fileStat = fs.statSync(configFileName);
  }
  catch (err) {
    throw (`Unable to update configuration file: ${configFileName}`);
  }

  if (!fileStat.isFile()) {
    throw (`Unable to update configuration file: ${configFileName}`);
  }

  if (!configFileStats || fileStat.mtime !== configFileStats.mtime) {
    try {
      config = JSON.parse(fs.readFileSync(configFileName));
      configFileStats = fileStat;
    }
    catch (er) {
      throw(`Unable to parse configuration file: ${configFileName}`);
    }
  }

  return config;
}


function saveConfiguration (Config, ConfigFileName){
  var configFileName = (ConfigFileName == null)? CONFIG_FILE_NAME : ConfigFileName;

  return fs.writeFileAsync(configFileName, JSON.stringify(Config, null, 2))
    .then(() => getConfiguration(configFileName));
}


updateConfiguration(CONFIG_FILE_NAME);

module.exports = {
  CONFIG_FILE_NAME: CONFIG_FILE_NAME,
  GetConfiguration: getConfiguration,
  GetConfigurationSync: getConfigurationSync,
  SaveConfiguration: saveConfiguration
};
