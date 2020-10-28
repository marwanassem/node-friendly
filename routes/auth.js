const express = require('express');

const router = express.Router();

const authController = require('../controllers/auth');
const { body } = require('express-validator/check');
const User = require('../models/user');


router.get('/signup', authController.getSignup);
router.post(
    '/signup', 
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom(value => {
                return User.findOne({email:value}).then(user => {
                  if (user) {
                    return Promise.reject('E-mail already in use');
                  }
                })
            })
            ,

        body('password', 'Please enter a password with atleast 5 characters.')
            .isLength({ min: 5})
            .trim(),

        body('confirmPassword')
            .trim()
            .custom((value, {req}) => {
                if (value !== req.body.password) {
                    throw new Error('Passwords must match!');
                }
                return true;
            }),

        body('name')
            .trim()
            .not().isEmpty()
    ],
    authController.postSignup);

router.get('/login', authController.getLogin);

router.post(
    '/login', [
        body('email')
            .isEmail()
            .normalizeEmail(),

        body('password')
            .not().isEmpty()
            .trim()
    ],
    authController.postLogin);

router.post('/logout', authController.postLogout);

module.exports = router;
