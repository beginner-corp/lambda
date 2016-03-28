var async = require('async')
var _ = require('lodash')
var errback = require('serialize-error')

/**
 * lambda - accepts node style callbacks and returns an aws lambda function
 *
 */
function lambda() {

  // grab all the functions
  var fns = [].splice.call(arguments, 0)

  // fail loudly for programmer not passing anything
  if (fns.length === 0) {
    throw Error('lambda requires at least one callback function')
  }

  // fail loud if the programmer passes something other than a fn
  var notOnlyFns = _.reject(fns, _.isFunction)
  if (notOnlyFns) {
    throw Error('lambda only accepts callback functions as arguments')
  }

  // returns a lambda sig
  return function(event, context) {

    // put this callback at the front of the line to pass in the event data
    fns.unshift(function(callback) {
      callback(null, event) 
    })

    // the real worker here
    async.waterfall(fns, function(err, result) {
      // deliberate use context.succeed; there is no case where you want
      // the (current) context.fail behavior (but happy to discuss in an issue)!
      if (err) {
        var errors = (_.isArray(err)? err : [err]).map(errback) // serialize errors
        context.succeed(errors)
      }
      else {
        context.succeed(result)
      }
    })
  }
}

lambda.sources = {

  dynamo: {
          
  },

  sns: {
       
  }
}

lambda.scripts = {
  env: function env(callback) {
         
  },
  init: function init(path, callback) {
        
  },
  deploy: function deploy() {
          
  },
  pkg: function package() {
           
  }
}

module.exports = lambda
