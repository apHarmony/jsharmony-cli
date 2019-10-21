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
  console.log('\r\nRunning jsHarmony Factory DB Creation Scripts');
  var cmd = ['run','-s','create-database','--'];
  if(typeof params.CLIENT_PORTAL != 'undefined'){
    if(params.CLIENT_PORTAL) cmd.push('--with-client-portal');
    else cmd.push('--no-client-portal');
  }
  xlib.spawn(global._NPM_CMD,cmd,function(code){ 
    if(code==0){ 
      if(onSuccess) onSuccess(); return;
    }
    console.log('\r\nDatabase Creation failed.');
    var jsf_path = process.cwd()+'/node_modules/jsharmony-factory';
    if(!fs.existsSync(jsf_path)) console.log('Please run the command from the project root, or verify that jsharmony-factory is installed in "'+jsf_path+'"');
  },undefined,undefined,
  function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); },
  { stdio: 'inherit' });
}