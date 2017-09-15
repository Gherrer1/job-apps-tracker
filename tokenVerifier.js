var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
if(!process.env.CLIENT_ID) {
	throw new Error('Need CLIENT_ID env var to continue.');
}
var client = new auth.OAuth2(process.env.CLIENT_ID, '', '');

module.exports = function verifyIdToken(token, callback) {
  client.verifyIdToken(token, process.env.CLIENT_ID, function(e, login) {
    if(callback)
      return callback(e, login);
  });
}
