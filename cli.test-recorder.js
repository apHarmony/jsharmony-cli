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

var _ = require('lodash');
var async = require('async');
var jshcli_Shared = require('./lib/cli.shared.js');
var jstapi = null;

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  if(!onSuccess) onSuccess = function(){};
  options = _.extend({ FULL_ELEMENT_PATHS: false }, options);
  console.log('\r\nStarting test recorder');

  var jshconfig = _.extend({
    path: process.cwd(),
  }, global.default_jshconfig);

  async.waterfall([
    function(init_cb) {
      jstapi = jshcli_Shared.jsHarmonyTestAPI(jshconfig, {configPath: params.CONFIG});

      jstapi.Init(init_cb);
    },
    function(test_cb) {
      jstapi.recorder({ fullElementPath: options.FULL_ELEMENT_PATHS }, test_cb);
    },
  ], function(err){
    if(err){
      console.log(err);
      return;
    } else return onSuccess();
  });
};