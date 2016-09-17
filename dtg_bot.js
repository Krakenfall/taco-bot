var fs = require("fs");
var http = require("http");
var request = require("request");
var apputil = require("./util.js");
var commands = require("./commands.js");
var util = require("util");
var rawjs = require("raw.js");
var reddit = new rawjs("raw.js monitor of DTG_Bot by https://github.com/Krakenfall/taco-bot");

var is_saved = function(id, saved_list) {
	for (var i = 0; i < saved_list.length; i++) {
		if (id == saved_list[i].id) {
			return true;
		}
	};
	return false;
};

var run = function(config, callback) {
	var redditConfig = config.reddit;
	apputil.log("Authenticating...", "dtg.log");
	reddit.setupOAuth2(redditConfig.clientId, redditConfig.secretId);
	apputil.log("Done.", "dtg.log");

	apputil.log("Retrieving submitted for DTG_Bot...", "dtg.log");

	/*
		1. Get latest posts
		2. Read saved posts
		3. Process latest posts
		4. Compare latest to saved posts
		5. Send new posts to GroupMe
		6. Add new posts to saved posts
		7. Write saved posts to file
	*/
	try {
	reddit.userLinks({user: "DTG_Bot", r: "DestinyTheGame"}, function(err, response) {
		if (!err) {
			// Read saved posts
			//apputil.log("Loading saved posts...");
			var savedPosts = JSON.parse(fs.readFileSync("saved.json", "utf8"));
			
			// Process latest posts
			//apputil.log("Filtering reddit posts...");
			var retrievedPosts = [];		
			for (var i = 0; i < response.children.length; i++) {
				var data = response.children[i].data;
				var post = new Object();
				post.id = data.id;
				post.title = data.title;
				post.subreddit = data.subreddit;
				post.author = data.author;
				post.is_self = data.is_self;
				post.url = data.url;
				post.created = data.created;
				retrievedPosts.push(post);
			}
			
			//apputil.log("Checking for new posts...");
			// Compare latest to saved posts
			var newPosts = [];
			for (var j = 0; j < retrievedPosts.length; j++) {
				if (!is_saved(retrievedPosts[j].id, savedPosts)) {
					apputil.log("New post: " + retrievedPosts[j].title, "dtg.log");
					newPosts.push(retrievedPosts[j]);
					// Add to saved posts
					apputil.log("Saving new post...", "dtg.log");
					savedPosts.push(retrievedPosts[j]);
					// Send to GroupMe
					var postUrl = retrievedPosts[j].url;
					var postTitle = retrievedPosts[j].title;
					apputil.log("Sending new link to GroupMe...", "dtg.log");
					apputil.groupme_text_post(postUrl, config, function(err) {
						if (config.dtgCommandUpdates && 
							config.dtgCommandUpdates.length > 0) {
							for (var k = 0; k < config.dtgCommandUpdates.length; k++) {
								if (postTitle.indexOf(config.dtgCommandUpdates[k].redditFilter) > -1) {
									var updateData = { 
										"name": config.dtgCommandUpdates[k].name, 
										"value": postUrl
									};
									commands.update(JSON.stringify(updateData), function(e, result) {
										if (!e) {
											apputil.log(result, "dtg.log");
										} else {
											callback(e);
										}
									});
									break;
								}
							}
						}
					});
				}
			}
			
			if (newPosts.length < 1) {
				apputil.log("No new posts", "dtg.log");
			} else {
				// Write saved posts to file
				apputil.log("Saving posts", "dtg.log");
				fs.writeFileSync("saved.json", JSON.stringify(savedPosts));
			}
		} else {
			apputil.log("Error:\r\n" + err, "dtg.log");
			callback(err);
		}
	});
	} catch(error) {
		apputil.log("ERROR: Something went wrong: \r\n" + error, "dtg.log");
		callback(error);
	}
}

module.exports = {
	run: run
};