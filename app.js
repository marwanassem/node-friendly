// installed packages
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

// Built-in packages
const path = require('path');

// project files
const postRoutes = require('./routes/post');
const authRoutes = require('./routes/auth');
const interactionRoutes = require('./routes/user-interaction');
const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'views');

const MONGODB_URI = 
'mongodb+srv://Marwan:m_mongodb@cluster0.14k92.mongodb.net/friendly?retryWrites=true&w=majority';

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg') 
        {
        cb(null, true);
        } else {
            cb(null, false);    
        }
};

const store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions',
})


// Middlewares
app.use(bodyParser.urlencoded({extended: false}));
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
}));
app.use((req, res, next) => {
    if (!req.session.user){
        return next();
    }
    User.findById(req.session.user._id)
    .then(user => {
        if (!user){
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
    });
});


// Defining Routes
app.use(authRoutes);
app.use(interactionRoutes);
app.use(postRoutes);
app.use(errorController.get404);
app.get('/500', errorController.get500);

app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).render('500', { 
        pageTitle: 'Error!', 
        path:'/500',
        error:error,
        isAuthenticated: req.session.isLoggedIn,
     });
});

mongoose
    .connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true})
    .then(result => {
        console.log('Connected');
        app.listen(process.env.PORT || 3000);
    })
    .catch(err => console.log(err));