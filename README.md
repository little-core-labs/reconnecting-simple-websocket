# reconnecting-simple-websocket
[![Actions Status](https://github.com/little-core-labs/reconnecting-simple-websocket/workflows/tests/badge.svg)](https://github.com/little-core-labs/reconnecting-simple-websocket/actions)

State machine for reconnecting [simple-websocket][sws]s.  Subclass of [reconnecting-socket][rs].

```
npm install reconnecting-simple-websocket
```

## Usage

``` js
const RSWS = require('reconnecting-simple-websocket')

const rsws = new RSWS('ws://localhost:8085', {
  onopen (socket, firstOpen) {
    // What gets called wheny you have a live socket
    console.log('onopen')
    this.pinger = setInterval(() => socket.write('ping'), 1000)
    socket.on('data', buf => console.log(buf.toString('utf8')))
  },

  onclose (socket) {
    // what to do when the socket is closed
    console.log('onclose')
    clearInterval(this.pinger)
  },

  onfail (err) {
    // handle the final error that caused the fail
    console.log('onfail')
    console.error(err)
  }
})

rsws.on('state', (st) => console.log(`state: ${st}`))
rsws.on('info', (st) => console.log(`info: ${st}`))
rsws.on('error', (err) => console.error(`error: ${err}`))

rsws.start() // start it
```

`RSWS` can also be subclassed:

```js
const RSWS = require('reconnecting-simple-websocket')

class MySWS extends RSWS {
  constructor (opts) {
    super(opts)

    this.someHandler = this.someHandler.bind(this)
  }

  someHandler (buf) {
    // whatever
  }

  onopen (socket, firstOpen) {
    this.pinger = setInterval(() => socket.write('ping'), 1000)
    socket.on('data', this.someHandler)
  }

  onclose (socket) {
    socket.removeListener('data', this.someHandler)
    clearInterval(this.pinger)
  }

  onfail (err) {
    console.error(err)
  }
}

module.exports = MySWS
```


## API

### `const RSWS = require('reconnecting-simple-websocket')`

Import the `RSWS` class.

### `rsws = new ReconnectingSocket(opts)`

Create a new reconnecting simple websocket instance.  The `opts` object can receive the user implemented methods listed below as well as the following optional options:

```js
{
  backoff: {
    strategy: 'fibonacci', // the backoff strategey to use
    failAfter: null, // the number of consecutive times to attemt a reconnect before failing
    ...backoffOptions // all the options from the backoff module
  }
}
```

See full set of backoff options here: [MathieuTurcotte/node-backoff](https://github.com/MathieuTurcotte/node-backoff#readme)

#### `rsws` Events

An instance of `rsws` inherets the same events as [reconnecting-socket][rs].

- `state`: The state emmits the following `state` strings:
  - `stopped`
  - `opening`
  - `opened`
  - `closing`
  - `closed`
  - `reopening`
  - `fail`
- `info`: Messages that can be used for debugging.
- `error`: Errors emitted by the socket or internally.  For an error handling path, see `reconnectingSocket.onfail(err)`.

### `rsws.start()`

Start the reconnecting simple websocket.

### `rsws.stop()`

Stop the reconnecting simple websocket.

## User Implemented Methods

### `rsws.onopen(socket, firstOpen)`

This method is called whenever a new socket is created and the `this.open()` method has been called, so the socket should be live and ready for data.  It receives the `socket` as well as `firstOpen` boolean which indicates if this is the first successful connection since calling `reconnectingSocket.start()`.  Interact with the socket in this function body.

### `rsws.onclose(socket)`

This method is called when the `this.close()` method is called.  Use this to clean up any event listeners or intervals used on the socket.

### `rsws.onfail(err)`

This method is called when the reconnectignSocket fails to connect after `failAfter` concecutive attempts.  It receives the last error emitted by the various moving parts.

## See also

- [reconnecting-socket][rs]
- [simple-websocket][sws]
- [ws][https://github.com/websockets/ws]

## License

MIT

[rs]: https://github.com/little-core-labs/reconnecting-socket
[sws]: https://github.com/feross/simple-websocket
