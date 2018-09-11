var spawn = require('child_process').spawn
var join = require('path').join
var auto = require('run-auto')
var assert = require('assert')
var mkdir = require('mkdirp')
var http = require('http')
var net = require('net')
var fs = require('fs')

module.exports = spawner

function spawner (opts, cb) {
  assert(opts.execPath, 'need path to a zerotier-one binary in options arg')
  assert(opts.home, 'need path to home dir in options arg')

  var proc

  mkdir.sync(opts.home)

  auto({
    writeAuthToken: function (done) {
      writeAuthToken(opts, done)
    },
    checkPID: function (done) {
      checkPIDfile(opts.home, done)
    },
    previousPort: function (done) {
      checkPortFile(opts.home, done)
    },
    randomPort: ['previousPort', function (results, done) {
      if (!results.checkPort) {
        getRandomPort(done)
      } else done()
    }],
    port: ['previousPort', 'randomPort', function (results, done) {
      done(null, results.previousPort || results.randomPort)
    }],
    spawn: ['port', function (results, done) {
      proc = spawn(opts.execPath, ['-U', `-p${results.port}`, opts.home], {
        detached: false,
        shell: false
      })

      done(null, proc)
    }],
    waitForService: ['spawn', function (results, done) {
      waitForHttp(results.port, function (err) {
        done(err)
      })
    }],
    nodeId: ['waitForService', function (results, done) {
      getControllerId(opts.home, function (err, nodeId) {
        done(err, nodeId)
      })
    }],
    authToken: ['waitForService', function (results, done) {
      getAuthToken(opts.home, function (err, authToken) {
        done(err, authToken)
      })
    }]
  }, function (err, results) {
    if (err) throw (err)

    var { port, nodeId, authToken, spawn: childProcess } = results

    cb(null, { port, nodeId, authToken, childProcess })
  })

  process.on('uncaughtException', function (e) {
    console.error(e)
    proc.kill()
    process.exit(1)
  })

  process.once('SIGUSR2', function () {
    // helps nodemon
    proc.kill()
    proc.on('close', function () {
      process.kill(process.pid, 'SIGUSR2')
    })
  })
}

function checkPIDfile (home, cb) {
  var path = join(home, 'zerotier-one.pid')

  fs.readFile(path, { encoding: 'utf8' }, function (_err, res) {
    if (res) {
      var e = new Error(
        'ZeroTier one instance already running in working dir: ' + home
      )
      return cb(e)
    } else {
      return cb(null, true)
    }
  })
}

function checkPortFile (home, cb) {
  var path = join(home, 'zerotier-one.port')

  fs.readFile(path, { encoding: 'utf8' }, function (err, res) {
    if (err) return cb(null, null)

    return cb(null, res)
  })
}
function getRandomPort (cb) {
  var server = net.createServer()
  server.unref()
  server.on('error', cb)

  server.listen(0, function () {
    var port = server.address().port
    server.close(function () {
      cb(null, port)
    })
  })
}

function waitForHttp (port, cb) {
  setTimeout(main, 10)

  function main () {
    var request = http.request({ port }, function (response) {
      if (response) {
        cb()
      }
    })

    request.on('error', function (e) {
      retry()
    })
    request.end()

    function retry () {
      setTimeout(main, 200)
    }
  }
}

function getControllerId (home, cb) {
  fs.readFile(home + '/identity.public', 'utf8', function (err, res) {
    if (err) { return cb(err) }

    cb(null, res.split(':')[0])
  })
}

function getAuthToken (home, cb) {
  fs.readFile(home + '/authtoken.secret', 'utf8', function (err, res) {
    if (err) { return cb(err) }

    cb(null, res)
  })
}

function writeAuthToken (opts, cb) {
  if (opts.authToken) {
    fs.writeFile(join(opts.home, 'authtoken.secret'), opts.authToken, cb)
  } else {
    cb()
  }
}
