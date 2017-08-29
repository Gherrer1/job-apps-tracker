if(!process.env.CLIENT_ID) {
  throw new Error('No client id env var');
}

module.exports = {
  CLIENT_ID: process.env.CLIENT_ID
};
