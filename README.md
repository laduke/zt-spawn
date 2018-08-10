# Spawn a ZeroTier
Then you can talk to it's [json api](https://github.com/zerotier/ZeroTierOne/tree/master/controller) at `localhost:${port}/controller`

```javascript
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

var home = './tmp'
var opts = { ztBinary: ztBinary, home: home }

spawnController(opts, function (err, controller) {
  if (err) throw err

  var { proc, controllerId, authtoken, port } = controller
  
  // do stuff

})
```
