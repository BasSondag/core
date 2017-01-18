const Projects = require('../../models/Projects')
const mortimer = require('mortimer')
const AfterResourceHook = require('./afterResourceHook')
class ProjectsResource extends AfterResourceHook {
  constructor () {
    super(Projects)
  }
  // This method implements the counting routine.
  after (tag) {
    // console.log('arguments', arguments, this)
    if (!this.counters) {
      this.counters = {}
    }
    if (!this.counters[tag]) {
      this.counters[tag] = 0
    }
    var that = this
    return function (req, res, next) {
      // console.log('running', req.mrt.result, req.user)
      // TODO: edit req.mrt.result to sanitize returns
      req.mrt.result = req.mrt.result.map((project) => {
        project = project.toObject()
        return project
      })
      next()
    }
  }
}
const projectResource = new ProjectsResource(Projects)

module.exports = projectResource
