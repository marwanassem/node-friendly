const User = require('../models/user');
const mongoose = require('mongoose');
const { request } = require('express');

exports.exploreUsers = (req, res, next) => {
    User.find()
        .then(users => {
            res.render('user-interaction/explore', {
                users: users,
                pageTitle: 'Exploring!',
                isAuthenticated: req.session.isLoggedIn,
                loggedId: req.user._id.toString()
            })
        })
        .catch(err => {
            const error = new Error('No users found');
            return next(err);
        })
};

exports.addFriend = (req, res, next) => {
    const friendId = req.body.friendId;
    let username;
    const userId = req.user._id;
    let loggedUser;
    let friendUser;

    User.findById(userId)
        .then(user => {
            if (!user){
                const err = new Error('User not found')
                return next(err);
            }
            username = user.name;
            loggedUser = user;
        })
        .catch(err => {
            return next(err);
        });

    User.findById(friendId)
        .then(user => {
            if (!user){
                const err = new Error('User not found')
                return next(err);
            }
            console.log(typeof(req.user._id));
            user.pendingRequests.push({userId: req.user._id, name: username});
            friendUser = user;
            return user.save();
        })
        .then(result => {
            loggedUser.sentRequests.push({
                userId: friendUser._id,
                name: friendUser.name
            })
            return loggedUser.save();
        })
        .then(result => {
            return res.render('user-interaction/requests', {
                sentRequests: loggedUser.sentRequests,
                pendingRequests: loggedUser.pendingRequests,
                isAuthenticated: req.session.isLoggedIn,
                pageTitle: 'Your Friend Requests',
            });
        })
        .catch(err => {
           return next(err);
        })
};

exports.getRequests = (req, res, next) => {
    const userId = req.user._id;
    User.findById(userId)
        .then(user => {
            if (!user){
                const err = new Error('User not found');
                return next(err);
            }
            res.render('user-interaction/requests', {
                sentRequests: user.sentRequests,
                pendingRequests: user.pendingRequests,
                isAuthenticated: req.session.isLoggedIn,
                pageTitle: 'Your Friend Requests',
            })
        })
        .catch(err => {
            return next(err);
        })
};

exports.handleRequest = (req, res, next) => {
    let index;
    const userId = req.user._id;
    const mode = req.query.mode;
    const userSentReq = req.body.userSentReq;
    const requestId = req.body.requestId;

    User.findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('User not found.');
                return next(error);
            }
            for (i = 0; i < user.pendingRequests.length; i++){
                if (user.pendingRequests[i]._id.toString() === requestId.toString()) {
                    index = i;
                }
            }
            // user.pendingRequests.forEach(req => {
            //     if (user.pendingRequests._id.toString() === requestId.toString()){
            //         index = req.index;
            //     }
            // })
            user.pendingRequests.splice(index);
            // user.pendingRequests[index].
            if (mode === 'accept'){
                user.friends.push(userSentReq);
            }
            return user.save();
        })
        .then(result => {
            User.findById(userSentReq)
                .then(user => {
                    if (!user) {
                        const error = new Error('User not found.');
                        return next(error);
                    }
                    for (i = 0; i < user.sentRequests.length; i++){
                        if (user.sentRequests[i].userId.toString() === userId.toString()) {
                            index = i;
                        }
                    }
                    user.sentRequests.splice(index);
                    if (mode === 'accept'){
                        user.friends.push(userId);
                    }
                    return user.save();
                })
        })
        .then(result => {
            return res.redirect('/');
        })
        .catch(err => {
            return next(err);
        });
};