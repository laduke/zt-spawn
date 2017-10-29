var test = require('tape')

var path = require('path')
var spawnController = require('./index')
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
    t.equal(controller.id.length, 10)
  })
})

test('on random port', function (t) {
  t.plan(4)

  var home = './tmp'
  var opts = { ztBinary: ztBinary, home: home }

  spawnController(opts, function (err, controller) {
    if (err) throw err

    controller.proc.kill()

    t.ok(controller.port)
    t.ok(controller.token)
    t.ok(controller.proc.pid)
    t.equal(controller.id.length, 10)
  })
})
