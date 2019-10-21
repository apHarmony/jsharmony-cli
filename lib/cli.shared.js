/*
Copyright 2017 apHarmony

This file is part of jsHarmony.

jsHarmony is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

jsHarmony is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with this package.  If not, see <http://www.gnu.org/licenses/>.
*/

var fs = require('fs');
var os = require('os');
var path = require('path');
var _ = require('lodash');
var async = require('async');

exports = module.exports = {};

exports.jsHarmonyFactoryAPI = function(jshconfig, options){
  var api_path = jshconfig.path + '/node_modules/jsharmony-factory/api.js';
  if(!fs.existsSync(api_path)){ 
    //throw new Error('jsharmony-factory module not installed at ' + api_path); 
    console.log("\r\njsharmony-factory module not installed at " + api_path);
    console.log("\r\njsharmony-factory required for automatic model generation");
    process.exit(1);
  }
  var jsHarmonyFactoryAPI = require(api_path);
  return new jsHarmonyFactoryAPI(options);
}

exports.dos2unix = function(txt){
  if(!txt) return;
  return txt.toString().replace(/\r/g, '');
}

exports.copyFile = function(source, target, cb) {
  if (source == '') return exports.tryUnlink(target, cb);

  var cbCalled = false;
  var rd = fs.createReadStream(source);
  rd.on("error", done);
  var wr = fs.createWriteStream(target);
  wr.on("error", done);
  wr.on("close", function (ex) { done(); });
  rd.pipe(wr);
  
  function done(err) {
    if (!cbCalled) { if (typeof err == 'undefined') err = null; cb(err); cbCalled = true; }
  }
};

exports.funcRecursive = function (fpath, filefunc /* (filepath, filerelativepath, cb) */, dirfunc /* (filepath, filerelativepath, cb) */, options, cb, relativepath){
  options = _.extend({ file_before_dir: false, preview_dir: function(fpath, relativepath, dir_cb){ return dir_cb(); } }, options||{});
  if ((fpath[fpath.length - 1] == '/') || (fpath[fpath.length - 1] == '\\')) fpath = fpath.substr(0, fpath.length - 1);
  relativepath = relativepath || '';
  fs.exists(fpath, function (exists) {
    if (!exists) return cb(null);
    fs.readdir(fpath, function (err, files) {
      if (err) return cb(err);
      var skip = false;
      async.waterfall([
        //Pre-directory operation
        function(op_cb){
          if(options.file_before_dir){
            return options.preview_dir(fpath, relativepath, function(dir_err) {
              if (dir_err===false) skip = true;
              if (dir_err) return op_cb(dir_err);
              return op_cb(null);
            });
          }
          if (!dirfunc) return op_cb(null);
          else dirfunc(fpath, relativepath, function (dir_err) {
            if (dir_err===false) skip = true;
            if (dir_err) return op_cb(dir_err);
            return op_cb(null);
          });
        },
        //File operations
        function(op_cb){
          if(skip) return op_cb(null);
          async.eachSeries(files, function (file, files_cb) {
            var filepath = path.join(fpath, file);
            var filerelativepath = path.join(relativepath, file);
            fs.lstat(filepath, function (lstat_err, stats) {
              if (lstat_err) return files_cb(lstat_err);
              if (stats.isDirectory()) {
                exports.funcRecursive(filepath, filefunc, dirfunc, options, files_cb, filerelativepath);
              }
              else {
                if (!filefunc) files_cb();
                else filefunc(filepath, filerelativepath, function (file_err) {
                  if (file_err) return files_cb(file_err);
                  files_cb();
                });
              }
            });
          }, op_cb);
        },
        //Post-directory operation
        function(op_cb){
          if(skip) return op_cb(null);
          if(!options.file_before_dir) return op_cb(null);
          if (!dirfunc) return op_cb(null);
          else dirfunc(fpath, relativepath, function (dir_err) {
            if (dir_err) return op_cb(dir_err);
            return op_cb(null);
          });
        }
      ], cb);
    });
  });
};

exports.copyRecursive = function (source, target, options, cb){
  options = _.extend({
    forEachFile: function(filepath, targetpath, cb){ return cb(true); },
    forEachDir: function(dirpath, targetpath, cb){ return cb(true); }
  }, options);
  return exports.funcRecursive(source, function (filepath, relativepath, file_cb) { //filefunc
    var targetpath = path.join(target, relativepath);
    options.forEachDir(filepath, targetpath, function(copy){
      if(!copy) return file_cb();
      exports.copyFile(filepath, path.join(target, relativepath), file_cb);
    });
  }, function (dirpath, relativepath, dir_cb) { //dirfunc
    var targetpath = path.join(target, relativepath);
    options.forEachDir(dirpath, targetpath, function(create){
      if(!create) return dir_cb(false);
      exports.createFolderIfNotExists(targetpath, dir_cb);
    });
  }, undefined, cb);
};

exports.createFolderIfNotExists = function (path, callback) {
  if (!callback) callback = function () { };
  fs.mkdir(path, '0777', function (err) {
    if (err && err.code == 'EEXIST') return callback(null);
    if (err) return callback(err);
    return callback(null);
  });
};