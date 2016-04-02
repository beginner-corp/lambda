[ ![Codeship Status for smallwins/lambda](https://codeship.com/projects/2e4082e0-d808-0133-2035-1eae90b9310e/status?branch=master)](https://codeship.com/projects/143109)

---

## @smallwins/lambda λ:satellite: 

- Author your AWS Lambda functions as pure node style callbacks (aka errbacks)
- Familiar middleware pattern for composition
- Event sources like DynamoDB triggers and SNS topics too
- Helpful npm scripts `lambda-create`, `lambda-list`, `lambda-deploy` and `lambda-invoke`

#### return json results :mailbox:

Lets look at a vanilla AWS Lambda example. Here is a Lambda for performing a sum. Given `event.query.x = 1` it will return `{count:2}`.

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

`@smallwins/validate` takes care of parameter validations. The callback style above enjoys symmetry with the rest of Node and will automatically serialize `Error`s into JSON friendly objects including any stack trace. All you need to do is wrap a vanilla node errback function in `lambda` which returns your function with an AWS Lambda friendly signature.

#### easily chain dependant actions ala middleware :loop::loop::loop:

Building on this foundation we can compose multiple errbacks into a Lambda. Lets compose a Lambda that: 

- Validates parameters
- Checks for an authorized account
- And then either returns data safely
- Or if anything fails return JSON serialized `Error` array

```javascript
var validate = require('@smallwins/validate')
var lambda = require('@smallwins/lambda')

function valid(event, callback) {
  var schema = {
    'body':          {required:true, type:Object},
    'body.username': {required:true, type:String},
    'body.password': {required:true, type:String}
  }
  validate(event, schema, callback)
}

function authorized(event, callback) {
  var loggedIn = event.body.username === 'sutro' && event.body.password === 'cat'
  if (!loggedIn) {
    // err first
    callback(Error('not found'))
  }
  else {
    // successful login
    event.account = {
      loggedIn: loggedIn,
      name: 'sutro furry pants'
    }
    callback(null, event)
  }
}

function safe(event, callback) {
  callback(null, {account:event.account})
}

exports.handler = lambda(valid, authorized, safe)
```

In the example above our functions are executed in series passing event through each invocation. `valid` will pass event to `authorized` which in turn passes it to `save`. Any `Error` returns immediately so if we make it the last function we just send back the resulting account data. Clean!

#### save a record from a dynamodb trigger :point_right::floppy_disk:

AWS DynamoDB can invoke a Lambda function if anything happens to a table. 

```javascript
var lambda = require('@smallwins/lambda')

function save(record, callback) {
  console.log('save a version ', record)
  callback(null, record)
}

exports.handler = lambda.sources.dynamo.save(save)
```

#### api :thought_balloon:

- `lambda(...fns)`
- `lambda.sources.dynamo.all(...fns)`
- `lambda.sources.dynamo.save(...fns)`
- `lambda.sources.dynamo.insert(...fns)`
- `lambda.sources.dynamo.modify(...fns)`
- `lambda.sources.dynamo.remove(...fns)`

A handler looks something like this

```javascript    
function handler(event, callback) {
  // process event, use to pass data
  var result = {ok:true, event:event}
  callback(null, result)
}
```

#### regarding errors :x::interrobang:

Good error handling makes your programs far easier to maintain. (This is a good guide.)[https://www.joyent.com/developers/node/design/errors]. When using `@smallwins/lambda` always use `Error` type as the first parameter to callback: 

```javascript
function fails(event, callback) {
  callback(Error('something went wrong')
}
```

Or an `Error` array:

```javascript
function fails(event, callback) {
  callback([
    Error('missing email'), 
    Error('missing password')
  ])
}
```

`@smallwins/lambda` serializes error into Slack RPC style JSON making them easy to work from API Gateway:

```javascript
{
  ok: false, 
  errors: [
    {name:'Error', message:'missing email', stack'...'},
    {name:'Error', message:'missing password', stack'...'}
  ]
}
```

#### scripting api :memo:

`@smallwins/lambda` includes some helpful automation code perfect for npm scripts. If you have a project that looks like this:

```
project-of-lambdas/
 |-test/
 |-src/
 |  '-lambdas/
 |     |-signup/
 |     |  |-index.js
 |     |  |-test.js
 |     |  '-package.json
 |     |-login/
 |     '-logout/
 '-package.json

```

And a `package.json` like this:

```javascript
{
  "name":"project-of-lambdas",
  "scripts": {
    "create":"AWS_PROFILE=smallwins lambda-create",
    "list":"AWS_PROFILE=smallwins lambda-list",
    "deploy":"AWS_PROFILE=smallwins lambda-deploy"
    "invoke":"AWS_PROFILE=smallwins lambda-invoke"
  }
}
```

- `npm run create src/lambdas/forgot` creates a new lambda 
- `npm run list` lists all deployed lambdas 
- `npm run deploy src/lambdas/signup brian` deploys the lambda with the alias `brian`
- `npm run invoke src/lambdas/login brian '{"email":"b@brian.io", "pswd":"..."}'` to invoke a lambda

The `./scripts/invoke.js` is also a module and useful for testing.

```
var invoke = require('@smallwins/lambda/scripts/invoke')
invoke('path/to/lambda', alias, payload, (err, response)=> {
  console.log(err, response)
})
```

