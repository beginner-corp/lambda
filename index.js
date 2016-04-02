var lambda = require('./src/lambda')
var dynamo = require('./src/dynamo')
var sns = require('./src/sns')

lambda.sources = {dynamo:dynamo, sns:sns}

module.exports = lambda
