const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { safeNext } = require('../middleware/auth');

// Where to send the visitor once they are signed in.
router.get('/login', (req, res) => {
    res.render('login', {
        next: safeNext(req.query.next),
        error: req.query.error === '1'
            ? 'That email and password combination did not work. Please try again.'
            : null
    });
});

router.post('/login', (req, res, next) => {
    const target = safeNext(req.body.next);

    passport.authenticate('local', (err, user) => {
        if (err) return next(err);

        if (!user) {
            const retry = target ? `&next=${encodeURIComponent(target)}` : '';
            return res.redirect(`/login?error=1${retry}`);
        }

        req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            if (target) return res.redirect(target);
            if (req.user.role === 'admin' || req.user.role === 'user') {
                return res.redirect('/dashboard');
            }
            return res.redirect('/index');
        });
    })(req, res, next);
});

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
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.render('register', {
            error: 'Something went wrong'
        });
    }
});

module.exports = router;