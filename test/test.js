var nicknameAmd = require('../');

var assert = require('assert');
var fs = require('fs');
var path = require('path');

describe('nickname-amd', function() {
  var dir = __dirname + '/example';

  function testSource(filepath, expectedVarName) {
    expectedVarName = expectedVarName || 'a';

    var content = fs.readFileSync(filepath, 'utf8');

    it('returns the variable name associated with a given path', function() {
      var varName = nicknameAmd({
        directory: dir,
        filepath: filepath
      });

      assert.equal(varName, expectedVarName);
    });
  }

  describe('types', function() {
    var files = fs.readdirSync(dir);
    files.forEach(function(f) {
      describe(path.basename(f, '.js'), function() {
        testSource(dir + '/' + f);
      });
    });
  });
});