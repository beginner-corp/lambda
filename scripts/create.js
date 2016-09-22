#!/usr/bin/env node
var write = require('fs').writeFileSync
var mkdirp = require('mkdirp').sync
var name = process.argv[2]
var exists = require('path-exists').sync
var last = require('lodash').last

if (typeof name === 'undefined') {
  console.error('Error: name required')
  process.exit(1)
}

if (exists(name)) {
  console.error('Error: name exists')
  process.exit(1)
}

var package = {
  json: {
    "name": last(name.split('/')),
    "version": "1.0.0",
    "main": "index",
    "lambda": {
      "role": "lambda_basic_execution"
    },
    "scripts": {
      "test": "node test | tap-spec"
    },
    "dependencies": {
      "@smallwins/lambda": ">5.0.0",
      "@smallwins/validate": ">4.0.0"
    },
    "devDependencies": {
      "tap-spec": "^4.1.1",
      "tape": "^4.5.1"
    }
  }
}

var index = {
  js: `var validate = require('@smallwins/validate')
var lambda = require('@smallwins/lambda')

function valid(event, callback) {
  var schema = {}
  validate(event, schema, callback)
}

function fn(event, callback) {
  // callback(Error('name failed'))
  callback(null, {ok:true})
}

exports.handler = lambda(valid, fn)
    `
}

var test = {
  js: `
var test = require('tape')
var fn = require('./').handler

test('sanity', t=> {
  t.plan(1)
  t.ok(fn, 'lambda function exists')
})
    `
}

// create the lambda
mkdirp(name)
write(`${name}/package.json`, JSON.stringify(package.json, null, 2))
write(`${name}/index.js`, index.js)
write(`${name}/test.js`, test.js)
