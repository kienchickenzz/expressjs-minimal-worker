import express from 'express'
import http from 'http'

import { QueueManager } from './queue/QueueManager'

const wokerServer = express()

const start = () => {
    const httpServer = http.createServer( wokerServer )
    const PORT = 3001

    const queueManager = QueueManager.getInstance()
    queueManager.setupAllQueues()

    // Prediction
    const predictionQueue = queueManager.getQueue('prediction')
    const predictionWorker = predictionQueue.createWorker()
    console.info(`Prediction Worker ${predictionWorker.id} created`)

    wokerServer.use( '/admin/queue', queueManager.getBullBoardRouter() )

    httpServer.listen( PORT, () => {
        console.info(`Bull Board is available at http://localhost:${PORT}/admin/queue`)
    } )
}

start()
