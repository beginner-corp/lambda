var isArray = require('lodash').isArray
var lambda = require('../')
var test = require('tape')

test('can invoke a failful lambda', t=> {
  t.plan(1)
  // always fails
  function tester(event, callback) {
    callback(Error('wtf'))
  }
  var fail = lambda(tester)
  fail({}, {
    succeed: function fakeSucceed(v) {
      t.ok(isArray(v.errors), 'got an Errors array')
      console.log('faked fail called with ', v)
    }
  })
})

