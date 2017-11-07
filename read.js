var path = require('path')
var fs = require('fs')

module.exports = function readController (opts, cb) {
  var result = {}

  readFile('authtoken.secret', function (err, res) {
    if (err) return cb(err)

    result.secret = res

    readFile('identity.public', function (err, res) {
      if (err) return cb(err)

      result.identity = res

      readFile('zerotier-one.pid', function (err, res) {
        if (err && err.code !== 'ENOENT') return cb(err)

        result.pid = res

        readFile('zerotier-one.port', function (err, res) {
          if (err && err.code !== 'ENOENT') return cb(err)

          result.port = res

          cb(null, result)
        })
      })
    })
  })

  function makePath (fileName) {
    return path.join(opts.home, fileName)
  }
  function readFile (path, cb) {
    fs.readFile(makePath(path), { encoding: 'utf8' }, cb)
  }
}
