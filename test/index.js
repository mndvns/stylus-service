var server = require('..');
var should = require('should');
var request = require('supertest');

process.stdout.write('\u001B[2J');

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

  it('should render `index.styl` by default', function(done){
    request(server)
      .get('/shoelace-ui/p')
      .expect(200)
      .end(function(err, res){
        res.text.should.eql('p{margin:0 0 10px}');
        done();
      });
  });

  it('should render file at root level', function(done){
    request(server)
      .get('/shoelace-ui/p/index.styl')
      .expect(200)
      .end(function(err, res){
        res.text.should.eql('p{margin:0 0 10px}');
        done();
      });
  });

  it('should render nested file', function(done){
    request(server)
      .get('/shoelace-ui/p/lib/styles.styl')
      .expect(200)
      .end(function(err, res){
        res.text.should.eql('p{margin:0 0 10px}');
        done();
      });
  });

  it('should pass query string as variables', function(done){
    request(server)
      .get('/shoelace-ui/p?p--margin=20px')
      .expect(200)
      .end(function(err, res){
        res.text.should.eql('p{margin:0 0 20px}');
        done();
      });
  });

});
