import { createClient, RedisClientType } from 'redis';
import { redisConfig } from '../config/redis.config.js';

export var redisClient: any = null;

export const connectToRedis = () => {
    return new Promise( async (resolve, reject) => {
        const client = createClient({
            url: `${redisConfig.protocol}://${redisConfig.host}:${redisConfig.port}`
        });
    
        client.on('error', (err) => {
            console.log('Redis Client Error', err.message)
            process.exit(0);
            reject(err);
        });
    
        await client.connect();
        redisClient = client;
        console.log('Redis connection established successfully ✔')
        resolve(true);
    })
}