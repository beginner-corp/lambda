#!/usr/bin/env node
var aws = require('aws-sdk')
var async = require('async')
var region = process.env.AWS_REGION || 'us-east-1'
var lambda = new aws.Lambda({region:region})
var chalk = require('chalk')
var isUndefined = require('lodash').isUndefined
var exists = require('path-exists').sync
var read = require('fs').readFileSync
var rimraf = require('rimraf').sync
var exec = require('child_process').exec
var join = require('path').join
//
// usage
//
//   npm run deploy path/to/function alias
//
// example usage:
//
//   npm run deploy path/to/lamba-fn brian
//
// (will deploy the lambda using package.json for the name and then alias it to brian)
//
var name = process.argv[2]
if (isUndefined(name)) {
  console.error('Error: missing path to the lambda')
  process.exit(1)
}

var alias = process.argv[3]
if (isUndefined(alias)) {
  console.error('Error: missing alias argument')
  process.exit(1)
}

var pkg = name + '/package.json'
if (!exists(pkg)) {
  console.error('Error: ' + pkg + ' does not exist')
  console.error('\n')
  console.error('Create a lambda with lambda-create in an npm script.')
  console.error('\n')
  process.exit(1)
}

var package = {
  json: require(process.cwd() + '/' + pkg)
}

var actual = package.json.name
if (isUndefined(actual)) {
  console.error('Error: package.json missing name')
  process.exit(1)
}

var config = package.json.lambda
if (isUndefined(config)) {
  // try the default role (will fail b/c this isn't an arn)
  package.json.lambda = {
    role: "lambda_basic_execution"
  }
}

var role = package.json.lambda.role
if (isUndefined(role)) {
  console.error('Error: package.json missing lambda.role')
  process.exit(1)
}

console.log(chalk.green('\n λ ') + chalk.underline.cyan(package.json.name) + chalk.grey(` (alias:${alias})`))

// helper to remove trailing slash
function strip(str) {
  if(str.substr(-1) === '/') {
    return str.substr(0, str.length - 1)
  }
  return str
}

var dirname = join(process.cwd(), name)
var zip = join(process.cwd(), strip(name) + '.zip')

async.waterfall([
  function zipTmp(callback) {
    exec(`cd ${dirname} && zip -r ${zip} * --quiet`, err=> {
      if (err) {
        callback(Error(err))
      }
      else {
        console.log(chalk.green(' + ') + chalk.dim('zip the package'))
        callback()
      }
    })
  },
  function lambdaExists(callback) {
    lambda.listFunctions({}, (err, fns)=> {
      if (err) {
        callback(Error('unable to list lambdas'))
      }
      else {
        var names = fns.Functions.map(f=> f.FunctionName).sort()
        var notfound = names.indexOf(actual) === -1
        console.log(chalk.green(' + ') + chalk.dim('checking'))
        if (notfound) {
          callback(null, false)
        }
        else {
          callback(null, true)
        }
      }
    })
  },
  function create(lambdaExists, callback) {
    if (lambdaExists) {
      console.log(chalk.green(' + ') + chalk.dim('skipping create'))
      callback()
    }
    else {
      console.log(chalk.green(' + ') + chalk.dim(`create ${package.json.name}`))
      var zipfile = read(zip)
      var params = {
        Code: {
          ZipFile: zipfile
        },
        FunctionName: package.json.name,
        Handler: 'index.handler',
        Role: package.json.lambda.role,
        Runtime: 'nodejs',
        Publish: true,
        Timeout: 3
      }
      lambda.createFunction(params, (err, data)=> {
        if (err) {
          console.error(err)
          callback(Error('create failed'))
        }
        else {
          console.log(chalk.green(' + ') + chalk.dim('creating'))
          callback()
        }
      })
    }
  },
  function update(callback) {
    console.log(chalk.green(' + ') + chalk.dim('update code'))
    var zipfile = read(zip)
    var params = {
      FunctionName: package.json.name,
      Publish: true,
      ZipFile: zipfile
    }
    lambda.updateFunctionCode(params, (err, data)=> {
      if (err) {
        console.error(err)
        callback(Error('update failed'))
      }
      else {
        callback(null, data.Version)
      }
    })
  },
  function createAlias(version, callback) {
    var params = {
      FunctionName: package.json.name,
      FunctionVersion: version,
      Name: alias
    }
    lambda.createAlias(params, function(err, data) {
      console.log(chalk.green(' + ') + chalk.dim('create alias'))
      if (err) {
        // ignore the fail (just means the alias exists)
        // callback(Error('create alias failed'))
        callback(null, version)
      }
      else {
        callback(null, version)
      }
    })
  },
  function updateAlias(version, callback) {
    console.log(chalk.green(' + ') + chalk.dim(`alias code`))
    var params = {
      FunctionName: package.json.name,
      Name: alias,
      FunctionVersion: version
    }
    lambda.updateAlias(params, function(err, data) {
      if (err) {
        console.error(err)
        callback(Error('alias failed'))
      }
      else {
        var txt = chalk.green(' ✔︎ ')
        txt += chalk.dim('deployed ')
        txt += chalk.underline.cyan(`${package.json.name}@${version}`)
        txt += chalk.dim(` (alias:${alias})`)
        console.log(txt)
        callback()
      }
    })
  },
  function cleanupZip(callback) {
    rimraf(zip)
    callback()
  }],
  function done(err) {
    if (err) {
      console.error(err)
      process.exit(1)
    }
    else {
      console.log('\n')
      process.exit(0)
    }
  }
)
