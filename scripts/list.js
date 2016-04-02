#!/usr/bin/env node
var aws = require('aws-sdk')
var region = process.argv[2] || 'us-east-1'
var lambda = new aws.Lambda({region:region})
var chalk = require('chalk')

lambda.listFunctions({}, (err, fns)=> {
  var names = fns.Functions.map(f=> f.FunctionName).sort()
  names.forEach(name=> {
    console.log(chalk.green(' λ ') + chalk.yellow(name))
  })
})
