# taco-bot
Taco Bot is a node.js-based bot for GroupMe that replies to user-posted chat commands. This bot was made for the Destiny clan "DeltaCo 71".

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
