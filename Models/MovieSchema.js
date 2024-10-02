const mongoose = require('mongoose');

const celebSchema = new mongoose.Schema({
    celebType: String,
    celebName: String,
    celebRole: String,
    celebImage: String
});

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true // no duplicate titles
    },
    description: {
        type: String,
        required: true
    },
    portraitImgUrl: {
        type: String,
        required: true
    },
    landscapeImgUrl: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    genre: {
        type: [String],
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    cast: {
        type: [celebSchema],
        default: []
    },
    crew: {
        type: [celebSchema],
        default: []
    }
}, { timestamps: true }); // track movie creation and updates

movieSchema.index({ title: 1 }); // for faster queries

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
