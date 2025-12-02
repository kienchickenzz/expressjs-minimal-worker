import express, { Request, Response } from 'express'
import http from 'http'

const app = express()

app.get( '/api/health', ( req: Request, res: Response ) => {
    res.status( 200 ).send( 'Server is running' )
} )

const start = () => {
    const server = http.createServer( app )
    const PORT = 3000

    server.listen( PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`)
    } )
}

start()
