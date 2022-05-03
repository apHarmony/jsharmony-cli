/*
Copyright 2022 apHarmony

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

var wclib = require('./lib/WebConnect.js');
var xlib = wclib.xlib;
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var jshcli_Shared = require('./lib/cli.shared.js');

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  if(!onSuccess) onSuccess = function(){};
  options = _.extend({ source: null  }, options);
  console.log('\r\nAdding jsHarmony Test');

  var jshconfig = _.extend({
    path: process.cwd(),
  }, global.default_jshconfig);

  async.waterfall([
    //Check if NPM is installed
    function(run_cb) {
      xlib.spawn(global._NPM_CMD,['-v'],function(code){},function(data){
        global._NPM_VER = data;
        if(global._NPM_VER){
          global._NPM_VER = global._NPM_VER.split('.');
          if(parseInt(global._NPM_VER[0])>=3) return run_cb();
          console.log('ERROR: Please upgrade your NPM version to 3 or higher');
        }
      },undefined,function(err){
        console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.');
        run_cb(err);
      });
    },
    function(run_cb){
      xlib.spawn(global._NPM_CMD,['install', '--save-dev', 'jsharmony-test'],function(code){ run_cb(); },function(data){
        console.log(data);
      },undefined,function(err){
        console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.');
        run_cb(err);
      });
    },
    function(dir_cb){
      jshcli_Shared.createFolderIfNotExists(path.join(jshconfig.path, 'test'), dir_cb);
    },
  ], function(err){
    if(err){
      console.log(err);
      console.log('\r\njsharmony-test install failed.');
      return;
    } else return onSuccess();
  });
};