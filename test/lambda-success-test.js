var isArray = require('lodash').isArray
var lambda = require('../')
var test = require('tape')

test('can invoke a successful lambda', t=> {
  t.plan(1)
  // always succeeds
  function tester(event, callback) {
    event.allGood = true
    callback(null, event)
  }
  var fn = lambda(tester)
  fn({}, {
    succeed: function fakeSucceed(v) {
      t.ok(v.allGood, 'got the event!')
      console.log('fake succeed called with ', v)
    }
  })
})

