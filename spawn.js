var spawn = require('child_process').spawn
var parallel = require('run-parallel')
var series = require('run-series')
var join = require('path').join
var assert = require('assert')
var mkdir = require('mkdirp')
var http = require('http')
var net = require('net')
var fs = require('fs')

module.exports = spawner

function spawner (opts, cb) {
  assert(opts.ztBinary, 'need path to a zerotier-one binary in options arg')
  assert(opts.home, 'need path to home dir in options arg')

  parallel([
    function (done) {
      // provide your own authtoken.secret if you want
      if (opts.authToken) {
        mkdir.sync(opts.home)
        fs.writeFileSync(join(opts.home, 'authtoken.secret'), opts.authToken)
        done()
      } else {
        done()
      }
    },
    function (done) { checkPIDfile(opts.home, done) },
    function (done) {
      checkPortFile(opts.home, function (err, port) {
        if (err) return done(null, { lastPort: null })
        done(null, { lastPort: Number(port) })
      })
    },
    function (done) {
      getRandomPort(function (err, randomPort) {
        if (err) throw (err)

        done(null, { randomPort })
      })
    }
  ],
  function (err, res) {
    if (err) throw (err)

    var props = smoosh(res)
    var port = props.lastPort || props.randomPort

    var proc

    series([
      function (done) {
        proc = spawn(opts.ztBinary, ['-U', `-p${port}`, opts.home], {
          detached: false,
          shell: false
        })
        done(null, { proc })
      },
      function (done) {
        waitForHttp(port, function (err) {
          done(err, { port })
        })
      },
      function (done) {
        getControllerId(opts.home, function (err, controllerId) {
          done(err, { controllerId })
        })
      },
      function (done) {
        getAuthToken(opts.home, function (err, authToken) {
          done(err, { authToken })
        })
      }
    ], function (err, res) {
      if (err) throw (err)

      cb(null, smoosh(res))
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

function smoosh (arr) {
  return arr.reduce(function (acc, el) {
    return Object.assign({}, acc, el)
  })
}
