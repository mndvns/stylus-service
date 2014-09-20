var debug = require('debug')('stylus-service');
var stack = require('simple-stack-common');
var stylus = require('stylus');
var envs = require('envs');
var fs = require('fs');
var os = require('os');
var exec = require('child_process').exec;
var resolve = require('path').resolve;
var dirname = require('path').dirname;

var app = module.exports = stack();

var tmpdir = os.tmpdir();

app.useBefore('router', function parseQuery(req, res, next){
  var parsed = req._parsedUrl.pathname;
  var pathname = parsed.split('/').slice(1);
  req.org = pathname[0];
  req.repo = pathname[1];
  req.file = parsed.split(req.repo)[1].slice(1) || 'index.styl';

  req.pathname = req._parsedUrl.path.slice(1);
  res.cache = resolve(tmpdir, req.pathname.replace(/\//g, '~'));

  req.options = {
    compress: true,
    cached: true
  };

  var buf='';
  for (var key in req.query){
    if (req.options[key]) req.options[key] = (req.query[key] === 'true');
    else buf += key + ' ?= ' + req.query[key] + '\n';
  }
  req.variables = buf;
  req.raw = buf;

  req.paths = [
    resolve(tmpdir, req.repo),
    resolve(tmpdir, req.repo, 'node_modules')
  ];

  // if file is nested, add its dir to lookup paths
  if (~req.file.indexOf('/')) req.paths.push(resolve(tmpdir, req.repo, dirname(req.file)))

  next();
});

app.get('*', function(req, res){
  readCache(req, res, function(){
    clone(req, res, function(){
      install(req, res, function(){
        readFile(req, res, function(){
          writeCache(req, res, function(){
          });
        });
      });
    });
  });
});

function readCache(req, res, fn){
  fs.exists(res.cache, function(exists){
    if (!exists || !req.options.cached) return fn();
    fs.readFile(res.cache, 'utf8', function(err, data){
      if (err) return res.status(500).send(err);
      res.status(200);
      res.type('css');
      res.send(data);
    });
  });
}

function writeCache(req, res, fn){
  fs.writeFile(res.cache, res.css, 'utf8', function(err){
    if (err) return console.error(err);
  });
}

function install(req, res, fn){
  var path = resolve(tmpdir, req.repo);
  exec('npm install', {cwd: path}, function(err){
    if (err) return res.status(500).send('could not install at ' + path);
    fn(req, res);
  });
}

function readFile(req, res, fn){
  var path = resolve(tmpdir, req.repo);
  var filepath = resolve(tmpdir, req.repo, req.file);
  fs.readFile(filepath, 'utf8', function(err, data){
    if (err) return res.status(404).send(err);
    req.raw += data;
    render(req, res, fn);
  });
}

function render(req, res, fn){

  stylus.render(req.raw, {paths: req.paths, compress: req.options.compress}, function(err, css){
    if (err) return res.status(500).send(err);
    res.css = css;
    res.type('css');
    res.send(css);
    fn();
  });
}

function update(req, res, fn){
  exec('git pull origin master', {cwd: resolve(tmpdir, req.repo)}, function(err, stdout, stderr){
    if (err) return res.status(500).send(err);
    debug('updated', req.repo);
    fn();
  });
}

function clone(req, res, fn){
  var dest = 'https://github.com/' + req.org + '/' + req.repo + '.git';
  exec('git clone ' + dest, {cwd: tmpdir}, function(err, stdout, stderr){
    if (stderr && ~stderr.indexOf('Repository not found')) return res.status(404).send('repository not found')
    if (stderr && ~stderr.indexOf('already exists')) return update(req, res, fn);
    debug('cloned', + req.org + '/' + req.repo);
    fn();
  });
}
