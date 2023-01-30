import mongoose from 'mongoose';
const GameCollectionSchema = new mongoose.Schema({
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
}, { timestamps: true });
export const Game = mongoose.model('game', GameCollectionSchema);
//# sourceMappingURL=game.model.js.map