
/**
 * var lambda = require('@mallwins/lambda')
 *
 * var fn = lambda(function (event, data) {
 *  callback(null, {hello:'world'})
 * })
 *
 * // fake run locally
 * lambda.local(fn, fakeEvent, function done(err, result) {
 *    if (err) {
 *      console.error(err)
 *    }
 *    else {
 *      console.log(result) // logs: {ok:true, hello:'world'}
 *    }
 * })
 */
module.exports = function local(fn, event, callback) {
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
