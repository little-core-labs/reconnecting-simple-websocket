const Socket = require('simple-websocket')
const ReconnectingSocket = require('reconnecting-socket')

class RSWS extends ReconnectingSocket {
  constructor (url, opts) {
    if (!url) throw new Error('RSWS: missing url argument')

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
