let isLoggedIn = require('./middleware/isLoggedIn')
let User = require('./models/User')
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

    /*
     * Routes for /login
     */

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

    /*
     * Routes for /signup
     */

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

    /*
     * Routes for /profile
     */

    app.get('/profile', isLoggedIn, then(async(req, res) => {

        let posts
        let userId = req.user._id

        posts = await Post.promise.find({
            userId
        })

        for (let i = 0; i < posts.length; i++) {
            if (posts[i].image) {
                let datauri = new DataUri
                let image = datauri.format('.' + posts[i].image.contentType.split('/').pop(), posts[i].image.data)
                posts[i].displayImage = `data:${posts[i].image.contentType};base64,${image.base64}`
            }
        }

        res.render('profile.ejs', {
            user: req.user,
            posts: posts,
            message: req.flash('error')
        })
    }))

    /*
     * Routes for /post/:postId
     */

    app.get('/post/:postId?', then(async(req, res) => {
        let postId = req.params.postId

        if (!postId) {
            res.render('post.ejs', {
                post: {},
                verb: 'Create'

            })
            return
        }

        let post = await Post.promise.findById(postId)
        if (!post) res.send(404, 'Not Found')

        let datauri = new DataUri
        let image = datauri.format('.' + post.image.contentType.split('/').pop(), post.image.data)
        res.render('post.ejs', {
            post: post,
            verb: 'Edit',
            image: `data:${post.image.contentType};base64,${image.base64}`
        })
    }))

    app.post('/post/:postId?', then(async(req, res) => {
        let postId = req.params.postId
        if (!postId) {
            let post = new Post()

            let [{
                title: [title],
                content: [content]
            }, {
                image: [file]
            }] = await new multiparty.Form().promise.parse(req)
            post.title = title
            post.content = content
            post.userId = req.user._id
            post.image.data = await fs.promise.readFile(file.path)
            post.image.contentType = file.headers['content-type']
            await post.save()
            res.redirect('/blog/' + encodeURI(req.user.blogTitle))
            return
        }

        // Edit Post

        let post = await Post.promise.findById(postId)
        if (!post) res.send(404, 'Not Found')

        let [{
            title: [title],
            content: [content]
        }, {
            image: [file]
        }] = await new multiparty.Form().promise.parse(req)
        post.title = title
        post.content = content
        post.userId = req.user._id
        post.image.data = await fs.promise.readFile(file.path)
        post.image.contentType = file.headers['content-type']
        await post.save()


        res.redirect('/blog/' + encodeURI(req.user.blogTitle))
        return

    }))

    app.get('/deletePost/:postId', then(async(req, res) => {
        let postId = req.params.postId
        let post = await Post.promise.findByIdAndRemove(postId)
        res.redirect('/profile')

    }))

    /*
     * Routes for /blog
     */

    app.get('/blog/:blogId?', then(async(req, res) => {
        let blogTitle = req.params.blogId
            //get all the posts by this user

        let userByBlogTitle = await User.promise.findOne({
            'blogTitle': blogTitle
        })

        // now get all the posts created by this user
        let userId = userByBlogTitle._id
        let postsByThisUser = await Post.promise.find({
            'userId': userId
        })
        for (let i = 0; i < postsByThisUser.length; i++) {
            if (postsByThisUser[i].image) {
                let datauri = new DataUri
                let image = datauri.format('.' + postsByThisUser[i].image.contentType.split('/').pop(), postsByThisUser[i].image.data)
                postsByThisUser[i].displayImage = `data:${postsByThisUser[i].image.contentType};base64,${image.base64}`
            }
        }
        res.render('blog.ejs', {
            blogTitle: userByBlogTitle.blogTitle,
            posts: postsByThisUser
        })
    }))

    /*
     *  Routes for /comment
     */


    app.post('/addComment/:postId', isLoggedIn, then(async(req, res) => {
        let postId = req.params.postId
        let post = await Post.promise.findById(postId)
        if (!post) res.send(404, 'Not Found')

        let comment = req.body.comment

        let newComment = {
            "content": comment,
            "username": req.user.username,
            "date": Date()
        }

        post.comments.push(newComment)

        await post.save()
        res.redirect(req.get('referer'))

        // res.redirect('/blog/' + encodeURI(req.user.blogTitle))
        return

    }))

    /*  
     *Logout
     */
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
}
