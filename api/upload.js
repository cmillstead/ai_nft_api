const { NFTStorage, Blob } = require('nft.storage');
require('dotenv').config();

module.exports = async (req, res) => {
  // set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // parsing JSON body from request
    const { name, description, image } = JSON.parse(req.body);

    // parse the image data and validate it
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      res.status(400).json({ error: 'Invalid image data' });
      return;
    }

    // check the MIME type
    const mimeType = matches[1];
    if (!mimeType.startsWith('image/')) {
      res.status(400).json({ error: 'Invalid image MIME type' });
      return;
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

    // send the response back
    res.status(200).json({ url: metadata.url });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Error uploading to NFT.storage' });
  }
};
