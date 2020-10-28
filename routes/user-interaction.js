const express = require('express');

const router = express.Router();

const interactionController = require('../controllers/user-interaction');
const isAuth = require('../middlewares/is-auth');
const User = require('../models/user');

router.get('/explore', interactionController.exploreUsers);
router.post('/add-friend', interactionController.addFriend);
router.get('/requests', interactionController.getRequests);
router.post('/handle-request', interactionController.handleRequest);

module.exports = router;
