#!/usr/bin/env node
var async = require('async')
var lodash = require('lodash') 
var chalk = require('chalk')
var aws = require('aws-sdk')
var region = process.env.AWS_REGION || 'us-east-1'
var cw = new aws.CloudWatchLogs({region:region})
var exists = require('path-exists').sync

function stream(name, callback) {
  cw.describeLogStreams({
    logGroupName: name
  }, callback)
}

var name = process.argv[2]
if (lodash.isUndefined(name)) {
  console.error('Error: missing path to the lambda')
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
if (lodash.isUndefined(actual)) {
  console.error('Error: package.json missing name')
  process.exit(1)
}

// setup the name
name = '/aws/lambda/' + package.json.name 

// get the stream
stream(name, (err, result)=> {

  // get the events
  var names = result.logStreams.map(l=> l.logStreamName)
  var handlers = names.map(n=> {
    return function (callback) {
      var params = {
        logGroupName: name, 
        logStreamName: n 
      }
      cw.getLogEvents(params, callback) 
    }
  })

  // grab the events in parallel and then display then
  async.parallel(handlers, (err, results)=> {
    var events = lodash.flatten(results.map(r=>r.events))
    events.forEach(e=> {

      // ugh
      var strftime = require('strftime')
      var left = chalk.dim.green(' λ ') + chalk.grey.dim(strftime('%b%e,%l:%M:%S ', new Date(e.timestamp)))
      var right = chalk.green(e.message)
      var isStart = /START RequestId:/.test(e.message)
      var isEnd = /END RequestId:/.test(e.message)
      var isReport = /REPORT RequestId:/.test(e.message)
      var logexp = /(\d+-\d+-\d+T\d+:\d+:\d+.\d+Z)\s+(\w+-\w+-\w+-\w+-\w+)/
      var isLog = logexp.test(e.message)

      if (isLog) {
        var clean = e.message.replace(logexp, '')
        console.log(left + chalk.dim.green(clean.split('\n').join('\n' + left)))
      }

      if (isReport) {
        report = e.message.split('\t')
        var sha = report[0].match(/REPORT RequestId: (\w+)-/)[1] // /REPORT RequestId: (\w+)-/.match(report[0])
        var duration = report[1].replace('Duration:','')
        right = chalk.cyan.underline.dim('@' + sha) + chalk.dim(duration)
        console.log(left + right)
      }

      if (!isStart && !isEnd && !isReport && !isLog) { 
        right = chalk.green(right.split('\n').join('\n' + left))
        console.log(left + right)
      }
    })
  })
})
