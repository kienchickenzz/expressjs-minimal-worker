import express from 'express'
import http from 'http'

import { QueueManager } from './queue/QueueManager'

const wokerServer = express()

const start = () => {
    const httpServer = http.createServer( wokerServer )
    const PORT = 3001

    const queueManager = QueueManager.getInstance()
    queueManager.setupAllQueues()
    wokerServer.use( '/admin/queue', queueManager.getBullBoardRouter() )

    httpServer.listen( PORT, () => {
        console.info(`Bull Board is available at http://localhost:${PORT}/admin/queue`)
    } )
}

start()
