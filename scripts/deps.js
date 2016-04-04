#!/usr/bin/env node
var glob = require('glob').sync
var join = require('path').join
var name = process.argv[2] || 'src/lambdas/*'
var path = join(process.cwd(), name)
var dirs = glob(path)
var chalk = require('chalk')
var lodash = require('lodash')

console.log(chalk.green(' λ ') + chalk.grey.dim('analyzing local dependencies'))
dirs.forEach(dir=> {
  var pkg = join(dir, 'package.json')
  var json = require(pkg)
  console.log(chalk.green(' λ '))
  console.log(chalk.green(' λ ') + chalk.underline.dim.cyan(json.name))
  if (json.dependencies) {
    Object.keys(json.dependencies).forEach(k=> {
      var f = lodash.padEnd(` - ${k}`, 30, '.')
      var l = lodash.padStart(`${json.dependencies[k]}`, 11, '.')
      console.log(chalk.green(' λ ') + chalk.dim(f) + chalk.dim.yellow(l))
    })
  }
  if (json.devDependencies) {
    Object.keys(json.devDependencies).forEach(k=> {
      var f = lodash.padEnd(` - ${k}`, 30, '.')
      var l = lodash.padStart(`${json.devDependencies[k]}`, 11, '.')
      console.log(chalk.green(' λ ') + chalk.dim(f) + chalk.dim.yellow(l))
    })
  }
  if (!json.dependencies && !json.devDependencies) {
    console.log(chalk.green(' λ ') + chalk.dim(' x no deps'))
  }
})

console.log(chalk.green(' λ '))
