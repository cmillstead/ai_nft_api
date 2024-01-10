// import required modules
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// initialize Express app and set the port
const app = express();
const port = process.env.PORT || 3001;

// enable cross-origin resource sharing
app.use(cors());

// start the server on the specified port
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});