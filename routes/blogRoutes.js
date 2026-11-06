const express = require('express');
const router = express.Router();

const Blog = require('../models/blog');

const {isAuthenticated,isAdmin, isUser} = require('../middleware/auth');
const {uploadMedia, toMediaPayload, removeUpload} = require('../middleware/upload');


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
router.post('/blogform', isAuthenticated, uploadMedia, async (req, res) => {
    try {
        const newBlog = new Blog({
            title: req.body.title,
            description: req.body.description,
            author: req.user._id,
            media: toMediaPayload(req.file)
        });
        await newBlog.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        removeUpload(req.file ? `/uploads/${req.file.filename}` : null);
        res.status(500).render('blogform', {
            blogs: [],
            user: req.user,
            error: 'Something went wrong while saving your story. Please try again.'
        });
    }
});
// PUBLIC STORIES (approved only)
router.get('/stories', async (req, res) => {
    try {
        const dbStories = await Blog.find({ approveStatus: 'approved' })
            .populate('author', 'firstname lastname')
            .sort({ createdAt: -1 });

        const stories = dbStories.map((blog) => {
            const firstname = (blog.author && blog.author.firstname) || '';
            const lastname = (blog.author && blog.author.lastname) || '';
            const authorName = `${firstname} ${lastname}`.trim() || 'Anonymous';

            return {
                id: blog._id.toString(),
                title: blog.title,
                description: blog.description,
                authorName,
                initials: (firstname.charAt(0) + lastname.charAt(0)).toUpperCase() || 'A',
                date: blog.createdAt
                    ? blog.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '',
                mediaUrl: blog.media && blog.media.url ? blog.media.url : null,
                mediaType: blog.media && blog.media.type ? blog.media.type : null
            };
        });

        res.render('stories', { stories });
    } catch (error) {
        console.log(error);
        res.render('stories', { stories: [] });
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
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (deletedBlog && deletedBlog.media) {
            removeUpload(deletedBlog.media.url);
        }
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
