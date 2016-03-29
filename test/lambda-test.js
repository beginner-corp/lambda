var test = require('tape')
var lambda = require('../')
var lodash = require('lodash')
var isFunction = lodash.isFunction
var isArray = lodash.isArray

test('sanity', t=> {
  t.plan(1)
  t.ok(lambda, 'lambda exists')
})

test('cannot give lambda bad params', t=> {
  t.plan(1)
  try {
    lambda()
  }
  catch(e) {
    t.ok(e, 'failed with bad params and we got a meaningful error')
    console.log(e)
  }
})

test('can call lambda with one fn', t=> {
  t.plan(1)
  function tester(event, callback) {
    callback(null, event)
  }
  var fn = lambda(tester)
  t.ok(isFunction(fn), 'got a function back')
})

test('can call lambda with greater than one fn', t=> {
  t.plan(1)
  function tester(event, callback) {
    callback(null, event)
  }
  function tester2(event, callback) {
    callback(null, event)
  }
  var fn = lambda(tester, tester2)
  t.ok(isFunction(fn), 'got a function back')
})

test('can invoke a successful lambda', t=> {
  t.plan(1)
  // always succeeds
  function tester(event, callback) {
    event.allGood = true
    callback(null, event)
  }
  // mocks don't need a cray mocking lib
  var fakeEvent = {}
  var fakeContext = {
    succeed: function fakeSucceed(v) { 
      t.ok(v.allGood, 'got the event!')
      console.log('fake succeed called with ', v)
    }
  }
  // get our lambda and invoke it with the mocks
  var fn = lambda(tester)
  fn(fakeEvent, fakeContext)
})

test('can invoke a failful lambda', t=> {
  t.plan(1)
  // always succeeds
  function tester(event, callback) {
    callback(Error('wtf'))
  }
  // mocks don't need a cray mocking lib
  var fakeEvent = {}
  var fakeContext = {
    succeed: function fakeSucceed(v) { 
      t.ok(isArray(v), 'got an Errors array')
      console.log('faked fail called with ', v)
    }
  }
  // get our lambda and invoke it with the mocks
  var fn = lambda(tester)
  fn(fakeEvent, fakeContext)
})
