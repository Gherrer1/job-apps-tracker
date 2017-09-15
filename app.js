var express         = require('express');
var bodyParser      = require('body-parser');
var logger          = require('morgan');
var app             = express();
var verifyToken   = require('./tokenVerifier');

app.use(express.static('public'));

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
  res.sendFile('index.html', { root: __dirname });
});

// route we may need later
app.post('/tokens', function(req, res) {
  verifyToken(req.body.idtoken, function(err, login) {
    if(err)
      return res.send('fuck off');
    var payload = login.getPayload();
    var userid = payload.sub;
    res.send(userid);
  });
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Listening on port ' + PORT);
});
