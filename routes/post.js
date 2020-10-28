const express = require('express');

const router = express.Router();

const postController = require('../controllers/post');
const isAuth = require('../middlewares/is-auth');
const { body } = require('express-validator/check');


router.get('/', isAuth, postController.getPosts);
router.get('/add-post', isAuth, postController.getAddPost);
router.post(
    '/add-post', [
        body('title').isLength({min: 5}).
        withMessage('Title must be atleast of 5 characters').trim(),

        body('content').isLength({min: 5, max:400})
        .withMessage('Content must be atleast 5 characters and maximum of 400.').trim()
    ], 
    isAuth, 
    postController.postAddPost);
    
router.get('/:postId', isAuth, postController.viewPost);
router.post('/delete-post', isAuth, postController.deletePost);
router.get('/:postId/edit-post', isAuth, postController.getEditPost);

router.post(
    '/edit-post', [
        body('title').isLength({min: 5}).
        withMessage('Title must be atleast of 5 characters').trim(),

        body('content').isLength({min: 5, max:400})
        .withMessage('Content must be atleast 5 characters and maximum of 400.').trim()
    ], 
    isAuth, postController.postEditPost);

module.exports = router;