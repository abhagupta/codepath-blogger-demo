let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')

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
    }
})

module.exports = mongoose.model('Post', PostSchema)