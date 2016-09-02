var aws = require('aws-sdk')
var lambda = new aws.Lambda

function list(state, callback) {
  
  var params = state.start? {Marker:state.start} : {}

  lambda.listFunctions(params, function __listedFunctions(err, result) {
    // bail if things get weird
    if (err) {
      console.log(err)
      throw Error('failed to list lambdas')
    }
    
    // if the state had fns concat (otherwise just set)
    state.fns = state.fns? state.fns.concat(result.Functions) : result.Functions

    if (result.NextMarker) {
      // if the result has anoteh page set the start
      state.start = result.NextMarker
      // recursion!!
      list(state, callback)
    }
    else {
      callback(null, state.fns)
    }
  })
}

module.exports = list
