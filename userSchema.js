"use strict";

const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let userSchema = new Schema({
    slack_id: String,
    tokens: {
        gsuite: {
            access_token: Schema.Types.Object,
            refresh_token: String
        },
        github: {
            access_token: Schema.Types.Object,
            refresh_token: String
        }
    }
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);