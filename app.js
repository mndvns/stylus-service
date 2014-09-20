var debug = require('debug')('stylus-service');
var stack = require('simple-stack-common');
var stylus = require('stylus');
var envs = require('envs');
var fs = require('fs');
var os = require('os');
var exec = require('child_process').exec;
var resolve = require('path').resolve;

var app = module.exports = stack();

var tmpdir = os.tmpdir();

app.get('/:org/:repo/:file', function(req, res){
  var org = req.params.org;
  var repo = req.params.repo;
  var file = req.params.file;

  clone(org, repo, res, function(){
    install(repo, res, function(){
      readFile(repo, file, res);
    });
  });
});

function install(path, res, fn){
  path = resolve(tmpdir, path);
  exec('npm install', {cwd: path}, function(err){
    if (err) return res.status(500).send('could not install at ' + path);
    fn();
  });
}

function readFile(repo, file, res){
  var path = resolve(tmpdir, repo);
  var filepath = resolve(tmpdir, repo, file);

  fs.readFile(filepath, 'utf8', function(err, data){
    if (err) return res.status(404).send(err);
    stylus.render(data, {paths: [path, path + '/node_modules']}, function(err, css){
      if (err) return res.status(500).send(err);
      res.type('css');
      res.send(css);
    });
  });

}

function update(repo, res, fn){
  exec('git pull origin master', {cwd: tmpdir + '/' + repo}, function(err, stdout, stderr){
    if (err) return res.status(500).send(err);
    debug('updated', repo);
    fn();
  });
}

function clone(org, repo, res, fn){
  var dest = 'https://github.com/' + org + '/' + repo + '.git';
  exec('git clone ' + dest, {cwd: tmpdir}, function(err, stdout, stderr){
    if (stderr && ~stderr.indexOf('Repository not found')) return res.status(404).send('repository not found')
    if (err) return update(repo, res, fn);
    debug('cloned', + org + '/' + repo);
    fn();
  });
}
