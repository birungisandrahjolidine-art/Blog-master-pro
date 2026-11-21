// Dependencies
const express = require("express");
const expressSession = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo").default;

require("dotenv").config();
const connectDB = require("./config/db");

// import usermodel
const User = require("./models/user");

// 2. Instantiations
const app = express();
const port = process.env.PORT || 3000;
const passport = require("passport");

app.get("/", (req, res) => {
  res.redirect("/home"); // Change "/home" to "/login" if login is your first page
});
// 3. Configurations
connectDB();
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// 4. Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use("/public/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use(express.urlencoded({ extended: true }));

app.use(
  expressSession({
    secret: process.env.SESSION_SECRET || "My secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE,
      collectionName: "sessionStorage",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 2, // 2 hours life for a login session
    },
  })
);

app.use("/home", (req, res, next) => {
  console.log("A new request received at " + Date.now());
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// 5. Routes
app.use("/", require("./routes/authRoutes"));
app.use("/", require("./routes/blogRoutes"));

app.use((req, res) => {
  res.status(404).send("oops !Route not found.");
});

// 6. Bootstrapping Server
app.listen(port, () => console.log(`listening on port ${port}`));
