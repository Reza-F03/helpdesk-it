const app = require('./index.js');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.warn(`Port ${PORT} is in use. Trying port ${nextPort}...`);
    app.listen(nextPort, () => {
      console.log(`Server running on http://localhost:${nextPort}`);
    });
  } else {
    console.error('Server error:', err);
  }
});
