import mongoose from 'mongoose';

const playerSubSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // socket-session id or User._id if authenticated
    displayName: { type: String, required: true },
    seatIndex: { type: Number, required: true },
  },
  { _id: false },
);

const gameRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true },
    hostUserId: { type: String, required: true },
    players: [playerSubSchema],
    maxPlayers: { type: Number, required: true, min: 4, max: 8 },
    totalRounds: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['lobby', 'in_progress', 'completed', 'abandoned'],
      default: 'lobby',
    },
  },
  { timestamps: true },
);

export default mongoose.model('GameRoom', gameRoomSchema);
