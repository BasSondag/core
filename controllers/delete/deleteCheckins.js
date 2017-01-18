/**
 *  Dependencies
 */
const requireDir = require('require-dir')
const helpers = requireDir('../../helpers', {recurse: true})

/**
 *  Exports
 */

module.exports = {
  method: 'delete',
  endpoint: '/api/checkins',
  jwt: true,
  authenticated: true,
  roles: ['core', 'superAdmin'],
  middleware: [],
  controller: helpers.mortimer.checkinResource.removeDocs()
}
