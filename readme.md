# @smallwins/lambda

- dead easy npm run scripts for: init, deploy & rollback
- no implicit conventions / everything configurable in package.json / smart defaults
- no perscribed project structure or folder constraints
- author lambda functions as pure node style callbacks (aka errbacks)
- return clean slack rpc-style json (works well w/ api gateway)
- familiar middleware pattern for composing functions as a lambda
- author event sources like dynamodb triggers and sns topics this way too!

## return a result to api gateway

Lets look at a vanilla AWS Lambda example. Here is a Lambda for performing a sum. given `event.query.x = 1` and will return `{count:2}`.

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

A better way!

```javascript
var lambda = require('@smallwins/lambda')
var validate = require('validate-params-schema')

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

```javascript
var lambda = require('@smallwins/lambda')

function authorized(event, callback) {
  if (event.body.username === 'sutro' && event.body.password === 'cat') {
    event.account = {
      loggedIn: true,
      name: 'sutro furry pants'
    }
    callback(null, event)
  }
  else {
    callback([Error('not found')])
  }
}

function protected(event, callback) {
  callback(null, {account:event.account})
}

exports.handler = lambda(authorized, protected)
```

## save a record from a dynamodb trigger    

```javascript
var lambda = require('@smallwins/lambda')

function saveVersion(record, callback) {

}

exports.handler = lambda.sources.dynamo.save(saveVersion)
```

## app api

- `lambda(...fns)`
- `lambda.sources.dynamo(...fns)`
- `lambda.sources.sns(...fns)`

## scripting api

- `lambda.scripts.env((err, result)=>)`
- `lambda.scripts.init(path, (err, result)=>)`
- `lambda.scripts.deploy`
- `lambda.scripts.package`
- `lambda.scripts.rollback`

## conventions

- slack style results
- errors always an array of Errors but serialized at the last callsite as array of json objects
- results always an object with at least one key
