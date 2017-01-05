var test = require('tape')
var sns = require('../').triggers.sns
var mock = require('./sns-mock.json')

test('env', t=> {
  t.plan(1)
  t.ok(sns, 'sns exists in current scope')
})

test('can return a lambda', t=> {
  t.plan(2)

  function testHandler(event, callback) {
    callback(null, event)
  }
  var fn = sns(testHandler)
  t.ok(fn, 'returned a fn')
  console.log(fn)

  fn(mock, {
    succeed(thing) {
      t.ok(thing, 'got json msg from sns')
      console.log('success called', thing)
    }, 
    fail(thing) {
      console.log('fail called', thing)
    }
  })
})
