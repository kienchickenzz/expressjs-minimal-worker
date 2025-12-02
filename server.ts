import express, { Request, Response } from 'express'
import http from 'http'

import { QueueManager } from './queue/QueueManager'
import { PredictionQueue } from './queue/PredictionQueue'

const app = express()
app.use( express.json() ) // For parsing application/json

// Initialize QueueManager and setup queues
const queueManager = QueueManager.getInstance()
queueManager.setupAllQueues()
const predictionQueue = queueManager.getQueue('prediction') as PredictionQueue

app.get( '/api/health', ( req: Request, res: Response ) => {
    res.status( 200 ).send( 'Server is running' )
} )

app.post('/api/job', async ( req: Request, res: Response ) => {
    const { delay } = req.body
    if ( !delay || isNaN( parseInt( delay as string, 10 ) ) ) {
        return res.status(400).send('Invalid delay value. Please provide delay in milliseconds.')
    }

    const parsedDelay = parseInt( delay as string, 10 )

    try {
        const jobId = `${ Date.now() }-${ Math.random() }`
        const jobData = {
            id: jobId,
            message: `Hello World with delay: ${ parsedDelay }ms`,
            delay: parsedDelay
        }

        const job = await predictionQueue.addJob(jobData)
        console.log(`Added job ${job.id} to prediction queue with delay ${parsedDelay}ms`)

        res.status(202).json({ message: `Job ${job.id} added to queue with delay ${parsedDelay}ms`})
    } catch (error) {
        console.error('Failed to add job:', error)
        res.status(500).send('Failed to add job to queue.')
    }
})

// Mount Bull Board router
app.use('/admin/queue', queueManager.getBullBoardRouter())

const start = () => {
    const server = http.createServer( app )
    const PORT = 3000

    server.listen( PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
        console.log(`BullMQ Dashboard available at http://localhost:${PORT}/admin/queue`)
    } )
}

start()

// Usage
//
// To add a job, send a POST request to http://localhost:3000/api/job with JSON body: { "delay": 20000 }
// curl -X POST http://localhost:3000/api/job -H "Content-Type: application/json" -d '{"delay":20000}'
