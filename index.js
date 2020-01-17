const { EventEmitter } = require('events')
const backoff = require('backoff')
const get = require('lodash.get')
const Socket = require('simple-websocket')

class RSWS extends EventEmitter {
  constructor (url, opts) {
    if (!url) throw new Error('RSWS: missing url argument')

    opts = Object.assign({
      strategy: 'fibonacci',
      protocols: null,
      binaryType: null,
      strategyOpts: {
        randomisationFactor: 0.2,
        initialDelay: 1000,
        maxDelay: 20000
      },
      failAfter: null,
      name: 'rsw-' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1)
    }, opts)
    super(opts.name)

    this.url = url
    this.ws = null

    this.transport = opts.transport
    this.cleanup = () => {}

    this._state = 'disconnected'
    this._firstConnect = null

    this.backoff = backoff[opts.strategy](opts.strategyOpts)
    if (opts.failAfter) this.backoff.failAfter(opts.failAfter)

    this.backoff.on('backoff', (number, delay) => {
      this.state = 'waiting'
    })
    this.backoff.on('ready', (number, delay) => {
      this._reconnect()
    })
    this.backoff.on('fail', () => {
      this._fail(
        new Error(`RSWS: failed to connect after ${opts.failAfter} tries`)
      )
    })

    this.onconnect = this.onconnect.bind(this)
    this.onclose = this.onclose.bind(this)
    this.onerror = this.onerror.bind(this)
  }

  get state () {
    return this._state
  }
  set state (state) {
    this._state = state
    this.emit('state', state)
  }

  _error (err) {
    this.emit('error', err)
  }

  _info (info) {
    this.emit('info', info)
  }

  _destroySocket (err) {
    if (!this.ws) return
    this._removeEventListeners(this.ws)
    this.ws.destroy(err)
    this.ws = null
  }

  _createSocket () {
    if (this.ws) this._destroySocket()
    this.ws = new Socket(this.url)
    this._addEventListeners(this.ws)
  }

  _fail (err) {
    this._destroySocket()
    this.state = 'error'
    this._error(err)
  }

  _reconnect () {
    this.state = 'reconnecting'
    this._destroySocket()
    this._createSocket()
  }

  start () {
    this.state = 'connecting'
    this._firstConnect = true
    this._createSocket()
  }

  stop () {
    this.backoff.reset()
    this.cleanup(this.ws)
    this._destroySocket()
    this.state = 'disconnected'
    this.emit('disconnect')
  }


  _addEventListeners(target) {
    target.on('connect', this.onconnect)
    target.on('close', this.onclose)
    target.on('error', this.onerror)
  }

  _removeEventListeners(target) {
    target.removeListener('connect', this.onconnect)
    target.removeListener('close', this.onclose)
    target.removeListener('error', this.onerror)
  }

  onconnect () {
    this.state = 'connected'
    if (this._firstConnect) {
      this._firstConnect = false
      this.emit('connect', this.ws)
    } else {
      this.emit('reconnect', this.ws)
    }
    this.backoff.reset()
  }

  onclose () {
    this._info('RSWS: socket closed')
    this.state = 'disconnected'
    this.backoff.backoff()
  }

  onerror (err) {
    if (['connecting', 'reconnecting'].some(state => this.state === state)) {
      const backoffNumber = this.backoff.backoffNumber_
      this._info(`RSWS: Error durning connection attempt ${backoffNumber}`)
    }
    this._error(new Error(err))
  }
}

module.exports = URWS
