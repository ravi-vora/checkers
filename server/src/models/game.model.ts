import mongoose from 'mongoose'


const GameCollectionSchema: mongoose.Schema = new mongoose.Schema({
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {timestamps: true });

export const Game: mongoose.Model<any> = mongoose.model('game', GameCollectionSchema);