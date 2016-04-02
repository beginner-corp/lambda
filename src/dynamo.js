var async = require('async')
var _ = require('lodash')
var errback = require('serialize-error')

function trigger(types) {
  return function() {

    // grab all the functions
    var fns = [].slice.call(arguments, 0) 

    // fail loudly for programmer not passing anything
    if (fns.length === 0) {
      throw Error('lambda requires at least one callback function')
    }
    // fail loud if the programmer passes something other than a fn
    var notOnlyFns = _.reject(fns, _.isFunction)
    if (notOnlyFns.length) {
      throw Error('lambda only accepts callback functions as arguments')
    }

    // return an AWS Lambda fn sig
    return function(event, context) { 

      // fail if there's no records
      if (!event.Records) {
        throw Error('event.Records is undefined')
      }
    
      // construct handlers for each record
      var handlers = event.Records.map(function(record) {
        // pass the record to the handler chain
        var locals = fns.slice()
        locals.unshift(function(callback) {
          callback(null, record)
        })
        return function(callback) {
          // if isInvoking we invoke the handler with the record
          var isInvoking = types.indexOf(event.eventName) > -1
          if (isInvoking) {
            async.waterfall(locals, callback)
          }
          else {
            callback() // if not we just call the continuation (callback)
          }
        }
      })

      // execute the handlers in parallel for all the records
      async.parallel(handlers, function done(err, result) {
        if (err) {
          var errors = (_.isArray(err)? err : [err]).map(errback)
          context.succeed({ok:false, errors:errors})
        }
        else {
          context.succeed(result)
        }
      })   
    }
  }
}

module.exports = {
  insert: trigger(['INSERT'                    ]),
  modify: trigger(['MODIFY'                    ]),
  remove: trigger(['REMOVE'                    ]),
  save:   trigger(['INSERT', 'MODIFY'          ]),
  all:    trigger(['INSERT', 'MODIFY', 'REMOVE'])
}
