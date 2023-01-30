import { createServer, Server as HttpServer } from 'http'
import express from 'express'
import { Server, Socket } from 'socket.io'
import { serverConfig } from './config/server.config.js';
import { PrintMessage } from './helpers/utils.helper.js';
import { connectToDatabase } from './services/database.service.js';
import { loginUser, refreshToken, registerUser } from './controllers/user.controller.js';
import { createGameWithBot } from './controllers/game.controller.js';
import { connectToRedis } from './services/redis.service.js';
import { getPlayerPosssibleMove, movePlayerTile } from './controllers/player.controller.js';

connectToRedis().then(() => {
    connectToDatabase().then(() => {
        const app = express()
        const httpServer: HttpServer = createServer(app);
        const io: Server = new Server(httpServer, {
            cors: {
              origin: "http://localhost:3000"
            }
        });
    
        io.on('connection', (socket: Socket) => {
            PrintMessage(`new socket connection : ${socket.id}`);
            socket.on('user:register', (payload) => registerUser(io, socket, payload))
            socket.on('user:login', (payload) => loginUser(io, socket, payload))
            socket.on('token:refresh', (payload) => refreshToken(io, socket, payload))
            socket.on('game:create-bot', (payload) => createGameWithBot(io, socket, payload))
            socket.on('player:move-possible', (payload) => getPlayerPosssibleMove(io, socket, payload))
            socket.on('player:move', (payload) => movePlayerTile(io, socket, payload))
        })
    
    
        httpServer.listen(serverConfig.port, () => {
            PrintMessage(`Server is running on port : ${serverConfig.port}`);
        });
    }).catch((e: Error) => {
        /**
         * project manager should get message via email
         */
        PrintMessage(e.message);
    })
}).catch((e: Error) => {
    /**
     * project manager should get message via email
     */
    PrintMessage(e.message);
})