import { Queue, Worker, Job, QueueEvents, RedisOptions, KeepJobs } from 'bullmq'

const QUEUE_REDIS_EVENT_STREAM_MAX_LEN = 10000
const WORKER_CONCURRENCY = 100000
const REMOVE_ON_AGE = -1
const REMOVE_ON_COUNT = -1

export interface JobData {
    id: string
    [key: string]: any
}

export abstract class BaseQueue {
    protected queue: Queue
    protected queueEvents: QueueEvents
    protected connection: RedisOptions
    
    private worker: Worker | undefined

    constructor(queueName: string, connection: RedisOptions) {
        this.connection = connection
        this.queue = new Queue(queueName, {
            connection: this.connection,
            streams: { events: { maxLen: QUEUE_REDIS_EVENT_STREAM_MAX_LEN } }
        })
        this.queueEvents = new QueueEvents(queueName, { connection: this.connection })
    }

    abstract processJob(data: any): Promise<any>
    abstract getQueueName(): string
    abstract getQueue(): Queue

    public getWorker(): Worker {
        if (!this.worker) {
            throw new Error('Worker has not been created yet')
        }
        return this.worker
    }

    public async addJob(jobData: JobData): Promise<Job> {
        const jobId = jobData.id

        let removeOnFail: number | boolean | KeepJobs | undefined = true
        let removeOnComplete: number | boolean | KeepJobs | undefined = undefined

        // Only override removal options if age or count is specified
        if (REMOVE_ON_AGE !== -1 || REMOVE_ON_COUNT !== -1) {
            const keepJobObj: KeepJobs = {}
            if (REMOVE_ON_AGE !== -1) {
                keepJobObj.age = REMOVE_ON_AGE
            }
            if (REMOVE_ON_COUNT !== -1) {
                keepJobObj.count = REMOVE_ON_COUNT
            }
            removeOnFail = keepJobObj
            removeOnComplete = keepJobObj
        }

        return await this.queue.add(jobId, jobData, { removeOnFail, removeOnComplete })
    }

    public createWorker(concurrency: number = WORKER_CONCURRENCY): Worker {
        this.worker = new Worker(
            this.queue.name,
            async (job: Job) => {
                const start = new Date().getTime()
                console.info(`[BaseQueue] Processing job ${job.id} in ${this.queue.name} at ${new Date().toISOString()}`)
                const result = await this.processJob(job.data)
                const end = new Date().getTime()
                console.info(`[BaseQueue] Completed job ${job.id} in ${this.queue.name} at ${new Date().toISOString()} (${end - start}ms)`)
                return result
            },
            {
                connection: this.connection,
                concurrency
            }
        )
        return this.worker
    }

    public getQueueEvents(): QueueEvents {
        return this.queueEvents
    }

    public async clearQueue(): Promise<void> {
        await this.queue.obliterate({ force: true })
    }
}