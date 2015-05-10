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

    //TO DO : Make sure isLogedIn is called

    app.get('/profile', then(async(req, res) => {
        let post1 = new Post()
        let post2 = new Post()
        post1.title = "Post 1 title"
        post2.title = "Post 2 title"

        let posts
        let userId = req.user._id

        posts = await Post.promise.find({
            userId
        })

        console.log(posts)

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
            post.comments = [{
                "content": "this is good",
                "username": "trsrts",
                "date": "05/11/2015"
            }]
            console.log("During save :" + req.user.blogTitle)
            post.image.data = await fs.promise.readFile(file.path)
            post.image.contentType = file.headers['content-type']
            await post.save()


            res.redirect('/blog/' + encodeURI(req.user.blogTitle))
            return
        }

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
        await post.save()


        res.redirect('/blog/' + encodeURI(req.user.blogTitle))
        return

    }))

    app.get('/deletePost/:postId', then(async(req, res) => {
        let postId = req.params.postId
        console.log('Deleting the post id: ' + postId)
        let post = await Post.promise.findByIdAndRemove(postId)
        res.redirect('/profile')

    }))

    /*
     * Routes for /blog
     */

    app.get('/blog/:blogId?', then(async(req, res) => {
        let blogTitle = req.params.blogId
        //get all the posts by this user
       
        let userByBlogTitle = await User.promise.findOne({'blogTitle':blogTitle})

        // now get all the posts created by this user
        console.log("User Id :" + userByBlogTitle._id)
        let userId = userByBlogTitle._id
        let postsByThisUser  = await Post.promise.find({'userId': userId})
         console.log(postsByThisUser)
        res.render('blog.ejs', {
            blogTitle: userByBlogTitle.blogTitle,
            posts : postsByThisUser
        })
    }))



    /*  
     *Logout
     */
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });


}

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next()
    res.redirect('/')
}
