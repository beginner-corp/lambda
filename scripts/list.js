#!/usr/bin/env node
var async = require('async')
var aws = require('aws-sdk')
var region = process.env.AWS_REGION || 'us-east-1'
var lambda = new aws.Lambda({region:region})
var chalk = require('chalk')
var lodash = require('lodash')
var startsWith = lodash.startsWith
var padEnd = lodash.padEnd
var padStart = lodash.padStart
var filtering = process.argv[2] || ''

function info(txt) {
  console.log(chalk.green(' λ ') + chalk.cyan.underline.dim(txt))
}

function list(callback) {
  lambda.listFunctions({}, (err, fns)=> {
    console.log(chalk.green(' λ ') + chalk.grey.dim('listing deployed lambdas'))
    var name = f=> f.FunctionName
    var start = name=> startsWith(name, filtering)
    var names = fns.Functions.map(name).filter(start).sort()
    callback(err, names)
  })
}

function aliases(names, callback) {
  var handlers = names.map(name=> {
    return function getAliasesFor(callback) {
      var params = {
        FunctionName: name,
      }
      lambda.listAliases(params, (err, na)=> {
        var readable = na.Aliases.map(a=> {
          return {
            name:a.Name,
            version:a.FunctionVersion
          }
        })
        callback(err, {name:name, aliases:readable})
      })
    }
  })
  /*
  function done(err, result) {
    if (err) {
      callback(err)
    }
    else {
      callback(null, result)
    }
  }*/
  async.parallel(handlers, callback)
}

async.waterfall([list, aliases], function complete(err, result) {
  result.forEach(row=> {
    info(row.name)
    row.aliases.forEach(a=> {
      var latest = a.version === '$LATEST'
      var ver = padStart(a.version, 25, '.')
      var ca = chalk.green(' λ ')
      var cb = chalk.grey(' - ' + padEnd(a.name, 10, '.'))
      var cc = latest? chalk.dim.grey(ver) : chalk.dim.yellow(ver)
      console.log(ca + cb + cc)
    })
    console.log(chalk.green(' λ '))
  })
})
