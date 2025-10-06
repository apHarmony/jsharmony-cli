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
var xlib = wclib.xlib;
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var async = require('async');
var jshcli_Shared = require('./lib/cli.shared.js');

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  var jshconfig = _.extend({
    path: process.cwd(),
  }, global.default_jshconfig);
  if(!onSuccess) onSuccess = function(){};
  options = _.extend({ showResultMessage: true, useDefaultSQLitePath: false, preCreate: null, preInit: null, postInit: null  }, options);
  console.log('\r\nRunning jsHarmony Factory DB Creation Scripts');

  async.waterfall([

    function(run_cb){
      if(options.source != 'cli') return run_cb();
      //Check if supervisor is installed
      xlib.spawn(global._SUPERVISOR_CMD,[],function(code){},_.once(function(data){
        global._FOUND_SUPERVISOR = true;
        return run_cb();
      }),undefined,function(err){
        global._FOUND_SUPERVISOR = false;
        return run_cb();
      }, {shell: true});
    },
    
    function(run_cb){
      if(options.source == 'cli'){
        fs.exists(jshconfig.path, function(exists){
          if(!exists) return run_cb();
          //Read project file
          jshcli_Shared.readManifest(path.join(jshconfig.path, 'jsharmony.project.json'), function(err, manifest){
            if(err && err.code=='ENOENT') return run_cb();
            if(err) return run_cb(err);
            options.preCreate = options.preCreate || manifest.installer.scripts.pre_db_create;
            options.preInit = options.preInit || manifest.installer.scripts.pre_db_init;
            options.postInit = options.postInit || manifest.installer.scripts.post_db_init;
            if(typeof params.CLIENT_PORTAL == 'undefined') params.CLIENT_PORTAL = !!manifest.installer.jsharmony_factory_client_portal;
            return run_cb();
          });
        });
      }
      else return run_cb();
    },
  ], function(err){
    if(err){
      console.log(err);
      console.log('\r\nDatabase Initialization failed.');
      return;
    }

    var cmdParams = ['--use-ipc'];
    if(typeof params.CLIENT_PORTAL != 'undefined'){
      if(params.CLIENT_PORTAL) cmdParams.push('--with-client-portal');
      else cmdParams.push('--no-client-portal');
    }
    if(params.SAMPLE_DATA) cmdParams.push('--with-sample-data');
    if(global._FOUND_SUPERVISOR) cmdParams.push('--with-supervisor');
    if(options.useDefaultSQLitePath) cmdParams.push('--use-default-sqlite-path');
    if(options.preCreate){ cmdParams.push('--pre-create'); cmdParams.push(options.preCreate); }
    if(options.preInit){ cmdParams.push('--pre-init'); cmdParams.push(options.preInit); }
    if(options.postInit){ cmdParams.push('--post-init'); cmdParams.push(options.postInit); }
    if(params.ADMIN_PASS){ cmdParams.push('--admin-pass'); cmdParams.push(params.ADMIN_PASS); }

    var jmsg = null;
    jshcli_Shared.runModuleScript('jsharmony-factory/init/create.js', cmdParams,
      {
        onMessage: function(msg, handle){
          try{ jmsg = JSON.parse(msg); }
          catch(ex){ /* Do nothing */ }
          if(jmsg && jmsg.RESULT_MESSAGE && options.showResultMessage){ console.log('\r\n\r\n\r\n' + jmsg.RESULT_MESSAGE); }
        }
      },
      function(errCode){
        if(!errCode) return onSuccess(jmsg);
        console.log('\r\nDatabase Creation failed.');
      }
    );
  });
};