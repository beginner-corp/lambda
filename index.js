var lambda = require('./_lambda')
var dynamo = require('./_dynamo')
var local = require('./_local') 
var sns = require('./_sns')

lambda.local = local
lambda.triggers = {dynamo, sns}

module.exports = lambda
