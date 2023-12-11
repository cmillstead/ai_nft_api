const { NFTStorage, Blob } = require('nft.storage');
require('dotenv').config();

exports.handler = async (event) => {
  try {
    // Parsing JSON body from event
    const { name, description, image } = JSON.parse(event.body);

    // parse the image data and validate it
    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid image data' })
      };
    }

    // check the MIME type
    const mimeType = matches[1];
    if (!mimeType.startsWith('image/')) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid image MIME type' })
      };
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: metadata.url })
    };
  } catch (error) {
    console.error('Upload error:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Error uploading to NFT.storage' })
    };
  }
};
