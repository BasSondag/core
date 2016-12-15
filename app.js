require('app-module-path/register')
require('node-version-checker')

/**
 * Module dependencies.
 */
var express = require('express')
var _ = require('lodash')
var cookieParser = require('cookie-parser')
var compress = require('compression')
var favicon = require('serve-favicon')
var session = require('express-session')
var bodyParser = require('body-parser')
var logger = require('morgan')
var errorHandler = require('errorhandler')
var lusca = require('lusca')
var methodOverride = require('method-override')
var MongoStore = require('connect-mongo/es5')(session)
var flash = require('express-flash')
var passport = require('passport')
var expressValidator = require('express-validator')
var sass = require('node-sass-middleware')
var path = require('path')
var requireDir = require('require-dir')
var pkg = require('./package.json')
var isUrl = require('is-url')

// Segment server-side tracking
var Analytics = require('analytics-node')
var analytics // placeholder for instantiated client

require('colors')

/**
 * Controllers (route handlers).
 */
let APIctrl = require('./controllers/api')

let controllers
let middleware
let helpers
let models
let config
let brigadeDetails
let info = '[Brigadehub Core]'.yellow

module.exports = function (opts) {
  if (opts.info) info = opts.info.yellow
  console.log("                      \u2590\u2593\u2580\u2593\u2580\u2593\u2580\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593              \u2584\u2584\u2584                 \r\n                      \u2590\u2593\u2584\u2593\u2584\u2593\u2584\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593            \u2584\u2593\u2593\u2593                 \r\n              \u2593\u2593\u2593\u2593\u2593   \u2590\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593           \u2553\u2593\u2593\u2593   \u2552\u2593\u2593\u2584\u2584          \r\n          \u2584\u2593\u2593\u2593\u2593\u2593\u2593     \u2590\u2593\u2593\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2593\u2593\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2593\u2593\u2593          \u2554\u2593\u2593\u2593     \u2580\u2588\u2593\u2593\u2593\u2593\u2584\u2584      \r\n      \u2584\u2584\u2593\u2593\u2593\u2593\u2588\u2580\u2518       \u2590\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593          \u2590\u2593\u2593         \u2584\u2593\u2593\u2588         \u2559\u2580\u2588\u2593\u2593\u2593\u2593\u2584\u2584  \r\n    \u2593\u2593\u2593\u2593\u2593\u2593\u2593           \u2590\u2593\u2593\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2593\u2593          \u2590\u2593\u2593        \u2584\u2593\u2593\u2588              \u2559\u2593\u2593\u2593\u2593\u2593\u2593\r\n      \u2580\u2588\u2593\u2593\u2593\u2593\u2593\u2584        \u2590\u2593\u2593\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2580\u2593\u2593          \u2590\u2593\u2593       \u2584\u2593\u2593\u2588            ;\u2584\u2593\u2593\u2593\u2593\u2588\u2580\u2559 \r\n          \u2580\u2588\u2593\u2593\u2593\u2593\u2593\u2584    \u2590\u2593\u2593\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2593      \u2584\u2593\u2593\u2588         ,\u2584\u2593\u2593\u2593\u2593\u2588\u2580\u2580     \r\n              \u2593\u2593\u2593\u2593\u258C   \u2590\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593     \u2584\u2593\u2593\u2588         \u2590\u2593\u2593\u2593\u2580\u2580.        \r\n                      \u2590\u2593\u2593\u2593\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2584\u2593\u2593\u2593    \u2584\u2593\u2593\u2588            \u00AC            \r\n                      \u2590\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593\u2593   \u2588\u2580\u2580                          \r\n __                                      __          __               __        \r\n/\\ \\             __                     /\\ \\        /\\ \\             /\\ \\       \r\n\\ \\ \\____  _ __ /\\_\\     __      __     \\_\\ \\     __\\ \\ \\___   __  __\\ \\ \\____  \r\n \\ \\ '__`\\/\\`'__\\/\\ \\  /'_ `\\  /'__`\\   /'_` \\  /'__`\\ \\  _ `\\/\\ \\/\\ \\\\ \\ '__`\\ \r\n  \\ \\ \\L\\ \\ \\ \\/ \\ \\ \\/\\ \\L\\ \\/\\ \\L\\.\\_/\\ \\L\\ \\/\\  __/\\ \\ \\ \\ \\ \\ \\_\\ \\\\ \\ \\L\\ \\\r\n   \\ \\_,__/\\ \\_\\  \\ \\_\\ \\____ \\ \\__/.\\_\\ \\___,_\\ \\____\\\\ \\_\\ \\_\\ \\____/ \\ \\_,__/\r\n    \\/___/  \\/_/   \\/_/\\/___L\\ \\/__/\\/_/\\/__,_ /\\/____/ \\/_/\\/_/\\/___/   \\/___/ \r\n                         /\\____/                                                \r\n                         \\_/__/      ")
  console.log(`${info} v${opts.version || pkg.version}`)

  process.env.DB_INSTANTIATED = ''

  if (!opts.dotenv) {
    console.log('Loading core .env')
    require('./dotenv.js')()
  } else {
    console.log('.env provided')
  }

  controllers = requireDir('./controllers', {recurse: true})
  middleware = requireDir('./middleware', {recurse: true})
  helpers = requireDir('./helpers')
  models = require('./models')
  config = requireDir('./config')

  var app = express()

  helpers.bootstrapDatabase(opts.brigade, startServer)

  function startServer (brigade) {
    var Brigade = require('./models/Brigade')
    brigadeDetails = brigade
    const publicThemeLocation = brigade.theme ? path.join(__dirname, 'node_modules', `brigadehub-public-${brigadeDetails.theme.public}`) : false
    const adminThemeLocation = brigade.theme ? path.join(__dirname, 'node_modules', `brigadehub-admin-${brigadeDetails.theme.admin}`) : false

    const publicFileList = publicThemeLocation ? listAllFiles(`${publicThemeLocation}/public`) : []
    const adminFileList = adminThemeLocation ? listAllFiles(`${adminThemeLocation}/public`) : []
    let redirectBlacklist = [
      'api/',
      'auth/',
      'login',
      'logout',
      'favicon',
      '.css',
      '.js',
      '.min',
      '.map',
      '.eot',
      '.svg',
      '.ttf',
      '.woff',
      '.woff2',
      '.otf',
      '.jpg',
      '.png',
      '.scss'
    ]
    redirectBlacklist = redirectBlacklist.concat(publicFileList).concat(adminFileList)
    redirectBlacklist = redirectBlacklist.sort()
    redirectBlacklist = _.uniq(redirectBlacklist)

    const publicControllers = publicThemeLocation ? requireDir(`${publicThemeLocation}/controllers`, {recurse: true}) : {}
    const adminControllers = adminThemeLocation ? requireDir(`${adminThemeLocation}/controllers`, {recurse: true}) : {}
    /**
     * Express configuration.
     */
    app.set('port', process.env.PORT || 5465)
    if (publicThemeLocation || adminThemeLocation) app.set('views', path.join(__dirname, 'node_modules'))
    app.locals.capitalize = function (value) {
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
    app.locals.plural = function (value) {
      if (value[value.length - 1] === 's') {
        return value + 'es'
      }
      return value + 's'
    }
    app.locals.isUrl = isUrl
    if (publicThemeLocation || adminThemeLocation) app.set('view engine', 'pug')
    app.use(compress())

    app.use(logger('dev'))
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(expressValidator())
    app.use(methodOverride())
    app.use(cookieParser())
    app.use(session({
      resave: true,
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET,
      store: new MongoStore({
        url: process.env.MONGODB || process.env.MONGOLAB_URI,
        autoReconnect: true
      })
    }))
    /* Check if db is connected */
    app.use(checkDB)
    function checkDB (req, res, next) {
      if (process.env.DB_INSTANTIATED === '') {
        return setTimeout(function () {
          checkDB(req, res, next)
        }, 500)
      }
      next()
    }
    /* Attach brigade info to req */
    app.use(function (req, res, next) {
      req.models = models
      req.helpers = helpers
      req.config = config
      Brigade.findOne({}, function (err, results) {
        if (err) throw err
        if (!results) throw new Error('BRIGADE NOT IN DATABASE')
        res.locals = res.locals || {}
        res.locals.brigade = results
        // bootstrap segment tracking
        if (!analytics && res.locals.brigade.auth.segment.writeKey.length) {
          analytics = new Analytics(res.locals.brigade.auth.segment.writeKey)
        }
        req.analytics = analytics || {
          track: () => {
          },
          page: () => {
          },
          identify: () => {
          },
          group: () => {
          },
          alias: () => {
          }
        }

        res.locals.brigade.buildVersion = pkg.version
        res.theme = res.theme || {}
        res.theme.public = `brigadehub-public-${brigadeDetails.theme.public}`
        res.theme.admin = `brigadehub-admin-${brigadeDetails.theme.admin}`
        helpers.tokenLoader(passport, res.locals.brigade.auth)
        next()
      })
    })
    app.use(passport.initialize())
    app.use(passport.session())
    app.use(flash())
    app.use(lusca({
      csrf: true,
      xframe: 'SAMEORIGIN',
      xssProtection: true
    }))
    app.use(function (req, res, next) {
      // check postAuthLink and see if going to auth callback
      if (!isPublicFile(req.path, redirectBlacklist)) {
        console.log('returnTo', req.path)
        req.session.returnTo = req.path
      }
      res.locals.user = req.user
      next()
    })
    app.use(function (req, res, next) {
      req.previousURL = req.header('Referer') || '/'
      next()
    })

    /**
     *  Dynamically Generated Routes
     */

    const dynamicRoutes = {}
    buildOutEndpoints(controllers, app, dynamicRoutes)
    buildOutEndpoints(publicControllers, app, dynamicRoutes)
    buildOutEndpoints(adminControllers, app, dynamicRoutes)
    buildOutDynamicEndpoints(dynamicRoutes, app)

    /**
     *  API routes
     */

    app.get('/api/models/:model', APIctrl.get.models)

    /**
     * Users routes.
     */

    /**
     * OAuth authentication routes. (Sign in)
     */
    app.get('/auth/github', passport.authenticate('github', {
      scope: [ 'user', 'public_repo' ]
    }))
    app.get('/auth/github/elevate', middleware.passport.elevateScope)
    app.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), function (req, res) {
      console.log('new github callback!', req.session.returnTo)
      res.redirect(req.session.returnTo || '/')
    })
    app.get('/auth/meetup', passport.authenticate('meetup', { scope: ['basic', 'rsvp'] }))
    app.get('/auth/meetup/callback', passport.authenticate('meetup', { failureRedirect: '/account' }), function (req, res) {
      res.redirect(req.session.returnTo || '/account')
    })

    /**
     * Error Handler.
     */
    app.use(errorHandler())
    app.use(sass({
      src: path.join(publicThemeLocation, 'public'),
      dest: path.join(publicThemeLocation, 'public'),
      debug: true,
      sourceMap: true,
      outputStyle: 'expanded'
    }))
    app.use(function (req, res, next) {
      if (_.filter(res.locals.brigade.redirects, {endpoint: req.path}).length) {
        var redirect = _.filter(res.locals.brigade.redirects, {endpoint: req.path})[0]
        if (redirect.type === 'permanent') {
          return res.redirect(301, redirect.destination)
        }
        return res.redirect(redirect.destination)
      }
      next()
    })
    app.use(favicon(path.join(publicThemeLocation, 'public', 'favicon.png')))
    app.use(express.static(path.join(publicThemeLocation, 'public'), { maxAge: 31557600000 }))
    app.listen(app.get('port'), function () {
      console.log(`${info} Server listening on port ${app.get('port')}`)
    })
    return app
  }
}
/**
 * constructEndpoint - Instantiate express routes
 *
 * @param  {Object} ctrl controller object
 * @param  {Object} app  Express Application
 */
