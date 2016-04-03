var async = require('async')
var _ = require('lodash')
var errback = require('serialize-error')

function lambda() {

  var firstRun = true                   // important to keep this here in this closure
  var fns = [].slice.call(arguments, 0) // grab all the functions

  // fail loudly for programmer not passing anything
  if (fns.length === 0) {
    throw Error('lambda requires at least one callback function')
  }

  // fail loud if the programmer passes something other than a fn
  var notOnlyFns = _.reject(fns, _.isFunction)
  if (notOnlyFns.length) {
    throw Error('lambda only accepts callback functions as arguments')
  }

  // returns a lambda sig
  return function(event, context) {

    // this is to avoid warm start (sometimes lambda containers are cached … yeaaaaah.)
    if (firstRun) {
      fns.unshift(function(callback) {
        callback(null, event)
      })
      firstRun = false
    }
    else {
      // mutates! wtf. remove the cached callback
      fns.shift()
      // add the fresh event
      fns.unshift(function(callback) {
        callback(null, event)
      })
    }

    // the real worker here
    async.waterfall(fns, function(err, result) {
      if (err) {
        // asummptions:
        // - err should be an array of Errors
        // - because lambda deals in json we need to serialize them
        var errors = (_.isArray(err)? err : [err]).map(errback)
        // deliberate use context.succeed;
        // there is no (good) use case for the (current) context.fail behavior (but happy to discuss in an issue)!
        context.succeed({ok:false, errors:errors})
      }
      else {
        context.succeed(result)
      }
    })
  }
}

/**
 * var lambda = require('@mallwins/lambda')
 *
 * var fn = lambda()
 *
 * // fake run locally
 * lambda.local(fn, fakeEvent, function done(err, result) {
 *    if (err) {
 *      console.error(err)
 *    }
 *    else {
 *      console.log(result)
 *    }
 * })
 */
lambda.local = function offlineInvoke(fn, event, callback) {
  var context = {
    succeed: function offlineSucceed(x) {
      if (x.ok) {
        callback(null, x)
      }
      else {
        callback(x.errors)
      }
    }
  }
  fn(event, context)
}

module.exports = lambda
