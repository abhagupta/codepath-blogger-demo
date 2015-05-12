let LocalStrategy = require('passport-local').Strategy
let nodeifyit = require('nodeifyit')
let User = require('../models/User')
let util = require('util')

module.exports = (app) => {
    let passport = app.passport

    // passport.serializeUser(function(user, done) {
    //         done(null, user._id)
    //     })
    //     // passport.deserializeUser(nodeifyit(async(id) => user))


    // passport.deserializeUser(function(id, done) {
    //     User.findById(id, function(err, user) {
    //         done(err, user);
    //     });
    // });

    passport.serializeUser(nodeifyit(async(user) => user._id))
    passport.deserializeUser(nodeifyit(async(id) => {
        return await User.promise.findById(id)
    }))


    passport.use(new LocalStrategy({
        usernameField: 'username',
        failureFlash: true

    }, nodeifyit(async(username, password) => {
        let user
       
        let email
        if (username.indexOf('@') >= 0) {

            email = username.toLowerCase()
            user = await User.promise.findOne({
                email
            })
        } else {

            let regexp = new RegExp(username, 'i')
            user = await User.promise.findOne({
                username: {
                    $regex: regexp
                }
            })

        }

        if (!email) {
            if (!user || username != user.username) {
                return [false, {
                    message: 'Invalid username'
                }]
            }
        } else {
            if (!user || email != user.email) {
                return [false, {
                    message: 'Invalid email'
                }]
            }
        }



        if (!await user.validatePassword(password)) {
            return [false, {
                message: 'Invalid password'
            }]
        }
        return user
    }, {
        spread: true
    })))

    /*
     * Passport local strategy for signup
     */

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        failureFlash: true,
        passReqToCallback: true
    }, nodeifyit(async(req, email, password) => {

        /* Do email query */
        email = (email || '').toLowerCase()
        if (await User.promise.findOne({
                email
            })) {
            return [false, "That email is already taken."]
        }

        /* set username, title, description from request body to same name parameters*/
        let {
            username, title, description
        } = req.body

        /* Do username query*/
        let regexp = new RegExp(username, 'i')
        let query = {
            username: {
                $regex: regexp
            }
        }

        if (await User.promise.findOne(query)) {
            return [false, {
                message: 'That username is already taken. '
            }]
        }


        let user = new User()
        user.email = email
        user.username = username
        user.blogTitle = title
        user.blogDescription = description

        user.password = password
        try {
            return await user.save()

        } catch (e) {
            //console.log(util.inspect(e))
            return [false, {
                message: e.message
            }]
        }

        return await user.save()
    }, {
        spread: true
    })))

}
