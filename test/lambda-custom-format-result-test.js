var test = require('tape')
var lodash = require('lodash')
var isArray = lodash.isArray
var lambda = require('../')

/**
 * lambda function that always fails with an ugly error
 */
function raiseError(event, callback) {
  callback(Error('ugly error'))
}

/**
 * custom formatter example
 *
 * this formatter removes the stack trace from errors and otherwise just passes data thru
 *
 */
function cleanupErrors(err, results, context) {
  var res = results || {}
  if (err) {
    // handle single error or array of errors for good form
    err = (isArray(err)? err : [err])
    // remove stack trace
    res.errors = err.map(e=>e.message)
  }
  context.succeed(res)
}

// create the lambda and then use lambda.local to test it
var fn = lambda([raiseError], cleanupErrors)

test('removes stack trace', t=> {
  t.plan(1)
  lambda.local(fn, {}, (err, results)=> {
    if (err) {
      t.ok(err, 'got the error and stack traces have been removed')
    }
    else {
      t.fail(results, 'should have an error')
    }
    console.log(err, results)
  })
})
