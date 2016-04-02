var lambda = require('../')
var test = require('tape')

function handler(event, callback) {
  event.ok = true
  callback(null, event)
}

// get an instance of the lambda
var insert = lambda.sources.dynamo.insert(handler)
var modify = lambda.sources.dynamo.modify(handler)
var remove = lambda.sources.dynamo.remove(handler)
var all = lambda.sources.dynamo.all(handler)
var save = lambda.sources.dynamo.save(handler)

test('insert trigger', t=> {
  t.plan(1)
  var event = {
    Records:[{one:1}, {two:2}],
    eventName:'INSERT'
  }
  var context = {
    succeed: function succeed(v) {
      t.ok(v, 'insert trigger ran')
      console.log(v)
    }
  }
  // invoke the lambda
  insert(event, context)
})

test('modify trigger', t=> {
  t.plan(1)
  var event = {
    Records:[{three:3}, {four:4}],
    eventName:'MODIFY'
  }
  var context = {
    succeed: function succeed(v) {
      t.ok(v, 'modify trigger ran')
      console.log(v)
    }
  }
  // invoke the lambda
  modify(event, context)
})

test('remove trigger', t=> {
  t.plan(1)
  var event = {
    Records:[{five:5}, {six:6}],
    eventName:'REMOVE'
  }
  var context = {
    succeed: function succeed(v) {
      t.ok(v, 'modify trigger ran')
      console.log(v)
    }
  }
  // invoke the lambda
  remove(event, context)
})

test('all trigger', t=> {
  t.plan(1)
  var event = {
    Records:[{seven:5}, {eight:6}, {nine:9}],
    eventName:'REMOVE'
  }
  var context = {
    succeed: function succeed(v) {
      t.ok(v, 'all trigger ran')
      console.log(v)
    }
  }
  // invoke the lambda
  all(event, context)
})

test('save trigger', t=> {
  t.plan(1)
  var event = {
    Records:[{ten:10}],
    eventName:'MODIFY'
  }
  var context = {
    succeed: function succeed(v) {
      t.ok(v, 'save trigger ran')
      console.log(v)
    }
  }
  // invoke the lambda
  save(event, context)
})

test('fail trigger', t=> {
  t.plan(1)
  var event = {
    Records:[{ten:10}],
    eventName:'MODIFY'
  }
  var context = {
    succeed: function succeed(v) {
      t.ok(v, 'modify trigger ran and failed')
      console.log(v)
    }
  }
  // invoke the lambda
  var handler = lambda.sources.dynamo.modify(function(event, callback) {
    callback(Error('test err'))
  })
  handler(event, context)
})
