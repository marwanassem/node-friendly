const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sendGridTransport = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator/check');
const { render } = require('ejs');
const post = require('../models/post');


const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: 
        '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',
    }
}));


exports.getSignup = (req, res, next) => {
    return res.render('auth/signup', {
        pageTitle: 'Please Signup',
        errorMessage: null,
        isAuthenticated: req.session.isLoggedIn,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: '',
            name: ''
        },
        validationErrors: []
    })
};

exports.postSignup = (req, res, next) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
        return res.render('auth/signup', {
            pageTitle: 'Please Signup',
            errorMessage: errors.array()[0].msg,
            isAuthenticated: req.session.isLoggedIn,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword,
                name: name
            },
            validationErrors: errors.array()
        })
    }

    bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = User({
                name: name,
                email: email,
                password: hashedPassword,
                posts: []
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login');
            return transporter.sendMail({
                to: email,
                from: 'marwan.assem1@gmail.com',
                subject: 'Signing up completed.',
                html: `
                <h1> Thank you for signing up at our Friendly Network app.</h1>
                <p> We're looking forward to hear back from you. </p>
                `
            })
        })
        .catch(err => {
            console.log(err);
        })
};

exports.getLogin = (req, res, next) => {
    return res.render('auth/login', {
        pageTitle: 'Please Login',
        errorMessage: null,
        isAuthenticated: req.session.isLoggedIn
    })
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    User.findOne({email: email})
        .then(user => {
            if (!user){
                return res.render('auth/login', {
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password',
                    oldInput: { email: email, password: password },
                    validationErrors: []
                });
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            res.redirect('/');
                        });
                    }
                    return res.render('auth/login', {
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email or password',
                        oldInput: { email: email, password: password },
                        validationErrors: []
                    });
                })
        })
        .catch(err => {
            console.log(err);
        })
};

exports.postLogout = (req, res, next) => {
    req.session.destroy((err) => {
        console.log(err);
        res.redirect('/');
    });
};