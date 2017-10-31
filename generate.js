var spawn = require('child_process').spawn
var crypto = require('crypto')
var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')

module.exports = function generate (opts, cb) {
  idTool(opts, function (err, ids) {
    if (err) throw err

    authToken(24, function (err, token) {
      if (err) throw err

      var controller = {
        address: getAddress(ids),
        public: getPublicId(ids),
        secret: getPrivateId(ids),
        token: token,
        baseDir: opts.baseDir
      }

      createHomeDir(controller, function (err, res) {
        if (err) throw err

        cb(null, res)
      })
    })
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

function authToken (size, cb) {
  crypto.randomBytes(24, function (err, bytes) {
    if (err) {
      return cb(err, null)
    }

    let authToken = ''
    for (var i = 0; i < 24; ++i) {
      authToken += 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789'.charAt(
        bytes.readUInt8(i) % 55
      )
    }

    cb(null, authToken)
  })
}

function createHomeDir (opts, cb) {
  if (!opts.baseDir) opts.baseDir = './tmp'

  var homeDir = path.join(opts.baseDir, opts.address)
  mkdirp(homeDir, function (err, res) {
    if (err) throw err

    fs.writeFile(path.join(homeDir, 'authtoken.secret'), opts.token, function (err, res) {
      if (err) throw err

      fs.writeFile(path.join(homeDir, 'identity.public'), opts.public, function (err, res) {
        if (err) throw err

        fs.writeFile(path.join(homeDir, 'identity.secret'), opts.secret, function (err, res) {
          if (err) throw err

          fs.readdir(homeDir, function (err, files) {
            if (err) throw err
            cb(null, homeDir)
          })
        })
      })
    })
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
