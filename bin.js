#!/usr/bin/env node

var { tmpdir, platform } = require('os')
var { join } = require('path')

var spawner = require('./spawn')

// TODO host prebuilded zerotier-one builds
var ztBinary = platform() === 'darwin'
  ? '/Library/Application Support/ZeroTier/One/zerotier-one'
  : '/var/lib/zerotier-one/zerotier-one/'

var home = join(tmpdir(), 'zt-spawn')

console.log('spawning in: ', home)
spawner({ ztBinary, home, authToken: 'hunter' }, function (err, res) {
  if (err) throw (err)

  console.log('ready - port:', res.port, 'controller id: ', res.controllerId, 'token: ', res.authToken)
})
