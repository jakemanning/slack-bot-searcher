"use strict";

const dotenv = require('dotenv').load(), // Uses the .env file for the credentials
    server = require('./server.js'), // Interacts with Slack api
    gdrive = require('./drive.js'), // Searches for google drive files
    github = require('./github.js'); // Searches for github repositories

const slashCommand = "/from";
const example = createAttachment("Example: " + slashCommand + " [google] [file_name] to search for a file from google");

let slack = server.instance({});

slack.on(slashCommand, payload => {
    console.log("Received " + slashCommand + " slash command from user " + payload.user_id);

    slack.payload = payload;
    let message = "";
    let attachments = [];

    if (payload.text && payload.text === "help") {
        message = "Search for files with the given name, or that contain text";
        attachments.push(example);
    } else if (payload.text) {
        // Splits string into [service, search-term], then searches
        search();
    } else {
        message = "How can I search if you don't gimme a term to search for?";
        attachments.push(example);
    }
    send(message, attachments);
});

function search() {
    if (!slack.payload) {
        console.log("No payload");
        throw err;
    }
    let str = slack.payload.text;
    let service = str.substr(0, str.indexOf(" "));
    let term = str.substr(str.indexOf(" ") + 1);
    let attachments = [];

    if (service.length === 0 || term.length === 0) {
        attachments.push(example);
        return send("You need to include the service, and the description of what you are trying to find", attachments);
    }

    if (service === "google") {
        send("Searching " + service + " for " + term + "...");
        gdrive.queryDrive(term);
    } else if (service === "github") {
        send("Searching " + service + " for " + term + "...");
        github.checkCredentials(term);
        // Kimberly's code here
    } else {
        attachments.push(example);
        send("Incorrect service", attachments);
    }
}

function createAttachment(text) {
    return {
        "text": text
    };
}

/**
 * Sends a slack message
 * 
 * @param {string} message - the message to be sent
 * @param {array(object)} attachments - optional attachments
 */
function send(message, attachments) {
    let response = Object.assign({ channel: slack.payload.user_id, text: message, attachments: attachments });
    slack.send(slack.payload.response_url, response).then(res => { // on success
      
        console.log("Response sent to " + slashCommand + " slash command");
    }, reason => { // on failure
        console.log("An error occurred when responding to " + slashCommand + " slash command: " + reason);
    });
}

module.exports.slack = slack;
module.exports.send = send;
module.exports.search = search;

// incoming http requests
slack.listen((process.env.PORT || "3000"));
