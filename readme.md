[ ![Codeship Status for smallwins/lambda](https://codeship.com/projects/2e4082e0-d808-0133-2035-1eae90b9310e/status?branch=master)](https://codeship.com/projects/143109)

---

# @smallwins/lambda

- Author your AWS Lambda functions as pure node style callbacks (aka errbacks)
- Familiar middleware pattern for composition
- Event sources like DynamoDB triggers and SNS topics too

## return a result to api gateway

Lets look at a vanilla AWS Lambda example. Here is a Lambda for performing a sum. given `event.query.x = 1` it will return `{count:2}`.

```javascript
exports.handler = function sum(event, callback) {
  var errors = []
  if (typeof event.query === 'undefined') {
    errors.push(ReferenceError('missing event.query'))
  }
  if (event.query && typeof event.query != 'object') {
    errors.push(TypeError('event.query not an object'))
  }
  if (typeof event.query.x === 'undefined') {
    errors.push(ReferenceError('event.query not an object'))
  }
  if (event.query.x && typeof event.query.x != 'number') {
    errors.push(TypeError('event.query not an object'))
  }
  if (errors.length) {
    context.fail(errors) // returns [{}, {}, {}, {}]
  }
  else {
    context.succeed({count:event.query.x + 1})
  }
}
```

A huge amount of this code is working around quirky parameter validations. The latter part of the code uses the funky AWS `context` object. We do better:

```javascript
var validate = require('@smallwins/validate')
var lambda = require('@smallwins/lambda')

function sum(event, callback) {
  var schema = {
    'query':   {required:true, type:Object},
    'query.x': {required:true, type:Number}
  }
  var errors = validate(event, schema)
  if (errors) {
    callback(errors)
  }
  else {
    callback(null, {count:event.query.x + 1})
  }
}

exports.handler = lambda(sum)
```

## easily chain dependant actions ala middleware

Building on this foundation we can compose multiple errbacks into a Lambda. Lets compose a lambda from three functions: validate parameters, check for an authorized account and then return data safely (or callback with errors).

```javascript
var validate = require('@smallwins/validate')
var lambda = require('@smallwins/lambda')

function valid(event, callback) {
  var schema = {
    'body':          {required:true, type:Object},
    'body.username': {required:true, type:String},
    'body.password': {required:true, type:String}
  }
  var errors = validate(event, schema)
  if (errors) {
    callback(errors)
  }
  else {
    callback(null, event)
  }
}

function authorized(event, callback) {
  if (event.body.username === 'sutro' && event.body.password === 'cat') {
    event.account = {
      loggedIn: true,
      name: 'sutro furry pants'
    }
    callback(null, event)
  }
  else {
    callback(Error('not found'))
  }
}

function safe(event, callback) {
  callback(null, {account:event.account})
}

exports.handler = lambda(valid, authorized, safe)
```

## save a record from a dynamodb trigger    

```javascript
var lambda = require('@smallwins/lambda')

exports.handler = lambda(function saveVersion(record, callback) {

})
```

## app api

- `lambda(...fns)`
