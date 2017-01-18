var _ = require('lodash')
var passport = require('passport')
var request = require('request')
var LocalStrategy = require('passport-local').Strategy
var GitHubStrategy = require('passport-github').Strategy
var MeetupStrategy = require('passport-meetup').Strategy

var jwt = require('jsonwebtoken')

var jwtsecret = process.env.JWT_SECRET || 'sUp3r$3creT'

var defaultHeaders = require('../../config/defaultGithubAPIHeaders')
var User = require('../../models/Users')

passport.serializeUser(function (user, done) {
  done(null, user.id)
})

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

/**
 * Sign in with GitHub.
 */
// console.log('process.env.GITHUB_ID',process.env.GITHUB_ID)
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_ID || 'be1b409d62f41a56684c',
  clientSecret: process.env.GITHUB_SECRET || '15b3e064eb512ed185f4e9a40e38cba5f1db594d',
  callbackURL: '/auth/github/callback',
  passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
  var url = 'https://api.github.com/user/emails'
  var headers = _.cloneDeep(defaultHeaders)
  headers['Authorization'] += accessToken
  var options = {
    url: url,
    headers: headers
  }
  request(options, function (err, response, body) {
    if (err) console.error(err)
    if (!err && response.statusCode === 200) {
      var tokens = response.headers['x-oauth-scopes']
      profile.emails = JSON.parse(response.body)
      if (req.user) {
        // console.log('req.user')
        User.findOne({ github: profile.id }, function (err, existingUser) {
          if (err) console.error(err)
          User.findById(req.user.id, function (err, user) {
            if (err) console.error(err)
            user.github = profile.id
            user.email = (_.filter(profile.emails, (email) => {
              return email.primary
            })[0] || {}).email
            user.username = profile.username
            user.tokens = _.reject(user.tokens, {kind: 'github'})
            user.tokens.push({ kind: 'github', accessToken: accessToken })
            user.profile.name = user.profile.name || profile.displayName
            user.profile.picture = user.profile.picture || profile._json.avatar_url
            user.profile.location = user.profile.location || profile._json.location
            user.profile.website = user.profile.website || profile._json.blog
            if (!user.createdAt || user.createdAt === '') user.createdAt = new Date('2016-10-17T02:20:59.089Z')
            user.lastLoggedIn = new Date()
            user.scopes = tokens
            if (user.scopes[0].indexOf(',') > -1) {
              user.scopes = user.scopes[0].split(', ')
            }
            User.count({}, function (err, count) {
              if (err) console.error(err)
              if (!count) {
                user.roles = {
                  read: true,
                  blog: true,
                  project: true,
                  lead: true,
                  core: true,
                  coreLead: true,
                  superAdmin: true
                }
              }
              user.jwt = jwt.sign({github: user.github}, jwtsecret)
              user.save(function (err) {
                if (err) console.error(err)
                req.flash('info', { msg: 'GitHub authorization provided.' })
                req.analytics.track({
                  userId: user.username,
                  event: 'User Logged In',
                  properties: {
                    roles: JSON.stringify(user.roles)
                  }
                })
                done(err, user)
              })
            })
          })
        })
      } else {
        // console.log('no req.user')
        User.findOne({ github: profile.id }, function (err, existingUser) {
          if (err) console.error(err)
          if (existingUser) {
            // console.log('existing user')
            // think about updating?
            if (!existingUser.createdAt || existingUser.createdAt === '') existingUser.createdAt = new Date('2016-10-17T02:20:59.089Z')
            existingUser.lastLoggedIn = new Date()
            existingUser.email = (_.filter(profile.emails, (email) => {
              return email.primary
            })[0] || {}).email
            existingUser.jwt = jwt.sign({github: existingUser.github}, jwtsecret)
            return existingUser.save(function (err, user) {
              if (err) console.error(err)
              // console.log('saved user')
              req.analytics.track({
                userId: existingUser.username,
                event: 'User Logged In',
                properties: {
                  roles: JSON.stringify(existingUser.roles)
                }
              })
              done(null, existingUser)
            })
          }
          // console.log('no existing user')
          // create this new user
          var user = new User()
          user.email = (_.filter(profile.emails, (email) => {
            return email.primary
          })[0] || {}).email
          user.scopes = tokens
          if (user.scopes[0].indexOf(',') > -1) {
            user.scopes = user.scopes[0].split(', ')
          }
          user.github = profile.id
          user.username = profile.username
          user.tokens.push({ kind: 'github', accessToken: accessToken })
          user.profile.name = profile.displayName
          user.profile.picture = profile._json.avatar_url
          user.profile.location = profile._json.location
          user.profile.website = profile._json.blog
          user.createdAt = new Date()
          user.lastLoggedIn = new Date()
          User.count({}, function (err, count) {
            if (err) console.error(err)
            if (!count) {
              user.roles = {
                read: true,
                blog: true,
                project: true,
                lead: true,
                core: true,
                coreLead: true,
                superAdmin: true
              }
              user.teams.core = ['executive']
              user.teams.projects = ['website']
            }
            user.jwt = jwt.sign({github: user.github}, jwtsecret)
            user.save(function (err) {
              if (err) console.error(err)
              req.analytics.track({
                userId: user.username,
                event: 'User Signed Up',
                properties: {
                  roles: JSON.stringify(user.roles)
                }
              })
              done(err, user)
            })
          })
        })
      }
    }
  })
}))

/**
 * Link Meetup account
 */
passport.use(new MeetupStrategy({
  consumerKey: process.env.MEETUP_KEY,
  consumerSecret: process.env.MEETUP_SECRET,
  callbackURL: '/auth/meetup/callback',
  passReqToCallback: true
}, function (req, accessToken, refreshToken, profile, done) {
  if (req.user) {
    User.findById(req.user.id, function (err, user) {
      if (err) console.error(err)
      user.tokens.push({ kind: 'meetup', accessToken: accessToken })
      user.save(function (err) {
        if (err) console.error(err)
        req.flash('info', { msg: 'Meetup account has been linked.' })
        done(err, user)
      })
    })
  } else {
    req.flash('info', { msg: 'You must be logged in to link your Meetup account.' })
    done('ERROR')
  }
}))

/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: 'email' }, function (email, password, done) {
  email = email.toLowerCase()
  User.findOne({ email: email }, function (err, user) {
    if (err) console.error(err)
    if (!user) {
      return done(null, false, { message: 'Email ' + email + ' not found' })
    }
    user.comparePassword(password, function (err, isMatch) {
      if (err) console.error(err)
      if (isMatch) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Invalid email or password.' })
      }
    })
  })
}))
