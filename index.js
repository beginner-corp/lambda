var lambda = require('./_lambda')
var dynamo = require('./_dynamo')
var local = require('./_local') 

lambda.local = local
lambda.triggers = {dynamo}

module.exports = lambda
