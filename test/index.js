var server = require('..');
var should = require('should');
var request = require('supertest');
var fs = require('fs');

process.stdout.write('\u001B[2J');


describe('GET', function(){
  it('should fail if repo is nonexistent', function(done){
    request(server)
      .get('/shoelace-ui/zzz/index.styl')
      .expect(404, done);
  });

  it('should fail if file is nonexistent', function(done){
    request(server)
      .get('/shoelace-ui/button/foobar.styl')
      .expect(404, done);
  });

  it('should render file', function(done){
    request(server)
      .get('/shoelace-ui/button/index.styl')
      .expect(200)
      .end(function(err, res){
        console.log(res.text);
        done();
      });
  });

});
