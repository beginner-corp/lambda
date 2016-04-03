#!/usr/bin/env node

var aws = require('aws-sdk')
var region = process.env.AWS_REGION || 'us-east-1'
var lambda = new aws.Lambda({region:region})
var chalk = require('chalk')
var startsWith = require('lodash').startsWith
var filtering = process.argv[2] || ''

function log(txt) {
  console.log(chalk.green(' λ ') + chalk.cyan.underline.dim(txt))
}
lambda.listFunctions({}, (err, fns)=> {
  console.log(chalk.green(' λ ') + chalk.dim.grey('listing deployed lambdas' ))
  var names = fns.Functions.map(f=> f.FunctionName).sort().filter(name=> startsWith(name, filtering))
  names.forEach(log)
  console.log(chalk.green(' λ '))
})
