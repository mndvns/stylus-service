var stack = require('simple-stack-common');
var stylus = require('stylus');
var envs = require('envs');
var fs = require('fs');
var os = require('os');
var exec = require('child_process').exec;
var debug = require('debug')('stylus-service');

var app = module.exports = stack();

var tmpdir = os.tmpdir();

app.get('/:org/:repo/:file', function(req, res){
  var org = req.params.org;
  var repo = req.params.repo;
  var file = req.params.file;

  clone(org, repo, function(err){
    if (err) return res.status(404).send('repository not found');
    install(repo, function(err){
      if (err) return res.status(500).send(err);
      readFile(repo, file, res);
    });
  });

});

function install(path, fn){
  var path = tmpdir + path
  debug('path', path);
  exec('npm install', {cwd: path}, function(err){
    if (err) return fn('could not install at ' + path);
    fn();
  });
}

function readFile(repo, file, res){
  var path = tmpdir + repo;
  var filepath = tmpdir + repo + '/' + file;

  fs.readFile(filepath, 'utf8', function(err, data){
    if (err) return res.status(404).send(err);
    stylus.render(data, {paths: [path, path + '/node_modules']}, function(err, css){
      if (err) return res.status(500).send(err);
      res.type('css');
      res.send(css);
    });

  });
}

function update(repo, fn){
  exec('git pull origin master', {cwd: tmpdir + '/' + repo}, function(err, stdout, stderr){
    if (err) return fn(err);
    debug('updated', repo);
    fn();
  });
}

function clone(org, repo, fn){
  var dest = 'https://github.com/' + org + '/' + repo + '.git';
  exec('git clone ' + dest, {cwd: tmpdir}, function(err, stdout, stderr){
    if (stderr && ~stderr.indexOf('Repository not found')) return fn('repository not found')
    if (err) return update(repo, fn);
    debug('cloned', + org + '/' + repo);
    fn();
  });
}
