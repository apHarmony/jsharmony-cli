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
var jshcli_Shared = require('./lib/cli.shared.js'); 

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  if(!onSuccess) onSuccess = function(){};
  options = _.extend({ showResultMessage: true, useDefaultSQLitePath: false }, options);
  console.log('\r\nRunning jsHarmony Factory DB Creation Scripts');
  var cmdParams = ['--use-ipc'];
  if(typeof params.CLIENT_PORTAL != 'undefined'){
    if(params.CLIENT_PORTAL) cmdParams.push('--with-client-portal');
    else cmdParams.push('--no-client-portal');
  }
  if(options.useDefaultSQLitePath) cmdParams.push('--use-default-sqlite-path');
  var jmsg = null;
  jshcli_Shared.runModuleScript('jsharmony-factory/init/create.js', cmdParams,
    {
      onMessage: function(msg, handle){
        try{ jmsg = JSON.parse(msg); }
        catch(ex){  }
        if(jmsg && jmsg.RESULT_MESSAGE && options.showResultMessage){ console.log('\r\n\r\n\r\n' + jmsg.RESULT_MESSAGE); }
      }
    },
    function(errCode){
      if(!errCode) return onSuccess(jmsg);
      console.log('\r\nDatabase Creation failed.');
    }
  );
}