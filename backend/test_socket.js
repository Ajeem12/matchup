import { io } from 'socket.io-client';

const SERVER = 'http://localhost:5000';

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function makeClient(name) {
  const s = io(SERVER, { autoConnect: true, reconnectionAttempts: 3 });
  s.on('connect', () => console.log(`[${name}] connected (${s.id})`));
  s.on('disconnect', () => console.log(`[${name}] disconnected`));
  s.on('your_hand', ({ hand }) =>
    console.log(
      `[${name}] your_hand:`,
      hand.map((c) => `${c.color || c}_${c.value || c.id || c}`),
    ),
  );
  s.on('round_started', () => console.log(`[${name}] round_started payload`));
  s.on('error_event', (e) => console.warn(`[${name}] error_event`, e));
  return s;
}

async function run() {
  const clients = [makeClient('Host'), makeClient('P1'), makeClient('P2'), makeClient('P3')];

  // wait for connections
  await wait(500);

  // Host creates room
  const host = clients[0];
  const createRes = await new Promise((res) => {
    host.emit('create_room', { hostName: 'Host', maxPlayers: 4, totalRounds: 1 }, (r) => res(r));
  });
  console.log('[Host] create_room ->', createRes);
  const roomCode = createRes?.roomCode;

  // Others join
  for (let i = 1; i < clients.length; i++) {
    const c = clients[i];
    const joinRes = await new Promise((res) => {
      c.emit('join_room', { roomCode, displayName: `P${i}` }, (r) => res(r));
    });
    console.log(`[P${i}] join_room ->`, joinRes);
  }

  await wait(300);

  // Host starts game
  const startRes = await new Promise((res) => {
    host.emit('start_game', {}, (r) => res(r));
  });
  console.log('[Host] start_game ->', startRes);

  // Wait to receive your_hand events
  await wait(2000);

  // Cleanup
  for (const c of clients) c.close();
  console.log('Test complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
