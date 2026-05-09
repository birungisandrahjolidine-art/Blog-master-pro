
// Dependencies
const express = require("express");
const expressSession = require("express-session");
const path = require('path');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo').default;


require('dotenv').config();
const connectDB = require('./config/db')

// import usermodel
const User = require('./models/User')
// 2.Instantiations
const app = express();
const port = 3000;
const passport = require('passport');
// 3.Configurations
connectDB();
// set templating engine to pug

app.set('view engine','pug');
app.set('views', path.join(__dirname,'views'))

// 4.Middleware

app.use(express.static(path.join(__dirname,'public')));
app.use('/public/uploads',express.static(__dirname+'/public/uploads'));
app.use(express.urlencoded({ extended: true })); //very important
app.use(
  expressSession({
    secret: "My secret",
    resave: false,
    saveUninitialized: false,
    store:MongoStore.create({
    mongoUrl:process.env.DATABASE,
    collectionName:'sessionStorage'
  }),
  cookie:{
    maxAge:1000*60*60*2 //2 hours life for a login session
  }
  }),
);

// This function call tells that more processing is
// required for the current request and is in the next middleware
//    function/route handler.
//    next();
// });
//Simple request time logger for a specific route
app.use("/home", (req, res, next) => {
  console.log("A new request received at " + Date.now());
  next();
});
app.use(passport.initialize());
app.use(passport.session());
// passport Configurations for salt and harshing passwords
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// global variables
app.use((req,res,next)=>{
  res.locals.user = req.user || null
  next();
})
// 5.Routes
app.use('/',require('./routes/authRoutes'))
app.use('/',require('./routes/blogRoutes'))


// this is the second last chunk of code:
app.use((req, res) => {
  res.status(404).send("oops !Route not found.");
});


// 6.Bootstrapping Server

// this is the last line of the code
app.listen(port, () => console.log(`listerning on port ${port}`));
