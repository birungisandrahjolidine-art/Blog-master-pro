const express = require('express');
const router = express.Router();

const Blog = require('../models/blog');

const {isAuthenticated,isAdmin, isUser} = require('../middleware/auth');


// VIEW BLOGS
router.get('/blogform', isAuthenticated, async (req, res) => {
    try {
        const blogs = await Blog.find().populate('author');
        res.render('blogform', {
            blogs,
            user: req.user
        });
    } catch (error) {
        console.log(error);
        res.send('Error loading blogs');
    }
});
// CREATE BLOG
router.post('/blogform', isAuthenticated, async (req, res) => {
    try {
        const newBlog = new Blog({
            title: req.body.title,
            description: req.body.description,
            author: req.user._id
        });
        await newBlog.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.send('Error creating blog');
    }
});
router.get("/dashboard", async (req, res) => {
  try {
    const dbBlogs = await Blog.find()
      .populate('author', 'firstname lastname')
      .sort({ date: -1 });

    res.render("dashboard", { dbBlogs }); 
  } catch (error) {
    console.error(error);
    res.render("dashboard", { dbBlogs: [] }); 
  }
});

router.post('/blogs/update/:id', isAuthenticated, async (req, res) => {
    try {
        const { title, description } = req.body;
        await Blog.findByIdAndUpdate(req.params.id, {
            title: title,
            description: description
        });
        res.redirect('/dashboard'); 
    } catch (error) {
        console.error(error);
        res.status(500).send("Update failed");
    }
});
// DELETE BLOG
router.post('/blogs/delete/:id', isAuthenticated, async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.send('Error deleting blog');
    }
});
// A. GET the Edit Page
router.get('/blogs/edit/:id', isAdmin, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Blog entry not found')
        res.render('editBlog', { blog, user: req.user });
    } catch (error) {
        console.log(error);
        res.send('Error loading edit form');
    }
});

// Approving Status of blogs
router.post('/blogs/status/:id', isAdmin, async (req, res) => {
    try {
        await Blog.findByIdAndUpdate(req.params.id, {
            approveStatus: req.body.status
        });
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.send('Error updating status');
    }
});
module.exports = router;
