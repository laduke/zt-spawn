var path = require('path')

var test = require('tape')
var rimraf = require('rimraf')

var spawnController = require('./spawn')
var generateController = require('./generate')

var home = './tmp/'

var ztBinary = path.join(
  '/',
  'Library',
  'Application Support',
  'ZeroTier',
  'One',
  'zerotier-one'
)

test('on specific port', function (t) {
  t.plan(4)

  var port = 19993
  var opts = { ztBinary: ztBinary, port: port }

  spawnController(opts, function (err, controller) {
    if (err) throw err

    controller.proc.kill()

    t.ok(controller.token)
    t.ok(controller.proc.pid)
    t.equal(controller.port, 19993)
    t.equal(controller.address.length, 10)
  })
})

test('on random port', function (t) {
  t.plan(4)

  var opts = { ztBinary: ztBinary, home: home }

  spawnController(opts, function (err, controller) {
    if (err) throw err

    controller.proc.kill()

    t.ok(controller.port)
    t.ok(controller.token)
    t.ok(controller.proc.pid)
    t.equal(controller.address.length, 10)
  })
})

test('Generate controller home then spawn there', function (t) {
  t.plan(1)

  var opts = { ztBinary: ztBinary }

  generateController(opts, function (err, homeDir) {
    if (err) throw err
    spawnController(opts, callback)
  })

  function callback (err, controller) {
    if (err) throw err
    controller.proc.kill()
    t.ok(controller.port)

    rimraf(home + '/*', function (err, res) {
      if (err) throw err
    })
  }
})
