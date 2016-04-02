#!/usr/bin/env node
var aws = require('aws-sdk')
var async = require('async')
var region = process.env.AWS_REGION || 'us-east-1'
var lambda = new aws.Lambda({region:region})
var chalk = require('chalk')
var isUndefined = require('lodash').isUndefined
var exists = require('path-exists').sync
var join = require('path').join

function invoke(name, alias, payload, callback) {
  // all params required
  if (isUndefined(name)) callback(Error('name required'))
  if (isUndefined(alias)) callback(Error('alias required'))
  if (isUndefined(payload)) callback(Error('payload required'))
  if (isUndefined(callback)) callback(Error('callback required'))
  // name needs to be a valid node project
  var path = join(process.cwd(), name, 'package.json')
  var missing = !exists(path)
  if (missing) callback(Error(name + ' package.json not found'))
  // the name of the lambda function
  var fn = require(path).name
  if (isUndefined(fn)) callback(Error('package.json missing "name" key'))
  // we're good!
  var params = {
    FunctionName: fn,
    LogType: 'Tail',
    Payload: payload,
    Qualifier: alias
  }
  lambda.invoke(params, function wrap(err, res) {
    if (err) {
      callback(err)
    }
    else {
      var r = JSON.parse(res.Payload)
      if (r.errorMessage) {
        callback(Error(r.errorMessage))
      }
      else {
        callback(null, r)
      }
    }
  })
}

var invoking = require.main === module
if (invoking) {

  var name = process.argv[2]
  var alias = process.argv[3]
  var payload = process.argv[4]

  console.log(chalk.green(' λ ') + chalk.dim('invoking ' + chalk.cyan(name)))

  invoke(name, alias, payload, (err, res)=> {
    if (err) {
      console.error(chalk.red(err))
    }
    else {
      var j = JSON.stringify(res, null, 2)
      console.log(chalk.green(j))
    }
  })
}

module.exports = invoke
