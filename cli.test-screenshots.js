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
var jstapi = null;

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  if(!onSuccess) onSuccess = function(){};
  options = _.extend({ source: null  }, options);
  console.log('\r\nRunning comparison screenshots');

  var jshconfig = _.extend({
    path: process.cwd(),
  }, global.default_jshconfig);

  async.waterfall([
    function(init_cb) {
      jstapi = jshcli_Shared.jsHarmonyTestAPI(jshconfig, {configPath: params.CONFIG, silent: params.SILENT});

      jstapi.Init(init_cb);
    },
    function(test_cb) {
      jstapi.runComparison(test_cb);
    },
    function(done_cb) {
      console.log('test done');
      done_cb();
    }
  ], function(err){
    if(err){
      console.log(err);
      console.log('\r\njsharmony-test run comparison images failed.');
      return;
    } else return onSuccess();
  });
};