var waterfall  = require('run-waterfall')
var isArray    = Array.isArray
var isFunction = require('lodash.isFunction')
var reject     = require('lodash.reject')
var errback    = require('serialize-error')

module.exports = function lambda() {

  var firstRun = true                    // important to keep this here in this closure
  var args = [].slice.call(arguments, 0) // grab the args

  // fail loudly for programmer not passing anything
  if (args.length === 0) {
    throw Error('lambda requires at least one callback function')
  }

  // check for lambda([], (err, result)=>) sig
  var customFormatter = isArray(args[0]) && isFunction(args[1])
  var fmt = customFormatter? args[1] : false
  var fns = fmt? args[0] : args

  // we only deal in function values around here
  var notOnlyFns = reject(fns, isFunction).length > 0
  if (notOnlyFns) {
    throw Error('bad argument found: lambda(...fns) or lambda([...],(err, result)=>)')
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

    // asummptions:
    // - err should be an array of Errors
    // - because lambda deals in json we need to serialize them
    function formatter(err, result) {
      if (fmt) {
        fmt(err, result, context)
      }
      else {
        if (err) {
          result = {
            ok: false,
            errors: (isArray(err)? err : [err]).map(errback)
          }
        }
        else {
          if (typeof result === 'undefined') result = {}
          result.ok = true
        }
        // deliberate use context.succeed;
        // there is no (good) use case for the (current) context.fail behavior 
        // (but happy to discuss in an issue)!
        context.succeed(result)
      }
    }
    
    // the real worker here
    waterfall(fns, formatter)
  }
}
