const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user'); 

router.get('/index', (req, res) => {
    res.render('index');
});
router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/logout', (req, res) => {
    res.render('logout');
});
router.post('/register', async (req, res) => {
    try {
        const { firstname, lastname, email, role, password } = req.body;
        const existingUser = await User.findOne({
            email: email.toLowerCase()
        });
        if (existingUser) {
            return res.render('register', {
                error: 'Email already exists'
            });
        }
        const newUser = new User({
            firstname,
            lastname,
            email: email.toLowerCase(),
            role
        });
        await User.register(newUser, password); 
        res.redirect('/register');
    } catch (error) {
        console.log(error);
        res.render('register', {
            error: 'Something went wrong'
        });
    }
});

router.get('/login', (req, res) => {
    res.render('login', {
        error: req.query.error === '1'
            ? 'That email and password combination did not work. Please try again.'
            : null
    });
});

router.post(
    '/login',
    passport.authenticate('local', { failureRedirect: '/login?error=1' }),
    (req, res) => {
        if (req.user.role === 'admin') {
            res.redirect('/dashboard');
        } else if (req.user.role === 'user') {
            res.redirect('/blogform');
        } else {
            res.redirect('/index');
        }
    }
);


module.exports = router;