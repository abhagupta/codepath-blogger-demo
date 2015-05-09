let isLoggedIn = require('./middleware/isLoggedIn')
let user = require('./models/User')
let multiparty = require('multiparty')
let then = require('express-then')
let Post = require('./models/post')
let fs = require('fs')
let DataUri = require('datauri')

module.exports = (app) => {

    let passport = app.passport

    app.get('/', function(req, res) {
        res.render('index.ejs');
    })

    app.get('/login', function(req, res) {
        res.render('login.ejs', {
            message: req.flash('error')
        });
    })

    app.post('/login', passport.authenticate('local', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/signup', function(req, res) {
        res.render('signup.ejs', {
            message: req.flash('error')
        });
    })

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    //TO DO : Make sure isLogedIn is called

    app.get('/profile', (req, res) => res.render('profile.ejs', {
        user: req.user,
        message: req.flash('error')
    }))

    app.get('/post/:postId?', then( async (req, res) =>  {
    	let postId = req.params.postId
    	if(!postId){
    		res.render('post.ejs',{
    			post: {},
    			verb: 'Create'
    		})
    		return
    	}

    	let post = await Post.promise.findById(postId)
    	if (!post) res.send(404, 'Not Found')

    	let datauri = new DataUri
    	let image = datauri.format('.'+post.image.contentType.split('/').pop(), post.image.data)
		res.render('post.ejs',{
			post: post,
			verb: 'Edit',
			image: `data:${post.image.contentType};base64,${image.base64}`
		})
    }))

    app.post('/post/:postId?', then(async (req, res) =>  {
    	let postId = req.params.postId
    	if(!postId){
    		let post = new Post()

    		let [{title: [title], content: [content]}, {image:[file]}] = await new multiparty.Form().promise.parse(req)
    		post.title = title
    		post.content  = content
    		post.userId = req.user._id
    		post.comments = ["this is good", "trsrts"]

    		post.image.data = await fs.promise.readFile(file.path)
    		post.image.contentType = file.headers['content-type']
    	    await post.save()
    	    res.redirect('/blog/' + encodeURI(req.user.blogTitle))
    	    return
    	}

    	let post = await Post.promise.findById(postId)
    	if (!post) res.send(404, 'Not Found')

        let [{title: [title], content: [content]}, {image:[file]}] = await new multiparty.Form().promise.parse(req)
    	post.title = title
		post.content  = content
		await post.save()
	    res.redirect('/blog/' + encodeURI(req.user.blogTitle))
	    return

    }))

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}
