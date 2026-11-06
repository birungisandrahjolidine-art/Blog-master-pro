const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Blog = require('../models/blog');

const {isAuthenticated,isAdmin, isUser} = require('../middleware/auth');
const {uploadMedia, toMediaPayload, removeUpload} = require('../middleware/upload');

// Rough reading estimate — average adult reads ~200 words per minute
const readingTime = (text) => {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
};

// Admins can manage every story; authors can manage their own
const canManageBlog = (blog, user) => {
    if (!blog || !user) return false;
    if (user.role === 'admin') return true;
    return Boolean(blog.author) && blog.author.toString() === user._id.toString();
};

// Shapes a blog document into the plain object the story views use
const toStoryView = (blog) => {
    const firstname = (blog.author && blog.author.firstname) || '';
    const lastname = (blog.author && blog.author.lastname) || '';
    const title = (blog.title || '').trim() || 'Untitled story';

    return {
        id: blog._id.toString(),
        title,
        category: title,
        description: blog.description,
        excerpt: String(blog.description || '').replace(/\s+/g, ' ').trim(),
        readTime: readingTime(blog.description),
        authorName: `${firstname} ${lastname}`.trim() || 'Anonymous',
        initials: (firstname.charAt(0) + lastname.charAt(0)).toUpperCase() || 'A',
        date: blog.createdAt
            ? blog.createdAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : '',
        isoDate: blog.createdAt ? blog.createdAt.toISOString() : '',
        mediaUrl: blog.media && blog.media.url ? blog.media.url : null,
        mediaType: blog.media && blog.media.type ? blog.media.type : null
    };
};


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

        const stories = dbStories.map(toStoryView);

        res.render('stories', { stories });
    } catch (error) {
        console.log(error);
        res.render('stories', { stories: [] });
    }
});

// PUBLIC SINGLE STORY (approved only)
router.get('/stories/:id', async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).render('story', { story: null });
    }

    try {
        const blog = await Blog.findOne({
            _id: req.params.id,
            approveStatus: 'approved'
        }).populate('author', 'firstname lastname');

        if (!blog) {
            return res.status(404).render('story', { story: null });
        }

        res.render('story', { story: toStoryView(blog) });
    } catch (error) {
        console.log(error);
        res.status(500).render('story', { story: null });
    }
});

router.get('/dashboard', isAuthenticated, async (req, res) => {
    const isAdminUser = req.user.role === 'admin';
    const emptyDashboard = {
        user: req.user,
        dbBlogs: [],
        pendingBlogs: [],
        reviewedBlogs: [],
        stats: { pending: 0, approved: 0, rejected: 0 }
    };

    try {
        const dbBlogs = await Blog.find(isAdminUser ? {} : { author: req.user._id })
            .populate('author', 'firstname lastname')
            .sort({ createdAt: -1 });
        const stats = dbBlogs.reduce((counts, blog) => {
            if (Object.prototype.hasOwnProperty.call(counts, blog.approveStatus)) {
                counts[blog.approveStatus] += 1;
            }
            return counts;
        }, { pending: 0, approved: 0, rejected: 0 });

        res.render('dashboard', {
            user: req.user,
            dbBlogs,
            pendingBlogs: isAdminUser
                ? dbBlogs.filter(blog => blog.approveStatus === 'pending')
                : [],
            reviewedBlogs: isAdminUser
                ? dbBlogs.filter(blog => blog.approveStatus !== 'pending')
                : [],
            stats
        });
    } catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).render('dashboard', {
            ...emptyDashboard,
            error: 'We could not load your stories. Please refresh and try again.'
        });
    }
});

router.post('/blogs/update/:id', isAuthenticated, async (req, res) => {
    try {
        const { title, description } = req.body;
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Blog entry not found');
        if (!canManageBlog(blog, req.user)) {
            return res.status(403).send('Access denied: you can only edit your own stories');
        }
        blog.title = title;
        blog.description = description;
        // A rejected story goes back into the review queue when its author revises it
        if (req.user.role !== 'admin' && blog.approveStatus === 'rejected') {
            blog.approveStatus = 'pending';
        }
        await blog.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Update failed");
    }
});
// DELETE BLOG
router.post('/blogs/delete/:id', isAuthenticated, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Blog entry not found');
        if (!canManageBlog(blog, req.user)) {
            return res.status(403).send('Access denied: you can only delete your own stories');
        }
        await blog.deleteOne();
        if (blog.media) {
            removeUpload(blog.media.url);
        }
        res.redirect('/dashboard');
    } catch (error) {
        console.log(error);
        res.send('Error deleting blog');
    }
});
// A. GET the Edit Page
router.get('/blogs/edit/:id', isAuthenticated, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) return res.status(404).send('Blog entry not found');
        if (!canManageBlog(blog, req.user)) {
            return res.status(403).send('Access denied: you can only edit your own stories');
        }
        res.render('editblog', { blog, user: req.user });
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
