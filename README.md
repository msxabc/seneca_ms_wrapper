# seneca_ms_wrapper

## sample usage
```
var ms = require('seneca_ms_wrapper');

ms.createMs()
.use(__dirname + '/lib')
.listen({
  type: 'amqp',
  pin: {
    role: '*',
    cmd: '*'
  }
});

```
