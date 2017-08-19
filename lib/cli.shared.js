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

exports.jsHarmonyFactoryAPI = function(jshconfig){
  if (!global.appbasepath) global.appbasepath = jshconfig.path;
  var api_path = global.appbasepath + '/node_modules/jsharmony-factory/api.js';
  if(!fs.existsSync(api_path)){ throw new Error('jsharmony-factory module not installed at ' + api_path); }
  var api = require(api_path);
  return new api();
}

exports.LoadSettings = function(jshconfig){
  if(global.jsHarmonyFactorySettings_Loaded){ throw new Error('jsHarmonyFactory settings already loaded'); }

  //Include appropriate settings file based on Path
  if (!global.appbasepath) global.appbasepath = jshconfig.path;

  //Create array of application path
  var mpath = global.appbasepath;
  var mbasename = '';
  var patharr = [];
  while (mbasename = path.basename(mpath)) {
    patharr.unshift(mbasename);
    mpath = path.dirname(mpath);
  }
  //Load Default Settings
  var jsf_settings = global.appbasepath + '/node_modules/jsharmony-factory/app.settings.js';
  if (fs.existsSync(jsf_settings)) require(jsf_settings);
  //Load app.settings.js
  if (fs.existsSync(global.appbasepath + '/app.settings.js')) require(global.appbasepath + '/app.settings.js');
  //Load settings based on Application Path
  var local_settings_file = global.appbasepath + '/app.settings.' + patharr.join('_') + '.js';
  if (fs.existsSync(local_settings_file)) require(local_settings_file);
  //Load settings based on Hostname
  var host_settings_file = global.appbasepath + '/app.settings.' + os.hostname().toLowerCase() + '.js';
  if (fs.existsSync(host_settings_file)) require(host_settings_file);

  global.jsHarmonyFactorySettings_Loaded = true;
}