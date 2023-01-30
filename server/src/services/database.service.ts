import mongoose from 'mongoose'
import { db_config } from '../config/database.config.js'

export const connectToDatabase = async () => {
    const db_uri = `${db_config.protocol}://${db_config.host}:${db_config.port}/${db_config.name}`
    mongoose.set('strictQuery', true);
    await mongoose.connect(db_uri)
    console.log('Database connection established successfully ✔')
}