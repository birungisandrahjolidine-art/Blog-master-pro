const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    url: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['image', 'video']
    },
    originalName: {
        type: String,
        trim: true
    },
    size: {
        type: Number
    }
}, { _id: false });

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    approveStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    media: mediaSchema

}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);