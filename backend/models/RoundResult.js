import mongoose from 'mongoose';

const pointsAwardedSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    displayName: { type: String, required: true },
    rank: { type: Number, required: true },
    points: { type: Number, required: true },
    serverTimestamp: { type: Number, required: true },
  },
  { _id: false },
);

const roundResultSchema = new mongoose.Schema(
  {
    gameResultId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameResult' },
    roomCode: { type: String, required: true },
    roundNumber: { type: Number, required: true },
    matchedUserId: { type: String, required: true },
    matchedDisplayName: { type: String, required: true },
    matchedColor: { type: String, required: true },
    pointsAwarded: [pointsAwardedSchema],
  },
  { timestamps: true },
);

export default mongoose.model('RoundResult', roundResultSchema);
