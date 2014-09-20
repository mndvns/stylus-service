var server = require('..');
var should = require('should');
var request = require('supertest');

describe('stylus-service', function(){
  it('should fail if repo is nonexistent', function(done){
    request(server)
      .get('/shoelace-ui/zzz/index.styl')
      .expect(404, done);
  });

  it('should fail if file is nonexistent', function(done){
    request(server)
      .get('/shoelace-ui/p/foobar.styl')
      .expect(404, done);
  });

  it('should render file', function(done){
    request(server)
      .get('/shoelace-ui/p/index.styl')
      .expect(200)
      .end(function(err, res){
        res.text.should.eql('p {\n  margin: 0 0 10px;\n}\n');
        done();
      });
  });

});
