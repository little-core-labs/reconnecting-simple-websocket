const WebsocketServer = require('simple-websocket/server')
const protocol = require('rpc-protocol')

const wss = new WebsocketServer({
  port: 8085,
  host: '127.0.0.1' // locals only
})

wss.on('connection', (socket) => {
  console.log('client connected')

  const rpc = protocol({ stream: socket })

  socket.on('close', () => {
    // clean up any remaining listeners when the socket is closed
    process.removeListener('SIGINT', endSession)
    process.removeListener('SIGTERM', endSession)
  })

  rpc.command('echo', (req) => {
    console.log(req.arguments)
    return req.arguments
  })

  rpc.command('ping', (req) => {
    console.log(`ping: pong`)
    return 'pong'
  })

  process.once('SIGINT', endSession)
  process.once('SIGTERM', endSession)

  function endSession () {
    // End sessions from the secure stream
    socket.end(() => console.log(`session is ended`))
  }
})

wss.on('error', (err) => {
  console.error('server error:')
  console.error(err)
})

process.once('SIGINT', quit)
process.once('SIGTERM', quit)

function quit () {
  console.log('server is shutting down')
  wss.close((err) => {
    // Runs after all sessions are ended.  You should set up session
    // signalling  or listen to the same ending signal from the session.
    if (err) throw err
    console.log('server gracefully shutdown')
  })
}
