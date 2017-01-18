/**
 *  Dependencies
 */
const requireDir = require('require-dir')
const helpers = requireDir('../../helpers', {recurse: true})

/**
 *  Exports
 */

module.exports = {
  method: 'post',
  endpoint: '/api/posts',
  jwt: true,
  authenticated: true,
  roles: ['core', 'superAdmin'],
  middleware: [],
  controller: helpers.mortimer.postResource.createDoc()
}
