var precinct = require('precinct');
var resolveDependencyPath = require('resolve-dependency-path');
var getAMDModuleType = require('get-amd-module-type');
var Walker = require('node-source-walk');
var justParse = require('just-parse');
var types = require('ast-module-types');

var fs = require('fs');

/**
 * @param  {Object} options
 * @param  {String} options.directory
 * @param  {String} options.filepath
 * @return {String}
 */
module.exports = function(options) {
  options = options || {};

  var directory = options.directory;
  var filepath = options.filepath;

  if (!directory) { throw new Error('directory not given'); }
  if (!filepath) { throw new Error('filepath not given'); }

  var ast = justParse(fs.readFileSync(filepath, 'utf8'));

  var deps = getResolvedDependencies(ast, filepath, directory);
  var filepathIndex = deps.indexOf(filepath);

  if (!filepathIndex) { return ''; }

  var type = getAMDModuleType.fromAST(ast);

  // Based on type, get the variable name
  switch(type) {
    case 'named':
    case 'deps':
    case 'driver':
      return getVariableNameFromFunctionDeclaration(ast, filepathIndex);

    case 'factory':
    case 'rem':
      // Find define
      //    within that, find CallExpressions with require identifier
      //        return the variable identifier from the callexpressions expressionstatement parent
      break;
    default:
      return '';
  }
};

/**
 * @param  {Object} ast
 * @param  {Number} pathIndex
 * @return {String}
 */
function getVariableNameFromFunctionDeclaration(ast, pathIndex) {
  var walker = new Walker();
  var variableName = '';

  walker.walk(ast, function(node) {
    if (!types.isDefine(node) && !types.isAMDTopLevelRequire(node)) {
      return;
    }

    var functionNode = node.arguments[1];

    if (!functionNode ||
        functionNode.type && functionNode.type !== 'FunctionExpression') {
      return;
    }

    var params = functionNode.params;

    if (!params.length) {
      return;
    }

    variableName = params[pathIndex].identifier || '';
    walker.stopWalking();
  });

  return variableName;
}

/**
 * @param  {Object} ast
 * @param  {String} filepath
 * @param  {String} directory
 * @return {String[]}
 */
function getResolvedDependencies(ast, filepath, directory) {
  return precinct(ast)
  .map(function(d) {
    return resolveDependencyPath(d, filepath, directory);
  });
}