const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        default: 'I am new to the Network.',
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    pendingRequests: [{
        userId: Schema.Types.ObjectId,
        name: String
    }],
    sentRequests: [{
        userId: Schema.Types.ObjectId,
        name: String
    }]
});

module.exports = mongoose.model('User', userSchema);