function constructEndpoint (ctrl, app) {
  let ctrlParams = [ctrl.endpoint]
  if (ctrl.authenticated) ctrlParams.push(middleware.passport.isAuthenticated)
  if (ctrl.roles) ctrlParams.push(middleware.passport.checkRoles(ctrl.roles))
  if (ctrl.scopes) ctrlParams.push(middleware.passport.checkScopes(ctrl.scopes))

  // set other middleware
  ctrl.middleware = ctrl.middleware.map(function (mwName) {
    return middleware[mwName]
  })
  ctrlParams = ctrlParams.concat(ctrl.middleware)

  // set final controller
  ctrlParams.push(ctrl.controller)

  // apply configuration and run on express
  app[ctrl.method].apply(app, ctrlParams)
}

function buildOutEndpoints (ctrlList, app, dynamicRoutes) {
  /**
   * Static param routes.
   */
  for (let ctrlFolderName in ctrlList) {
    const ctrlFolder = ctrlList[ctrlFolderName]
    if (_.isObject(ctrlFolder)) {
      for (let ctrlName in ctrlFolder) {
        const ctrl = ctrlFolder[ctrlName]
        if (ctrl.endpoint) {
          if (ctrl.endpoint.indexOf(':') > -1) {
            const endpointArray = ctrl.endpoint.split(':')
            const dynamicLevel = endpointArray.length - 1
            dynamicRoutes[dynamicLevel] = dynamicRoutes[dynamicLevel] || []
            dynamicRoutes[dynamicLevel].push(ctrl)
          } else {
            constructEndpoint(ctrl, app)
          }
        }
      }
    }
  }
}
function buildOutDynamicEndpoints (dynamicRoutes, app) {
  /**
   *  Dynamic param routes
   */
  for (let dynamicLevel in dynamicRoutes) {
    const ctrls = dynamicRoutes[dynamicLevel]
    for (let ctrlIndex in ctrls) {
      const ctrl = ctrls[ctrlIndex]
      if (ctrl.endpoint) {
        constructEndpoint(ctrl, app)
      }
    }
  }
}

function listAllFiles (dir, filelist) {
  var path = path || require('path')
  var fs = fs || require('fs')
  var files = fs.readdirSync(dir)
  filelist = filelist || []
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = listAllFiles(path.join(dir, file), filelist)
    } else {
      filelist.push(file)
    }
  })
  return filelist
}
function isPublicFile (url, fileList) {
  for (let fileIndex in fileList) {
    if (url.indexOf(fileList[fileIndex]) > -1) return true
  }
  return false
}
