const tap = require('tap')
const RSWS = require('./index')
const Server = require('simple-websocket/server')

tap.test('yolo hook it all up test', t => {
  t.plan(16)
  const port = 8456
  const connections = []
  let server = new Server({ port: port })

  const serverHandler = (socket) => {
    console.log('client connected')
    connections.push(socket)
    socket.on('data', function (buf) {
      t.pass(`server received a message: ${buf.toString('utf8')}`)
      socket.write(buf.toString('utf8').toUpperCase())
    })
    socket.on('close', () => {
      t.pass('server closed')
      connections.splice(connections.find(s => s === socket), 1)
    })
    socket.on('error', err => t.error(err, 'socket should not error'))
  }

  server.on('connection', serverHandler)
  server.on('error', (err) => { t.fail(err, 'server should not emit errors') })

  function closeAllConnections () {
    connections.forEach(socket => socket.destroy())
  }

  const firstConnectPath = (buf) => {
    t.equal(buf.toString('utf8'), 'PING1', 'uppercase ping1')
    server.close()
    closeAllConnections()
    setTimeout(() => {
      console.log('server starting again')
      server = new Server({ port: port })
      server.on('connection', serverHandler)
      server.on('error', (err) => { t.fail(err, 'server should not emit errors') })
    }, 3000)
  }

  const secondConnectPath = (buf) => {
    t.equal(buf.toString('utf8'), 'PING2', 'uppercase ping2')
    server.close()
    reconnectingWS.stop()
    setTimeout(() => {
      reconnectingWS.start()
    }, 500)
  }

  const reconnectingWS = new RSWS(`ws://localhost:${8456}`, {
    backoff: {
      failAfter: 4
    },
    onopen (socket, firstOpen) {
      if (firstOpen) {
        t.pass('fisrtOpen socket ran')
        socket.on('data', firstConnectPath)
        socket.write('ping1')
      } else {
        t.pass('!fisrtOpen socket ran')
        socket.on('data', secondConnectPath)
        socket.write('ping2')
      }
    },
    onclose (socket) {
      socket.removeListener('data', firstConnectPath)
      socket.removeListener('data', secondConnectPath)
    },
    onfail (err) {
      t.equals(err.message, 'connection error to ws://localhost:8456')
    }
  })

  reconnectingWS.on('info', console.log)
  reconnectingWS.on('error', err => {
    t.equals(err.message, 'connection error to ws://localhost:8456')
  })

  server.on('listening', () => {
    reconnectingWS.start()
  })
})
