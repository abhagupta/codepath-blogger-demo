let mongoose = require('mongoose')

let PostSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    image: {
        data: Buffer,
        contentType: String
    },

    userId: {
        type: String
    },

    comments: [{
        username: String,
        content: String,
        date: Date
    }]
})

module.exports = mongoose.model('Post', PostSchema)
