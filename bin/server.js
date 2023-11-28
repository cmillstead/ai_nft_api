const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 3001;
const cors = require('cors');
require('dotenv').config();

app.use(cors());
const limit = '25mb';
app.use(bodyParser.json({ limit: limit }));
app.use(bodyParser.urlencoded({ limit: limit, extended: true }));
app.post('/api/huggingface/create', async (req, res) => {
  try {
    const { inputs, options } = req.body;
    const apiKey = process.env.REACT_APP_HUGGING_FACE_API_KEY;
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
    console.log('inputs:', inputs);
    const imageBuffer = response.data;
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    console.log(`Image size: ${imageBuffer.length / 1024 / 1024} MB`);

    const type = response.headers['content-type'];
    res.send({ image: `data:${type};base64,${imageBase64}` });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      res.status(error.response.status).json({ error: error.response.data });
    } else if (error.request) {
      console.error('Request:', error.request);
      res.status(500).json({ error: 'No response received from Hugging Face API' });
    } else {
      res.status(500).json({ error: 'Error in setting up request to Hugging Face API' });
    }
  }
});

const { NFTStorage, Blob } = require('nft.storage');
const jsonParser = bodyParser.json({ limit: limit });

app.post('/api/huggingface/upload', jsonParser, async (req, res) => {
  try {
    const { name, description, image } = req.body;

    // Extract MIME type and Base64 data
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image data' });
    }

    const mimeType = matches[1];
    console.log(`Extracted MIME Type: ${mimeType}`);

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid image MIME type' });
    }

    // Convert base64 image to Blob
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const imageBlob = new Blob([imageBuffer], { type: mimeType });

    // Create instance of NFT.storage
    const nftStorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY });

    // Define the NFT data
    const nftData = {
      name,
      description,
      image: imageBlob,
    };

    console.log(`Uploading to NFT.storage with MIME type: ${imageBlob.type}`);

    // Send request to store the NFT data
    const metadata = await nftStorage.store(nftData);
    res.json({ url: metadata.url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading to NFT.storage' });
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
