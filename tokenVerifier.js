var config = require('./config');
var GoogleAuth = require('google-auth-library');
var auth = new GoogleAuth;
var client = new auth.OAuth2(config.CLIENT_ID, '', '');

module.exports = function verifyIdToken(token, callback) {
  client.verifyIdToken(token, config.CLIENT_ID, function(e, login) {
    if(callback)
      return callback(e, login);
  });
}
