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
var jshcli_InitDatabase = require('./cli.init-database.js');
var jshcli_CreateDatabase = require('./cli.create-database.js');
var jshcli_Shared = require('./lib/cli.shared.js'); 

exports = module.exports = {};

exports.Run = function(params, onSuccess){
  console.log('Running CreateTutorials operation...');
  console.log('\r\nThese settings can later be changed in your app.config.js file');

  var jshconfig = {
    path: process.cwd()
  };
  jshconfig.projectname = path.basename(jshconfig.path);
  jshconfig.dbtype = 'sqlite';

  if(global.default_jshconfig) _.extend(jshconfig, global.default_jshconfig);

  Promise.resolve()
  
  //Confirm that jsHarmony Tutorials will be set up in the current folder
  .then(xlib.getStringAsync(function(){
    console.log('\r\nThis will overwrite any existing configuration and set up the jsHarmony Tutorials in the current folder');
    console.log(jshconfig.path);
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ return true; }
    else if(rslt=="2"){ return false; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))
  
  //Create app.js
  .then(function(){ return new Promise(function(resolve, reject){
    var rslt = "#!/usr/bin/env node\r\n\r\n";
    rslt += "var jsHarmonyTutorials = require('jsharmony-tutorials');\r\n";
    rslt += "var jsh = new jsHarmonyTutorials.Application();\r\n";
    rslt += "jsh.Run();\r\n";
    if(!global._IS_WINDOWS) rslt = jshcli_Shared.dos2unix(rslt);
    fs.writeFileSync(jshconfig.path+'/app.js', rslt);
    if(!global._IS_WINDOWS) fs.chmodSync(jshconfig.path+'/app.js', '755');
    resolve();
  }); })

  //Create app.config.js
  .then(function(){ return new Promise(function(resolve, reject){
    var rslt = "exports = module.exports = function(jsh, config, dbconfig){\r\n";
    rslt += "\r\n";
    rslt += "  //Server Settings\r\n";
    rslt += "  //config.server.http_port = 8080;\r\n";
    rslt += "  //config.server.https_port = 8081;\r\n";
    rslt += "  //config.server.https_cert = 'path/to/https-cert.pem';\r\n";
    rslt += "  //config.server.https_key = 'path/to/https-key.pem';\r\n";
    rslt += "  //config.server.https_ca = 'path/to/https-ca.crt';\r\n";
    rslt += "  config.frontsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  \r\n";
    rslt += "  //jsHarmony Factory Configuration\r\n";
    rslt += "  var configFactory = config.modules['jsHarmonyFactory'];\r\n";
    rslt += "  \r\n";
    rslt += "  configFactory.clientsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  configFactory.clientcookiesalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  configFactory.mainsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  configFactory.maincookiesalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  \r\n";
    rslt += "  jsh.Config.onServerReady.push(function(cb, servers){\r\n";
    rslt += "    var port = jsh.Config.server.http_port;\r\n";
    rslt += "    if(jsh.Servers['default'] && jsh.Servers['default'].servers && jsh.Servers['default'].servers.length) port = jsh.Servers['default'].servers[0].address().port;\r\n";
    rslt += "    var exec = require('child_process').exec;\r\n";
    rslt += "    exec('start http://localhost:'+port+'/', { });\r\n";
    rslt += "    return cb();\r\n";
    rslt += "  });\r\n";
    rslt += "}\r\n";
    fs.writeFileSync(jshconfig.path+'/app.config.js', rslt);
    resolve();
  }); })
  
  //Create package.json
  .then(function(){ return new Promise(function(resolve, reject){
    var rslt = "{\r\n";
    rslt += '  "name": '+JSON.stringify(jshconfig.projectname)+',\r\n';
    var db_dependency = '';
    if(jshconfig.dbtype=='pgsql') db_dependency = '"jsharmony-db-pgsql": "^1.1.0",';
    else if(jshconfig.dbtype=='mssql') db_dependency = '"jsharmony-db-mssql": "^1.1.0",';
    else if(jshconfig.dbtype=='sqlite') db_dependency = '"jsharmony-db-sqlite": "^1.1.0",';
    rslt += '  "version": "0.0.1",\r\n\
  "private": true,\r\n\
  "scripts": {\r\n\
    "start": "node app.js",\r\n\
    "create-database": "node node_modules/jsharmony-factory/init/create.js"\r\n\
  },\r\n\
  "dependencies": {\r\n\
    "jsharmony": "^1.1.0",\r\n\
    '+db_dependency+'\r\n\
    "jsharmony-factory": "^1.1.0",\r\n\
    "jsharmony-validate": "^1.1.0",\r\n\
    "jsharmony-tutorials": "^1.0.0",\r\n\
    "winser": "^1.0.2"\r\n\
  },\r\n\
  "devDependencies": {\r\n\
    "mocha": "^5.2.0"\r\n\
  }\r\n';
    rslt += "}\r\n";
    fs.writeFileSync(jshconfig.path+'/package.json', rslt);
    resolve();
  }); })

  //Create nstart
  .then(function(){ return new Promise(function(resolve, reject){
    var rslt = 'node "./app.js"';
    fs.writeFileSync(jshconfig.path+'/'+global._NSTART_CMD, rslt);
    if(!global._IS_WINDOWS) fs.chmodSync(jshconfig.path+'/'+global._NSTART_CMD, '755');
    resolve();
  }); })

  //Create folders if they do not exist
  .then(function(){ return new Promise(function(resolve, reject){
    xlib.createFolderIfNotExistsSync(jshconfig.path+'/data');
    resolve();
  }); })

  //Check Node.js version
  .then(function(){ return new Promise(function(resolve, reject){
    global._NODE_VER = process.versions.node;
    if(global._NODE_VER){
      global._NODE_VER = global._NODE_VER.split('.');
      if(parseInt(global._NODE_VER[0])>=6) return resolve();
    }
    console.log('ERROR: Please make sure Node.js 6 or higher is installed');
  }); })

  //Check if NPM is installed
  .then(function(){ return new Promise(function(resolve, reject){
    xlib.spawn(global._NPM_CMD,['-v'],function(code){},function(data){
      global._NPM_VER = data;
      if(global._NPM_VER){
        global._NPM_VER = global._NPM_VER.split('.');
        if(parseInt(global._NPM_VER[0])>=3) return resolve();
        console.log('ERROR: Please upgrade your NPM version to 3 or higher');
      }
    },undefined,function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); });
  }); })

  //Run npm install
  .then(function(){ return new Promise(function(resolve, reject){
    console.log('\r\nInstalling local dependencies');
    xlib.spawn(global._NPM_CMD,['install'],function(code){ resolve(); },function(data){
      console.log(data);
    },undefined,function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); });
  }); })

  //Done
  .then(function(){ return new Promise(function(resolve, reject){
    console.log('');
    console.log('');
    console.log('jsHarmony Tutorials have been initialized!');
    console.log('');
    console.log('Start the tutorials by running '+(global._IS_WINDOWS?'':'./')+global._NSTART_CMD);
    resolve();
  }); })

  /*
  //Run npm start
  .then(function(){ return new Promise(function(resolve, reject){
    console.log('\r\nStarting Tutorials');
    xlib.spawn(global._NPM_CMD,['start'],function(code){ resolve(); },function(data){
      console.log(data);
    },undefined,function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); });
  }); })
  */

  .then(function(){
    //Operation complete
  });

  return;
}