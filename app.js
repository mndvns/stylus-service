var stack = require('simple-stack-common');
var stylus = require('stylus');
var envs = require('envs');

var app = module.exports = stack();


app.useBefore('router', function parseVars(req, res, next){

  // var buf = new Buffer(req.pathname, 'base64');
  // console.log(buf);

  next();
});

app.get('/:buf', function(req, res){
  var buf = new Buffer(req.params.buf, 'base64');
  var str = buf.toString();

  stylus(str)
    .render(function(err, css){
      res.send(css);
    });

});
