"use strict";
const githubRepos = require('github-repositories'),
	  index = require('./index.js'),
	  express = require('express'),
	  db = require('./datastore.js'),
	  google = require('googleapis'); //index = require('./index.js');
const githubColors = [
	"#6cc644",
	"#4078c0",
	"D8D8D8",
	"#e0f1ff"

];

var http = require('http');
//var app = express();
var request = require('request');
var OAuth2 = require('client-oauth2');
var Github = require('github-api');


var githubAuth = new OAuth2({
	clientId: "6edfdc4adeb501a8a211",
	clientSecret: "8854d907c6f28ee7324cc3e5320bd53c6251bf5f",
	accessTokenUri: "https://github.com/login/oauth/access_token",
	authorizationUri: "https://github.com/login/oauth/authorize",
	authorizationGrants: ['credentials'],
	redirectUri: "https://slack-searcher.herokuapp.com/github/oauth2callback/",
	scopes: ['repo', 'user'],
	method: 'GET',
	headers: {'user-agent': 'GitHub-Slack'}
});

var githubRepoURL = "";

var userObj = {};
var apiReqUrl = "";
let gitHubUser;
let userToken;
function checkCredentials(term) {
	var response = "";
	var succeed = "";
	console.log("checkCredentials");
	 db.get(index.slack.payload.user_id).then(function(user) {
	 	
        if (!user.tokens || !user.tokens.github.access_token) {
            userLogin("Could not find GitHub credentials");
        } else {
            gitHubUser = user;
            // Attempt to use stored credentials, and use these to access the files
            console.log("Successfully retrieved GitHub access token:", user.tokens.github.access_token);
            let token = user.tokens.github.access_token;
            //githubAuth.credentials.token = token;
            storeToken(token);
            console.log(typeof user.tokens.github.access_token);
            listInfo(term, token);
        }
    }).catch(function(err) {
    	//userLogin();
    	console.log("error");
       userLogin("Could not find GitHub credentials:", err);
    });
}
function listInfo(term, token) {
	console.log("listRepos");
	var GithubAPI = new Github({
		token: token
	});
	let user = GithubAPI.getUser();
	var options = {
    		url: 'https://api.github.com/',
    		body: 'hello',
   			// path: '/users/' + username + '/repos',
    		method: 'GET',
    		headers: {'User-Agent': 'GitHub-Slack'}
    };
    // console.log(githubAuth.credentials.token);
    // githubAuth.credentials.getToken().refresh().then(storeToken(this));
	// githubAuth.code.getToken().then(function(user) {
	// 	console.log(user);
	// }).catch(function(err) {
	// 	console.log("error in credentials");
	// 	console.log(err);
	// });
	var attachments = [];
	var errorMessage = "";
	var i = 0;
	user.listRepos({q: term+" in:name"}, function(err, repos) {
		
		console.log(!err);
		if(!err) {
			
			if(repos.length == 0) {
				errorMessage = "No repositories were found."
			}
			else {
				errorMessage = "Found repositiories matching: " + term;
				repos.forEach(function(element) {
				//console.log(element.name);
					if(element.name.toLowerCase().includes(term.toLowerCase())) {
						attachments.push(createAttachment(element,i++));
						console.log(element.name);
						console.log(element.html_url);
					}	
				});
				
			//	console.log(errorMessage);

			
			}
			
			
			//console.log(Array.isArray(repos));
		}
	}).then(function(data) {
		console.log("data in listRepos");
		if(attachments.length == 0) {
			errorMessage = "No repositories with the term " + term + " were found."
		}
		index.send(errorMessage, attachments);
	}).catch(function(err) {
		
		console.log("there is an error");
		console.log(err);
		reauthenticateSession(term);
		
	});


}
function createAttachment(repo, index) {
	return {
		"title": repo.name,
		"title_link": repo.html_url,
		"color": githubColors[index % githubColors.length]
	};
}
function reauthenticateSession(term) {
	console.log("reauthenticateSession");
	if(!gitHubUser || !gitHubUser.tokens.github.refresh_token) {
		return userLogin("Didn't find Github refresh_token");
	}
	let refreshToken = gitHubUser.tokens.github.refresh_token;
	githubAuth.credentials.token = refreshToken;


}

//from drive.js 
function storeToken(token) {
	let info = [];
    let args;
    console.log("storeToken");
    console.log(token.refresh_token);
    console.log(typeof token);

    if (token.refresh_token) {
        // Should be authenticating for first time, store entire object	
        args = {
            access_token: token,
            refresh_token: token.refresh_token
        };
        args.refresh_token = token.refresh_token;
    } else {
        // Every time afterwards, only modify the access_token field	
        args = token;
        info.push("access_token");
    }
	db.set(index.slack.payload.user_id, "github", args, info);

}


function authUrl() {
	
	var authurl = githubAuth.code.getUri(githubAuth.options);
	return authurl;
}

/*
* retrieves access token for Github API
* @param {String} url that is requesting api token 
* @param {Function} callback function that signals if the api token
			was successfully retrieved.
*
*/
function getAPIToken(url, callback) {
	console.log("getAPIToken");
	let token;
	// get token sent back from url
	githubAuth.code.getToken(url).then(function(user) {
		//console.log("err " + err);
		console.log('user');
	//	console.log(user);
		token = user.data.access_token;
		//	console.log(token);

			storeToken(token);
			githubAuth.credentials.token = token;
			userToken = user;
			index.search();
			callback(`<h3>Successfully logged in! You can close me now</h3>`);

		

	});
}
function userLogin(message, err) {
	console.log(message, err);
	let url = authUrl();
	let attachment = createUrlAttachment(url);
	index.send("You are not logged into your GitHub account", attachment);

}
function createUrlAttachment(url) {
    return [{
        "title": "Login",
        "title_link": url
    }];
}
module.exports.githubAuth = githubAuth; 
module.exports.checkCredentials = checkCredentials;
module.exports.getAPIToken = getAPIToken;
