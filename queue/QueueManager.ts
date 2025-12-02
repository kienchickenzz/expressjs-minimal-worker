import { Router } from 'express'

import { RedisOptions } from 'bullmq'
import { createBullBoard } from '@bull-board/api'
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter'
import { ExpressAdapter } from '@bull-board/express'

import { BaseQueue } from './BaseQueue'
import { PredictionQueue } from './PredictionQueue'

const REDIS_PORT = 6379
const REDIS_HOST = 'localhost'
const REDIS_PASSWORD = 'Pa55w.rd'

const QUEUE_NAME = 'my-queue'

type QUEUE_TYPE = 'prediction'

export class QueueManager {
    private static instance: QueueManager
    private queues: Map<string, BaseQueue> = new Map()
    private connection: RedisOptions

    private serverAdapter: ExpressAdapter;
    private bullBoardRouter: Router;

    private constructor() {
        this.connection = {
            host: REDIS_HOST,
            port: REDIS_PORT,
            password: REDIS_PASSWORD,
        }

        this.serverAdapter = new ExpressAdapter();
        this.serverAdapter.setBasePath('/admin/queue');
        this.bullBoardRouter = this.serverAdapter.getRouter();
    }

    public static getInstance(): QueueManager {
        if ( !QueueManager.instance ) {
            QueueManager.instance = new QueueManager()
        }
        return QueueManager.instance
    }

    public registerQueue( name: QUEUE_TYPE, queue: BaseQueue ) {
        this.queues.set( name, queue )
    }

    public getQueue( name: QUEUE_TYPE ): BaseQueue {
        const queue = this.queues.get( name )
        if ( !queue ) throw new Error( `Queue ${ name } not found` )
        return queue
    }

    public getBullBoardRouter(): Router {
        return this.bullBoardRouter
    }

    public setupAllQueues() {
        const predictionQueueName = `${ QUEUE_NAME }-prediction`
        const predictionQueue = new PredictionQueue( predictionQueueName, this.connection )
        this.registerQueue( 'prediction', predictionQueue )

        const queues = [
            new BullMQAdapter( predictionQueue.getQueue() ), 
        ]

        createBullBoard( {
            queues: queues,
            serverAdapter: this.serverAdapter 
        } )
    }
}
