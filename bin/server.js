// import required modules
const express = require('express');
const bodyParser = require('body-parser');
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

// set a limit for the size of the data that can be sent
const limit = '25mb';
app.use(bodyParser.json({ limit: limit }));
app.use(bodyParser.urlencoded({ limit: limit, extended: true }));

// define a POST endpoint for creating images using Hugging Face API
app.post('/api/huggingface/create', async (req, res) => {
  try {
    // extract inputs and options from the request body
    const { inputs, options } = req.body;

    // get the API key from environment variables
    const apiKey = process.env.REACT_APP_HUGGING_FACE_API_KEY;

    // send a POST request to Hugging Face API with inputs and options
    const response = await axios.post('https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2', {
      inputs,
      options,
    }, {
      headers: {
        Accept: 'application/json',
        'content-type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      responseType: 'arraybuffer'
    });

    // convert the response data to a Base64 encoded string
    const imageBuffer = response.data;
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // get the content type from the response headers
    const type = response.headers['content-type'];

    // send the image back in the response
    res.send({ image: `data:${type};base64,${imageBase64}` });
  } catch (error) {
    // log and handle errors
    console.error('Error:', error.message);
    if (error.response) {
      // if there is a response from the API, log and return the error details
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      // if there was a request but no response, return an error
      console.error('Request:', error.request);
      res.status(500).json({ error: 'No response received from Hugging Face API' });
    } else {
      // for any other errors, return a generic error message
      res.status(500).json({ error: 'Error in setting up request to Hugging Face API' });
    }
  }
});

// NFT.storage module and JSON parser setup
const { NFTStorage, Blob } = require('nft.storage');
const jsonParser = bodyParser.json({ limit: limit });

// define a POST endpoint for uploading NFT data
app.post('/api/huggingface/upload', jsonParser, async (req, res) => {
  try {
    // extract name, description, and image from the request body
    const { name, description, image } = req.body;

    // parse the image data and validate it
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    // check the MIME type
    const mimeType = matches[1];
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid image MIME type' });
    }

    // convert the base64 string to a Blob
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const imageBlob = new Blob([imageBuffer], { type: mimeType });

    // initialize NFT.storage with the API key
    const nftStorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY });

    // define the NFT data to be uploaded
    const nftData = {
      name,
      description,
      image: imageBlob,
    };

    // upload the NFT data to NFT.storage
    const metadata = await nftStorage.store(nftData);
    res.json({ url: metadata.url });
  } catch (error) {
    // handle errors during the upload process
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading to NFT.storage' });
  }
});

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
