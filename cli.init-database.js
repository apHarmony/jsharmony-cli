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

var wclib = require('./lib/WebConnect.js');
var wc = new wclib.WebConnect();
var xlib = wclib.xlib;
var path = require('path');
var fs = require('fs');
var _ = require('lodash');

exports = module.exports = {};

exports.Run = function(params, onSuccess){
  console.log('\r\nRunning jsHarmony Factory DB Initialization Scripts');
  xlib.spawn(global._NPM_CMD,['run','-s','init-database'],function(code){ 
    if(code==0){ 
      console.log('');
      console.log('');
      console.log('jsHarmony Factory has been initialized!');
      console.log('');
      console.log('** Please verify the configuration in '+process.cwd()+'\\app.settings.js');
      console.log('** Be sure to configure ports and HTTPS for security');
      console.log('');
      console.log('Start the server by running '+(global._IS_WINDOWS?'':'./')+global._NSTART_CMD);
      console.log('');
      if(onSuccess) onSuccess(); return 
    }
    console.log('\r\nDatabase Initialization failed.');
    var jsf_path = process.cwd()+'/node_modules/jsharmony-factory';
    if(!fs.existsSync(jsf_path)) console.log('Please run the command from the project root, or verify that jsharmony-factory is installed in "'+jsf_path+'"');
  },undefined,undefined,
  function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); },
  { stdio: 'inherit' });
}