const RSWS = require('../../.')

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
