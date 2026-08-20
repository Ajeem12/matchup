import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { connectDB } from './config/db.js';
import healthRoutes from './routes/health.js';
import { registerSocketHandlers } from './sockets/index.js';

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/api', healthRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
});

registerSocketHandlers(io);

async function start() {
  await connectDB();
  httpServer.listen(PORT, () => {
    console.log(`Matchup server listening on port ${PORT}`);
  });
}

start();
