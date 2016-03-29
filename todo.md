## todo api

- `lambda.sources.dynamo(...fns)`
- `lambda.sources.sns(...fns)`

## scripting api

- `lambda.scripts.env((err, result)=>)`
- `lambda.scripts.init(path, (err, result)=>)`
- `lambda.scripts.deploy`
- `lambda.scripts.package`
- `lambda.scripts.rollback`

## thoughts

- dead easy npm run scripts for: init, deploy & rollback
- no implicit conventions / everything configurable in package.json / smart defaults
- no perscribed project structure or folder constraints
- return clean slack rpc-style json (works well w/ api gateway)

