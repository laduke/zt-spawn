var spawner = require('./spawn')

var ztBinary = '/Library/Application Support/ZeroTier/One/zerotier-one'
var home = '/tmp/zt2'

console.log('spawning')
spawner({ ztBinary, home, authToken: 'hunter' }, function (err, res) {
  if (err) throw (err)

  console.log('port:', res.port, 'controller id: ', res.controllerId, 'token: ', res.authToken)
})
