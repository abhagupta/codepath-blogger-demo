let mongoose = require('mongoose')
let bcrypt = require('bcrypt')
let nodeify = require('bluebird-nodeify')

let UserSchema = mongoose.Schema({
	username: {
		type:String,
		required: true
	},
    email: {
    	type:String,
    	required: true	
    },
    password: {
    	type:String,
    	required: true	
    },
    blogTitle: {
    	type:String,
    	required: false	
    } ,
    blogDescription: {
    	type:String,
    	required: false	
    } 

})


UserSchema.methods.generateHash = async function(password) {
	return await bcrypt.promise.hash(password, 8)
}

UserSchema.methods.validatePassword = async function (password) {
	return await bcrypt.promise.compare(password, this.password)
}


UserSchema.pre('save', function(callback){
	nodeify(async() => {
		if(this.isModified('password')) {
			this.password = await this.generateHash(this.password)
		}
		console.log('Saving data')
		
	}(), callback)																
})


UserSchema.path('password').validate((pw) => {
	return pw.length >= 4 && /[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)
})

module.exports = mongoose.model('User', UserSchema)