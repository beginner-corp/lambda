var test = require('tape')
var mock = require('./mock.json')
var lambda = require('../').triggers.dynamo

test('sanity', t=> {
  t.plan(4)
  t.ok(lambda, 'the thing')
  t.ok(lambda.insert, 'the thing can listen for insert')
  t.ok(lambda.modify, 'the thing can listen for modify')
  t.ok(lambda.remove, 'the thing can listen for delete')
})

test('can return a lambda', t=> {
  t.plan(2)
  function testHandler(event, callback) {
    console.log('000 --- executing testHandler')
    callback(null, event)
  }
  var fn = lambda.all(testHandler)
  t.ok(fn, 'returned a fn')
  console.log(fn)
  var fakeEvent = {
    eventName: 'MODIFY',
    Records: [mock]
  }
  var fakeContext = {
    succeed(thing) {
      t.ok(thing, 'got a thing from insert')
      console.log('success called', thing)
    }, 
    fail(thing) {
      console.log('fail called', thing)
    }
  }
  fn(fakeEvent, fakeContext)
})
