const mongoose = require('mongoose');
const Post = require('../models/post');
const User = require('../models/user');
const Comment = require('../models/comment');
const fileHelper = require('../utils/file');
const { validationResult } = require('express-validator/check');
const post = require('../models/post');

exports.getPosts = (req, res, next) => {
    Post.find().populate('userId')
        .then(posts => {
            res.render('post/index', {
                posts: posts,
                pageTitle: 'Home',
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch(err => {
            return next(err);
        });
};

exports.getAddPost = (req, res, next) => {
    res.render('post/post', {
        pageTitle: 'Add Post',
        editing: false,
        path: 'add-post',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: null,
        oldInput: {
            title: '',
            imageUrl: '',
            content: ''
        }
    });
};

exports.postAddPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path;
    const errors = validationResult(req);
    let createdUser;

    if (!errors.isEmpty()) {
        return res.render('post/post', {
            pageTitle: 'Add Post',
            editing: false,
            path: 'add-post',
            isAuthenticated: req.session.isLoggedIn,
            oldInput: {
                title: title,
                imageUrl: req.file,
                content: content
            },
            errorMessage: errors.array()[0].msg
        });
    }

    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        userId: req.user._id
    });
    post.save()
        .then(result => {
            return User.findById(req.user._id);
        })
        .then(user => {
            user.posts.push(post);
            return user.save();
        })
        .then(result => {
            return res.redirect('/');
        })
        .catch(err => {
            return next(err);
        });
};

exports.viewPost = (req, res, next) => {
    const postId = req.params.postId;
    let postComments
    Comment.find({postId: postId}).populate('userId')
        .then(comments => {
            return postComments = [...comments];
        }).then(result=> {
            Post.findById(postId)
                .then(post => {
                    if (!post) {
                        const error = new Error('No post found');
                        return next(error);
                    }
                    return res.render('post/post-detail', {
                        post: post,
                        pageTitle: 'Post detail',
                        isAuthenticated: req.session.isLoggedIn,
                        comments: postComments,
                        user: req.user
                    });
                })
        })
        .catch(err => {
            return next(err);
        });
};

exports.deletePost = (req, res, next) => {
    const postId = req.body.postId;
    let userId;
    Post.findById(postId)
        .then(post => {
            if (!post){
                console.log('Post not found');
            }
            if (post.userId.toString() !== req.user._id.toString()) {
                const error = new Error('Unauthorized');
                return next(error);
            }
            fileHelper.deleteFile(post.imageUrl);
            userId = post.userId;
            return Post.deleteOne({_id: postId});
        })
        .then(result => {
            return User.findById(userId)
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save()
        })
        .then(result => {
            return res.redirect('/');
        })
        .catch(err => {
            return next(err);
        })
};

exports.getEditPost = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const postId = req.params.postId;
    Post.findById(postId)
        .then(post => {
            if (!post) {
                console.log('post not found');
                return res.redirect('/');
            }

            return res.render('post/post', {
                editing: editMode,
                pageTitle: 'Edit Post',
                post: post,
                path: 'edit-post',
                isAuthenticated: req.session.isLoggedIn
            })
        })
        .catch(err => {
            return next(err);
        })
};

exports.postEditPost = (req, res, next) => {
    const updatedTitle = req.body.title;
    const updatedContent = req.body.content;
    const updatedImage = req.file;

    const postId = req.body.postId;
    Post.findById(postId)
        .then(post => {
            if (updatedImage){
                fileHelper.deleteFile(post.imageUrl);
                post.imageUrl = updatedImage.path;
            }
            post.title = updatedTitle;
            post.content = updatedContent;
            return post.save();
        })
        .then(result => {
            return res.redirect('/'+ postId.toString());
        })
        .catch(err => {
            console.log(err);
        })
};

exports.addComment = (req, res, next) => {
    const userId = req.user._id;
    const postId = req.body.postId;
    const commentContent = req.body.comment;
    let foundPost;
   
    Post.findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Post not found.')
                return next(error);
            }
            const comment = new Comment({
                content: commentContent,
                postId: postId,
                userId: userId
            })
            foundPost = post;
            return comment.save();
        })
        .then(comment => {
            foundPost.comments.push(comment._id);
            return foundPost.save();
        })
        .then(result => {
            return Comment.find({postId: postId}).populate('userId')
        })
        .then(comments => {
            return res.render('post/post-detail', {
                post: foundPost,
                pageTitle: 'Post detail',
                isAuthenticated: req.session.isLoggedIn,
                comments: comments,
                user: req.user
            })
        })
        .catch(err => {
            return next(err);
        });
};

exports.deleteComment = (req, res, next) => {
    // NEED TO FIX A BUG !!!!!
    const postId = req.params.postId;
    const commentId = req.params.commentId;
    let commentsId;
    let comments = [];
    let post;
    Comment.findById(commentId)
        .then(comment => {
            if (!comment){
                return next(new Error('Comment not found'))
            }
            return Comment.deleteOne({_id: commentId, userId: req.user._id}); 
        })
        .then(() => {
            console.log('Deleted.');
            return Post.findById(postId)
                .then(post => {
                    if (!post) {
                        const error = new Error('Post not found.');
                        return next(error);
                    }
                    for (i = 0; i < post.comments.length; i++){
                        if (post.comments[i]._id.toString() === commentId){
                            index = i;
                        }
                    }
                    post.comments.slice(index);
                    return post.save();
                })
                .then(savedPost => {
                     post = savedPost;
                    let comments = [];
                    commentsId = savedPost.comments;
                    for (i = 0; i < commentsId.length; i++){
                        Comment.findById(commentsId[i])
                            .then(comment => {
                                comments.push(comment);
                            })
                            return comments;
                    }
                })
                .then(() => {
                    return res.render('post/post-detail', {
                        post: post,
                        pageTitle: 'Post detail',
                        isAuthenticated: req.session.isLoggedIn,
                        comments: comments,
                        user: req.user
                    })
                })
        })
        .catch(err => {
            return next(err);
        }); 
};