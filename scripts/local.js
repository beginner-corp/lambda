#!/usr/bin/env node
var lambda = require('../')
var lodash = require('lodash')
var chalk = require('chalk')
var exists = require('path-exists').sync
var read = require('fs').readFileSync
var join = require('path').join

function fail(txt) {
  console.error(chalk.red(txt))
}
function info(txt) {
  console.log(chalk.dim.grey(txt))
}
function log(o) {
  console.log(chalk.green(JSON.stringify(o, null, 2)))
}
/**
 * local invokes a function using lambda.local
 *
 */
var name = process.argv[2]
if (lodash.isUndefined(name)) {
  fail('Error: missing path to the lambda')
  process.exit(1)
}

var pkg = name + '/package.json'
if (!exists(pkg)) {
  fail('Error: ' + pkg + ' does not exist')
  fail('\n')
  info('Create a lambda with lambda-create in an npm script.')
  fail('\n')
  process.exit(1)
}

var fn = require(join(process.cwd(), name))
var missingHandler = lodash.isUndefined(fn.handler)
if (missingHandler) {
  fail('Error: lambda module missing "handler" key')
  fail('\n')
  process.exit(1)
}

var payload = {}
try {
  payload = JSON.parse(process.argv[3])
}
catch(e) {
  // the sound of silence
  fail('Error: invalid JSON payload')
  info('Using {} for payload instead')
}

lambda.local(fn.handler, payload, function done(err, results) {
  if (err) {
    log(err)
  }
  else {
    log(results)
  }
})
