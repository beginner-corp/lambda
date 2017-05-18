var lambda = require('./_lambda')
var dynamo = require('./_dynamo')
var local = require('./_local') 
var sns = require('./_sns')
var json = require('./_arc')

lambda.local = local
lambda.triggers = {dynamo, sns}
lambda.arc = {}
lambda.arc.json = json

module.exports = lambda
