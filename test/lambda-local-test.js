var lambda = require('../')
var test = require('tape')

function goodLambda(event, callback) {
  var result = Object.assign({good:'times'}, event)
  callback(null, result)
}

function badLambda(event, callback) {
  callback(Error('fail'))
}

var good = lambda(goodLambda)
var bad = lambda(badLambda)

test('the good', t=> {
  t.plan(2)
  var mockEvent = {some:'param'}
  lambda.local(good, mockEvent, (err, result)=> {
    if (err) {
      t.fail(err)
    }
    else {
      t.ok(result.ok, 'got ok on result')
      t.equal(result.some, 'param', 'params pass thru')
    }
  })
})

test('the bad', t=> {
  t.plan(2)
  var mockEvent = {some:'param'}
  lambda.local(bad, mockEvent, (err, result)=> {
    if (err) {
      t.equal(err.length, 1, 'got err array')
      t.equal(err[0].message, 'fail', 'got fail err')
    }
    else {
      t.fail(err)
    }
  })
})
