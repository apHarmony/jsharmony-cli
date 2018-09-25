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
