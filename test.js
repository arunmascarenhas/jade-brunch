var expect = require('chai').expect;
var Plugin = require('./');
var pug = require('pug');
var sysPath = require('path');
var fs = require('fs');

describe('Plugin', function() {
  var plugin;

  beforeEach(function() {
    plugin = new Plugin({paths: {root: '.'}});
  });

  it('should be an object', function() {
    expect(plugin).to.be.ok;
  });

  it('should has #compile method', function() {
    expect(plugin.compile).to.be.an.instanceof(Function);
  });

  it('should compile and produce valid result', function(done) {
    var content = 'doctype html';
    var expected = '<!DOCTYPE html>';

    plugin.compile({data: content, path: 'template.pug'}).then(data => {
      expect(eval(data)()).to.equal(expected);
      done();
    }, error => expect(error).not.to.be.ok);
  });

  describe('index', function() {

    it('should include pug/lib/index.js', function(){
      expect(plugin.include).to.match(/pug\/lib\/index\.js$/);
    });

    it('pug/lib/index.js should exist', function(){
      expect(fs.existsSync(plugin.include[0])).to.be.ok;
    });

  });


  describe('getDependencies', function() {
    it('should output valid deps', function(done) {
      var content = "\
include valid1\n\
include valid1.pug\n\
include ../../test/valid1\n\
include ../../test/valid1.pug\n\
include /valid3\n\
extends valid2\n\
extends valid2.pug\n\
include ../../test/valid2\n\
include ../../test/valid2.pug\n\
extends /valid4\n\
";

      var expected = [
        sysPath.join('valid1.pug'),
        sysPath.join('app', 'valid3.pug'),
        sysPath.join('valid2.pug'),
        sysPath.join('app', 'valid4.pug'),
      ];

      // progeny now only outputs actually found files by default
      fs.mkdirSync('app');
      expected.forEach(function(file) {
        fs.writeFileSync(file, 'div');
      });

      plugin.getDependencies(content, 'template.pug', function(error, dependencies) {
        expect(error).not.to.be.ok;
        expect(dependencies).to.have.members(expected);

        // clean up temp fixture files
        expected.forEach(function(file) {
          fs.unlinkSync(file);
        });
        fs.rmdirSync('app');

        done();
      });
    });
  });

  describe('getDependenciesWithOverride', function() {
    it('should output valid deps', function(done) {

      var content = "\
include /valid3\n\
extends /valid4\n\
";

      var expected = [
        sysPath.join('custom', 'valid3.pug'),
        sysPath.join('custom', 'valid4.pug'),
      ];

      // progeny now only outputs actually found files by default
      fs.mkdirSync('custom');
      expected.forEach(function(file) {
        fs.writeFileSync(file, 'div');
      });

      plugin = new Plugin({paths: {root: '.'}, plugins: {pug: {basedir: 'custom'}}});

      plugin.getDependencies(content, 'template.pug', function(error, dependencies) {
        expect(error).not.to.be.ok;
        expect(dependencies).to.have.members(expected);

        // clean up temp fixture files
        expected.forEach(function(file) {
          fs.unlinkSync(file);
        });
        fs.rmdirSync('custom');

        done();
      });
    });
  });

});
