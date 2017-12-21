var path = require('path')

var test = require('tape')
var spawnController = require('./spawn')
var generateController = require('./generate')
var readController = require('./read')

var ztBinary = path.join(__dirname, 'zerotier-one')
var baseDir = 'tmp'

test('Generate controller home', function (t) {
  t.plan(1)

  var opts = { ztBinary: ztBinary, baseDir: baseDir }

  generateController(opts, function (err, res) {
    if (err) throw err

    t.equal(res.address.length, 10)
  })
})

test('Generate then spawn', function (t) {
  t.plan(1)

  var opts = { ztBinary: ztBinary, baseDir: baseDir }

  generateController(opts, function (err, res) {
    if (err) throw err

    opts.home = res.home
    opts.port = 19994
    spawnController(opts, function (err, res) {
      if (err) throw err

      res.kill()
      t.ok(res.pid)
    })
  })
})

test('Read controller home', function (t) {
  t.plan(1)

  var opts = { ztBinary: ztBinary, baseDir: baseDir }

  generateController(opts, function (err, res) {
    if (err) throw err

    opts.home = res.home
    readController(opts, function (err, res) {
      if (err) throw err

      t.ok(res.secret)
    })
  })
})

test('do not start multiple in same working dir', function (t) {
  t.plan(2)

  var opts = { ztBinary: ztBinary, baseDir: baseDir }

  generateController(opts, function (err, controllerOpts) {
    if (err) throw err

    opts.home = controllerOpts.home
    opts.port = 19995

    spawnController(opts, function (err, res) {
      if (err) throw err

      t.notOk(err)

      opts.port = 19996
      spawnController(opts, function (err) {
        res.kill()
        t.ok(err)
      })
    })
  })
})

test('do not start multiple on same port', function (t) {
  t.plan(2)

  var opts = { ztBinary: ztBinary, baseDir: baseDir }

  generateController(opts, function (err, controllerOpts) {
    if (err) throw err

    opts.home = controllerOpts.home
    opts.port = 19995

    spawnController(opts, function (err, res) {
      if (err) throw err

      t.notOk(err)

      spawnController(opts, function (err) {
        res.kill()
        t.ok(err)
      })
    })
  })
})


test('respawn', function (t) {
  t.plan(1)

  var opts = { ztBinary: ztBinary, baseDir: baseDir }

  generateController(opts, function (err, controllerOpts) {
    if (err) throw err

    opts.home = controllerOpts.home
    opts.port = 19995

    spawnController(opts, function (err, res) {
      if (err) throw err
      res.kill()

      res.on('exit', function (code) {
        opts.port = 19996
        spawnController(opts, function (err, res) {
          if (err) throw err
          res.kill()
          t.ok(res)
        })
      })
    })
  })
})
