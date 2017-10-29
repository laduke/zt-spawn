# Spawn a ZeroTier
Then you can talk to it's [json api](https://github.com/zerotier/ZeroTierOne/tree/master/controller) at `localhost:${port}/controller`

See the tests

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
var port = 19993
var opts = { ztBinary: ztBinary, home: home, port: port }

spawnController(opts, function (err, controller) {
  if (err) throw err
  
  // do stuff

  controller.proc.kill()
})
```

## todo 
- [ ] let it start in a linux network namespace if one is provided
- [ ] it can talk over stdio, but i'm not that familiar with it yet; it's be cool to make some node streams.
