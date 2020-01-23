const Socket = require('simple-websocket')
const ReconnectingSocket = require('reconnecting-socket')
const assert = require('nanoassert')

class RSWS extends ReconnectingSocket {
  constructor (url, opts) {
    assert(url, 'URL parameter is included')
    assert(typeof url === 'string', 'URL parameter is a string')

    super(opts)

    this.url = url
  }

  create () {
    const socket = new Socket(this.url)

    socket.once('connect', this.open)
    socket.once('close', this.close)
    socket.once('error', this.error)

    return socket
  }

  destroy (socket) {
    socket.destroy()
  }
}

module.exports = RSWS
