const { io } = require('socket.io-client');

const s = io('http://localhost:3001/tracking', {
  transports: ['polling'],
  auth: { token: 'test' },
});

s.on('connect', () => {
  console.log('OK - namespace connected');
  s.disconnect();
  process.exit(0);
});

s.on('connect_error', (e) => {
  console.log('ERR:', e.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(2);
}, 3000);
