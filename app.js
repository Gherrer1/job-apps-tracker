var express         = require('express');
var logger          = require('morgan');
var app             = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use(logger('dev'));

app.get('/', function(req, res) {
  // res.send('Nice');
  res.render('pages/index');
});

app.post('/tokens', function(req, res) {
  res.send('kay :)');
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log('Listening on port ' + PORT);
});
