const axios = require('axios');
require('dotenv').config();
const { NFTStorage, Blob } = require('nft.storage');

module.exports = async (req, res) => {
  // set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
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
        'Content-Type': 'application/json',
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
    res.status(200).json({ image: `data:${type};base64,${imageBase64}` });
  } catch (error) {
    console.error('Error:', error.message);

    let errorMessage = 'Error in processing your request';
    let statusCode = 500;

    if (error.response) {
      console.error('Response Data:', error.response.data);
      console.error('Response Status:', error.response.status);
      console.error('Response Headers:', error.response.headers);
      errorMessage = error.response.data;
      statusCode = error.response.status;
    } else if (error.request) {
      console.error('Request:', error.request);
      errorMessage = 'No response received from Hugging Face API';
    }

    res.status(statusCode).json({ error: errorMessage });
  }
};
