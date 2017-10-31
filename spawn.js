var spawn = require('child_process').spawn
var fs = require('fs')

var freeport = require('freeport')

module.exports = function spawnController (opts, cb) {
  if (!opts.port) {
    freeport(function (err, port) {
      if (err) throw err

      opts.port = port

      return spawner(opts, cb)
    })
  } else {
    spawner(opts, cb)
  }
}

function spawner (opts, cb) {
  var result = {}
  if (!opts.home) opts.home = './tmp'
  var idPath = opts.home + '/identity.public'
  var tokenPath = opts.home + '/authtoken.secret'

  var proc = spawn(opts.ztBinary, ['-U', `-p${opts.port}`, opts.home], {
    detached: false,
    stdio: ['pipe', 'ipc', 'pipe'],
    shell: false
  })

  result.port = opts.port
  result.proc = proc
  result.token = ''
  result.address = ''

  waitFile(tokenPath, function (err, token) {
    if (err) console.error(err)
    result.token = token
    waitFile(idPath, function (err, identity) {
      if (err) console.error(err)
      result.address = getAddress(identity)
      cb(err, result)
    })
  })
}

function waitFile (path, cb, count) {
  if (!count) count = 0
  if (count > 99) throw new Error('Tried too many times ' + path)

  fs.readFile(path, { encoding: 'utf8' }, function (err, res) {
    if (err) {
      setTimeout(function () {
        waitFile(path, cb, count + 1)
      }, 10)
    } else {
      cb(null, res)
    }
  })
}

function getAddress (str) {
  return str.split(':')[0]
}
