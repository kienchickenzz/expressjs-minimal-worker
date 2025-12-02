import { Queue, RedisOptions } from 'bullmq'
import { BaseQueue } from './BaseQueue'

import { JobData } from './BaseQueue'

export class PredictionQueue extends BaseQueue {
    private queueName: string

    constructor( queueName: string, connection: RedisOptions ) {
        super( queueName, connection )
        this.queueName = queueName
    }

    public getQueueName(): string {
        return this.queueName
    }

    public getQueue(): Queue {
        return this.queue
    }

    public async processJob(data: JobData): Promise<any> {
        // Implement your job processing logic here
        const { delay, message } = data; // Extract delay and message from JobData
        console.log(`[PredictionQueue] Processing job with message: "${message}" and delay: ${delay}ms`);
        
        // Simulate some processing
        await new Promise( resolve => setTimeout( resolve, delay ) )

        return { status: 'completed', dataProcessed: data };
    }
}