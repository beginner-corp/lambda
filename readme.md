[ ![Codeship Status for smallwins/lambda](https://codeship.com/projects/2e4082e0-d808-0133-2035-1eae90b9310e/status?branch=master)](https://codeship.com/projects/143109)

---

# λ @smallwins/lambda

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
    // otherwise Error would return [{}, {}, {}, {}]
    var err = errors.map(function(e) {return e.message})
    context.fail(err) 
  }
  else {
    context.succeed({count:event.query.x + 1})
  }
}
```

A huge amount of this code is working around quirky parameter validations. Builtin `Error` needs manual serialization (and you still lose the stack trace). The latter part of the code uses the funky AWS `context` object. 

We can do better:

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
    var result = {count:event.query.x + 1}
    callback(null, result)
  }
}

exports.handler = lambda(sum)
```

The `validate` library above takes care of builtin parameter validations. It can also handle custom types. The callback style above enjoys symmetry with the rest of Node and will automatically serialize `Error`s into JSON friendly objects including any stack trace. Finally we wrap our function using `lambda` which will return a function with an AWS Lambda friendly signature.

## easily chain dependant actions ala middleware

Building on this foundation we can compose multiple errbacks into a Lambda. Lets compose a Lambda that: 

- Validate parameters
- Check for an authorized account
- And then either returns data safely (or calls back with errors)

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

In the example above our functions are executed in series. Errors will halt execution and return immediately so if we make it the last function we just send back the resulting account data. Clean!

## save a record from a dynamodb trigger    

AWS DynamoDB can invoke a Lambda function if anything happens to a table. 

```javascript
var lambda = require('@smallwins/lambda')

exports.handler = lambda(function saveVersion(record, callback) {

})
```

## app api

- `lambda(...fns)`
