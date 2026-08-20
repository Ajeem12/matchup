import mongoose from 'mongoose';

const finalScoreSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    totalScore: { type: Number, required: true },
    rank: { type: Number, required: true },
  },
  { _id: false },
);

const gameResultSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true },
    players: [finalScoreSchema],
    winnerId: { type: String, required: true },
    winnerDisplayName: { type: String, required: true },
    roundsPlayed: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export default mongoose.model('GameResult', gameResultSchema);
