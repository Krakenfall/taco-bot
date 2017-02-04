# taco-bot
Taco Bot is a node.js-based bot for GroupMe that replies to user-posted chat commands. This bot was made for the Destiny clan "DeltaCo 71".

### Taco-Bot is under-going a full rewrite using what I've learned in the past year. Updates to come.


# Layout
Taco Bot is actually made of several pieces:
  * GroupMe Bot
  * Node.js Server
  * Node.js Timed Script

The GroupMe Bot is created using the [GroupMe Developers site](https://dev.groupme.com/) and provides the ability to read or post in a chat using the GroupMe API.

The Node.js server uses the express.js module to provide API and some front-end services. From the GroupMe API, it receives an HTTP POST each time someone comments in the chat. Using this POST, the server can process for commands or perform other function. The node.js server also provides an IP-locked addcommand.html page and various other static files.

The Node.js timed script queries the Reddit API for new posts by /u/DTG_Bot and relays their links to a specified GroupMe chat. It also updates to the commands in the server for weeklyreset, xur and trialsinfo. These commands provide weekly-changed links to the Reddit megathreads for those activities.

# Getting the Taco Bot Running
1. [Setup a GroupMe Bot](https://dev.groupme.com/tutorials/bots). Take the bot id and save it for later
2. Install Node.js on the computer where the app will run
3. Go to the [reddit API](https://www.reddit.com/dev/api/) and get your OAuth2 token. Place it in the appconfig.json file below.
4. Open a shell session at the directory where the app files are and run `npm install.` The necessary modules will be installed from the package.json file
5. Create an appconfig.json file next to the nodeserver.js file. Use this format:
```javascript
{
 "domain": "[domain or public IP address for the computer where your app is running]",
 "port": "[desired port]",
 "testmode": false,
 "bot": {
  "id": "[Your bot's id from step 1]"
 },
 "testbot": {
  "id": "[A second, optional bot id for testing]"
 },
 "reddit": {
	"name": "dtgbot_monitor",
	"clientId": "[Get from Reddit API]",
	"secretId": "[Get from Reddit API]",
	"redirectUrl": "http://127.0.0.1:6063/authorize_callback",
	"description": "Retrieves information from /r/DestinyTheGame and /u/DTG_Bot"
 },
 "dtgCommandUpdates": [
		{ "redditFilter": "Weekly Reset Thread", "name": "weeklyreset" },
		{ "redditFilter": "Trials of Osiris Megathread","name": "trialsinfo" },
		{ "redditFilter": "Xur Megathread", "name": "xur" }
 ]
}
```
6. Set the callback URL for the GroupMe bot using the format `http://[domain from appconfig]:[port from appconfig]/command`
7. In your router, forward the port from the callback URL to the IP address specified in the appconfig for domain
8. Run the command `node nodeserver.js`
9. Enter a command in the chat where your GroupMe bot lives and watch it happen!
