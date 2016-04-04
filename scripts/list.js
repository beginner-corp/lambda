#!/usr/bin/env node
var async = require('async')
var aws = require('aws-sdk')
var region = process.env.AWS_REGION || 'us-east-1'
var lambda = new aws.Lambda({region:region})
var chalk = require('chalk')
var startsWith = require('lodash').startsWith
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
        var readable = na.Aliases.map(a=> `${a.Name}@${a.FunctionVersion}`)
        callback(err, {name:name, aliases:readable})
      })
    }
  })
  function done(err, result) {
    if (err) {
      callback(err)
    }
    else {
      callback(null, result)
    }
  }
  async.parallel(handlers, done)
}

async.waterfall([list, aliases], function complete(err, result) {
  result.forEach(row=> {
    // var alias = row.aliases.join(' ')
    info(row.name)
    row.aliases.forEach(a=> {
      console.log(chalk.green(' λ ') + chalk.grey(' - ' + a))
    })
    console.log(chalk.green(' λ '))
  })
})
