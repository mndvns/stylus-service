var server = require('..');
var should = require('should');
var request = require('supertest');
var fs = require('fs');

process.stdout.write('\u001B[2J');


describe('GET', function(){
  it('should work', function(done){
    readFile(__dirname + '/test.styl', function(data){
      request(server)
        .get('/' + data)
        .end(function(err, res){
          // console.log(res);
          console.log(res.text);
          done();
        });
    });
  });

  function readFile(path, fn){
    fs.readFile(path, 'base64', function(err, buf){
      fn(buf);
    });
  }
});
