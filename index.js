var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var Writer = require('broccoli-writer');
var helpers = require('broccoli-kitchen-sink-helpers');
var symlinkOrCopySync = require('symlink-or-copy').sync;

module.exports = Select;

function Select(inputTree, options) {
  if (!(this instanceof Select))
    return new Select(inputTree, options);

  options = options || {};

  this.srcDir = options.srcDir || '/';
  this.acceptFiles = options.acceptFiles || options.files || [ '**/*' ];
  this.rejectFiles = options.rejectFiles || [];
  this.outputDir = options.outputDir || options.destDir || '/';
  this.inputTree = inputTree;
}

Select.prototype = Object.create(Writer.prototype);
Select.prototype.constructor = Select;

Select.prototype.write = function (readTree, destDir) {
  var acceptFiles = this.acceptFiles;
  var rejectFiles = this.rejectFiles;
  var outputDir = this.outputDir;
  var self = this;

  return readTree(this.inputTree).then(function (srcDir) {
    var baseDir = path.join(srcDir, self.srcDir);

    var rejectedFiles = getFilesRecursively(baseDir, rejectFiles);
    var acceptedFiles = getFilesRecursively(baseDir, acceptFiles).filter(function (file) {
      return rejectedFiles.indexOf(file) === -1;
    });

    acceptedFiles.forEach(function (file) {
      var srcFile = path.join(baseDir, file);
      var destFile = path.join(destDir, outputDir, file);
      var stat = fs.lstatSync(srcFile);

      if (stat.isFile() || stat.isSymbolicLink()) {
        mkdirp.sync(path.dirname(destFile));
        symlinkOrCopySync(srcFile, destFile);
      }
    });
  });
};

function getFilesRecursively(dir, globPatterns) {
  return helpers.multiGlob(globPatterns, {
    cwd: dir,
    root: dir,
    nomout: false
  });
}
