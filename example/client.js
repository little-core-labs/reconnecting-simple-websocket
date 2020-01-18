const RSWS = require('../.')
const protocol = require('rpc-protocol')

const rsws = new RSWS('ws://localhost:8085')

rsws.on('state', (st) => console.log(`state: ${st}`))
rsws.on('info', (st) => console.log(`info: ${st}`))
rsws.on('error', (err) => console.error(`error: ${err}`))

let pinger

function onConnect (socket) {
  const rpc = protocol({ stream: socket })

  rpc.call('echo', 'hello world', (err, res) => {
    if (err) return console.error(err)
    console.log(res) // [ 'hello world' ]
  })

  function receivePong (err, res) {
    if (err) console.error(err)
    console.log(res)
  }

  pinger = setInterval(() => {
    console.log('ping')
    rpc.call('ping', null, receivePong)
  }, 1000)
}

rsws.on('connect', onConnect)

rsws.on('reconnect', onConnect)

rsws.on('disconnect', (socket) => {
  window.socket = null
  clearInterval(pinger)
})

rsws.start()

window.onbeforeunload = function () {
  rsws.stop()
}
