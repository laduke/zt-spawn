var spawn = require('child_process').spawn
var crypto = require('crypto')
var mkdirp = require('mkdirp')
var assert = require('assert')
var join = require('path').join
var fs = require('fs')

module.exports = function generate (opts, cb) {
  assert(opts.ztBinary, 'need path to a zerotier-one binary in options arg')

  idTool(opts, function (err, ids) {
    if (err) cb(err, null)

    authToken(24, function (err, token) {
      if (err) cb(err, null)

      opts.token = token
      opts.public = getPublicId(ids)
      opts.address = getAddress(ids)
      opts.secretId = getPrivateId(ids)

      createHomeDir(opts, function (err, res) {
        if (err) cb(err, null)
        cb(null, res)
      })

      function createHomeDir (opts, cb) {
        assert(opts.baseDir, 'Need base dir to put controller home')

        var home = join(opts.baseDir, opts.address)

        mkdirp(home, function (err, res) {
          if (err) cb(err)

          var path = join(home, 'authtoken.secret')
          fs.writeFile(path, opts.token, function (err) {
            if (err) cb(err)

            var path = join(home, 'identity.public')
            fs.writeFile(path, opts.public, function (err) {
              if (err) cb(err)

              var path = join(home, 'identity.secret')
              fs.writeFile(path, opts.secretId, function (err) {
                if (err) cb(err)

                cb(null, {
                  address: opts.address,
                  home: home
                })
              })
            })
          })
        })
      }
    })
  })
}

function authToken (size, cb) {
  crypto.randomBytes(size || 24, function (err, bytes) {
    if (err) return cb(err, null)

    let authToken = ''
    for (var i = 0; i < 24; ++i) {
      authToken += 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789'.charAt(
        bytes.readUInt8(i) % 55
      )
    }

    cb(null, authToken)
  })
}

function idTool (opts, cb) {
  var proc = spawn(opts.ztBinary, ['generate'], {
    argv0: 'zerotier-idtool',
    stdio: 'pipe',
    detached: false,
    shell: false
  })

  var secretId = ''
  proc.stdout.on('data', function (data) {
    if (data) secretId += data.toString()
  })

  proc.on('close', function (code) {
    if (code || !secretId) {
      return cb(new Error('Identity generation failed (empty)'), null)
    }

    var ids = secretId.split(':')

    cb(null, ids)
  })
}

function getPublicId (ids) {
  return [ids[0], ids[1], ids[2]].join(':')
}

function getPrivateId (ids) {
  return ids.join(':')
}

function getAddress (ids) {
  return ids[0]
}
