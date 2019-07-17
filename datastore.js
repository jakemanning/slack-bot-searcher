"use strict";

// UNIT TESTING: https://scotch.io/tutorials/test-a-node-restful-api-with-mocha-and-chai
const mongoose = require('mongoose'),
    User = require('./userSchema.js');

mongoose.connect(process.env.DATABASE_URL);
//console.log(DATABASE_URL);

// ------------------------------
// ASYNCHRONOUS PROMISE-BASED API
// ------------------------------

/**
 * Retrieves a single user based on specified id
 * 
 * @param {int} id - The user document based on slack id
 * @return {User} The matching user
 */
function get(id) {
    return new Promise(function (resolve, reject) {
        User.findOne({ slack_id: id }, function (err, user) {
            if (err || !user) return reject(err);
            resolve(user);
        });
    });
}

/**
 * Updates a single user, or inserts a new one if none match the specified id
 * 
 * @param {int} id - The user document to update/create
 * @param {string} service - The new object to be inserted at the specified path
 * @param {Object} args - The arguments that should be update 
 * @param {Array} arr - To handle nested paths
 */
function set(id, service, args, arr) {
    return new Promise(function (resolve, reject) {
        let update = updateParameter(service, args, arr);
        User.findOneAndUpdate({ slack_id: id }, update, { upsert: true }, function (err, user) {
            if (err) return reject(err);
            resolve(user);
        });
    });
}

/**
 * Removes a single user document
 * 
 * @param {int} id - specifies which document to update
 */
function remove(id) {
    return new Promise(function (resolve, reject) {
        User.findOneAndRemove({ slack_id: id }, function (err, user) {
            if (err || !user) return reject(err);
            resolve(user);
        });
    });
}

/**
 * CAREFUL - Removes all user documents
 */
function removeAll() {
    return new Promise(function (resolve, reject) {
        User.remove({}, function (err) {
            if (err) return reject(err);
            resolve();
        });
    });
}

/**
 * Creates the update JSON, specifies which field to update
 *
 * @param {string} service - The service to update (gsuite, github, etc)
 * @param {Object} args - The new object to be inserted at the specified path
 * @param {Array} arr - To handle nested paths
 * @return {Object} The finalized update parameter
 */
function updateParameter(service, args, arr) {
    let query = "tokens." + service;

    arr.forEach(function (path) {
        query += "." + path;
    });

    console.log(query);
    return { $set: { [query]: args } };
}

module.exports = {
    set: set,
    get: get,
    remove: remove,
    removeAll: removeAll
}