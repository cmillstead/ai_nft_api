// import required modules
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const os = require('os');
const networkInterfaces = os.networkInterfaces();

// initialize Express app and set the port
const app = express();
const port = 3001;

// enable cross-origin resource sharing
app.use(cors());

function getServerIP() {
  const networkInterfaces = os.networkInterfaces();

  for (let interface in networkInterfaces) {
    const addresses = networkInterfaces[interface].filter(details => details.family === 'IPv4' && !details.internal);
    if (addresses.length > 0) return addresses[0].address;
  }

  return 'localhost';
}

// start the server on the specified port
app.listen(port, () => {
  const ip = getServerIP();
  console.log(`Server running at http://${ip}:${port}/`);
});
