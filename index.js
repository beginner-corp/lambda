var lambda = require('./src/lambda')
var dynamo = require('aws-dynamodb-lambda-trigger/lambda')
var sns = require('./src/sns')

lambda.triggers = {dynamo:dynamo, sns:sns}

module.exports = lambda
