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
