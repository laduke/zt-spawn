var spawn = require('child_process').spawn
var join = require('path').join
var assert = require('assert')
var fs = require('fs')

module.exports = function spawnController (opts, cb) {
  spawner(opts, cb)
}

function spawner (opts, cb) {
  assert(opts.ztBinary, 'need path to a zerotier-one binary in options arg')
  assert(opts.home, 'need path to a str dir in options arg')
  assert(opts.port, 'need port in options arg')

  var regex = new RegExp(`zerotier-one.*${opts.home}`)
  matchRunningProcess(regex, function (_err, res) {
    if (res) {
      var e = new Error('ZeroTier one instance already running in working dir: ' + opts.home)
      return cb(e)
    }

    var proc = spawn(opts.ztBinary, ['-U', `-p${opts.port}`, opts.home], {
      detached: false,
      stdio: ['pipe', 'ipc', 'pipe'],
      shell: false
    })

    waitFile(join(opts.home, 'zerotier-one.pid'), function (err, pid) {
      if (err) return cb(err)

      waitFile(join(opts.home, 'zerotier-one.port'), function (err, pid) {
        if (err) return cb(err)

        cb(null, proc)
      })
    })
  })
}

function waitFile (path, cb, count) {
  if (!count) count = 0
  if (count > 500) throw new Error('Waited too long for file to appear ' + path)

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

function matchRunningProcess (regex, cb) {
  var ps = spawn('ps', ['ax'])
  var res = false

  ps.stdout.on('data', data => {
    var s = data.toString()
    var found = s.match(regex)
    if (found) {
      res = true
    }
  })

  ps.on('close', code => {
    cb(null, res)
  })
}
