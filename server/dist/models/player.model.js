import mongoose from 'mongoose';
const playerCollectionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    normal_positions: {
        type: [String],
        required: true
    },
    king_positions: {
        type: [String],
        required: true
    },
    killed: {
        type: [String],
        required: true
    },
    lose: {
        type: [String],
        required: true
    },
    oponent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'player'
    },
    realOrNot: {
        type: Boolean,
        default: false,
        required: true
    }
}, { timestamps: true });
export const Player = mongoose.model('player', playerCollectionSchema);
//# sourceMappingURL=player.model.js.map