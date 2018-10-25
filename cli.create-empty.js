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
var jshcli_Shared = require('./lib/cli.shared.js'); 

exports = module.exports = {};

exports.Run = function(params, onSuccess){
  console.log('Running CreateEmpty operation...');
  console.log('\r\nConfiguration can be changed in the app.config.js file');

  var jshconfig = {
    path: process.cwd()
  };
  jshconfig.projectname = path.basename(jshconfig.path);

  if(global.default_jshconfig) _.extend(jshconfig, global.default_jshconfig);

  Promise.resolve()
  
  ///*
  //Confirm that jsHarmony factory will be set up in the current folder
  .then(xlib.getStringAsync(function(){
    console.log('\r\nThis will overwrite any existing configuration and set up an empty jsHarmony scaffolding in the current folder');
    console.log(jshconfig.path);
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ return true; }
    else if(rslt=="2"){ return false; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Ask for the database type
  .then(xlib.getStringAsync(function(){
    if(jshconfig.dbtype) return false;
    console.log('\r\nPlease select a database type:');
    console.log('1) PostgreSQL');
    console.log('2) SQL Server');
    console.log('3) SQLite');
    console.log('4) None');
  },function(rslt,retry){
    if(rslt=="1"){  jshconfig.dbtype = 'pgsql'; return true; }
    else if(rslt=="2"){ jshconfig.dbtype = 'mssql'; return true; }
    else if(rslt=="3"){ jshconfig.dbtype = 'sqlite'; return true; }
    else if(rslt=="4"){ jshconfig.dbtype = 'none'; return true; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Ask for the database server
  .then(xlib.getStringAsync(function(){
    if(_.includes(['none','sqlite'],jshconfig.dbtype)) return false;
    if(jshconfig.dbserver) return false;
    console.log('\r\nPlease enter the database server and/or port');
  },function(rslt,retry){
      if(rslt){ jshconfig.dbserver = rslt; return true; }
      else{ console.log('Invalid entry.  Please enter a valid database server'); retry(); }
  }))

  //Ask for the database path, if applicable
  .then(xlib.getStringAsync(function(){
    if(!_.includes(['sqlite'],jshconfig.dbtype)) return false;
    if(jshconfig.dbname) return false;
    process.stdout.write('Database path ['+global._DEFAULT_SQLITE_PATH+']: ');
  },function(rslt,retry){
      if(!rslt) rslt = global._DEFAULT_SQLITE_PATH;
      try{
        var dbpath = path.resolve(rslt);
        var dbfolder = path.dirname(dbpath);
        xlib.createFolderRecursiveSync(dbfolder);
        xlib.touchSync(dbpath);
      }
      catch(ex){
        console.log(ex);
        process.stdout.write('Error creating database.  Please enter a valid database path: '); 
        retry();
        return;
      }
      jshconfig.dbname = rslt;
      return true;
  }))

  //Ask for the database name, if applicable
  .then(xlib.getStringAsync(function(){
    if(!_.includes(['pgsql','mssql'],jshconfig.dbtype)) return false;
    if(jshconfig.dbname) return false;
    console.log('\r\nPlease enter the database name');
  },function(rslt,retry){
      if(rslt){ jshconfig.dbname = rslt; return true; }
      else{ console.log('Invalid entry.  Please enter a valid database name'); retry(); }
  }))

  //Ask for the database user
  .then(xlib.getStringAsync(function(){
    if(_.includes(['none','sqlite'],jshconfig.dbtype)) return false;
    if(jshconfig.dbuser) return false;
    console.log('\r\nPlease enter the database user');
  },function(rslt,retry){
      if(rslt){ jshconfig.dbuser = rslt; return true; }
      else{ console.log('Invalid entry.  Please enter a valid database user'); retry(); }
  }))

  //Ask for the database password
  .then(xlib.getStringAsync(function(){
    if(_.includes(['none','sqlite'],jshconfig.dbtype)) return false;
    if(jshconfig.dbpass) return false;
    console.log('\r\nPlease enter the database password');
  },function(rslt,retry){
      if(rslt){ jshconfig.dbpass = rslt; return true; }
      else{ console.log('Invalid entry.  Please enter a valid database password'); retry(); }
  }, '*'))
  /* */
  
  //Create app.js
  .then(function(){ return new Promise(function(resolve, reject){
    var rslt = "#!/usr/bin/env node\r\n\r\n";
    rslt += "var jsHarmony = require('jsharmony');\r\n";
    if(jshconfig.dbtype=='pgsql'){
      rslt += "var pgsqlDBDriver = require('jsharmony-db-pgsql');\r\n";
    }
    else if(jshconfig.dbtype=='mssql'){
      rslt += "var mssqlDBDriver = require('jsharmony-db-mssql');\r\n";
    }
    else if(jshconfig.dbtype=='sqlite'){
      rslt += "var sqliteDBDriver = require('jsharmony-db-sqlite');\r\n";
    }
    rslt += "\r\n";
    rslt += "var jsh = new jsHarmony();\r\n";

    if(jshconfig.dbtype=='pgsql'){
      rslt += "jsh.DBConfig['default'] = { _driver: new pgsqlDBDriver(), host: "+JSON.stringify(jshconfig.dbserver)+", database: "+JSON.stringify(jshconfig.dbname)+", user: "+JSON.stringify(jshconfig.dbuser)+", password: "+JSON.stringify(jshconfig.dbpass)+" };\r\n";
    }
    else if(jshconfig.dbtype=='mssql'){
      rslt += "jsh.DBConfig['default'] = { _driver: new mssqlDBDriver(), server: "+JSON.stringify(jshconfig.dbserver)+", database: "+JSON.stringify(jshconfig.dbname)+", user: "+JSON.stringify(jshconfig.dbuser)+", password: "+JSON.stringify(jshconfig.dbpass)+" };\r\n";
    }
    else if(jshconfig.dbtype=='sqlite'){
      rslt += "jsh.DBConfig['default'] = { _driver: new sqliteDBDriver(), database: "+JSON.stringify(jshconfig.dbname)+" };\r\n";
    }
    else if(jshconfig.dbtype=='none'){
    }
    rslt += "\r\n";
    rslt += "//Server Settings\r\n";
    rslt += "//jsh.Config.server.http_port = 8080;\r\n";
    rslt += "//jsh.Config.server.https_port = 8081;\r\n";
    rslt += "//jsh.Config.server.https_cert = 'path/to/https-cert.pem';\r\n";
    rslt += "//jsh.Config.server.https_key = 'path/to/https-key.pem';\r\n";
    rslt += "//jsh.Config.server.https_ca = 'path/to/https-ca.crt';\r\n";
    rslt += "jsh.Config.frontsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "\r\n";
    rslt += "jsh.Run();\r\n";
    if(!global._IS_WINDOWS) rslt = jshcli_Shared.dos2unix(rslt);
    fs.writeFileSync(jshconfig.path+'/app.js', rslt);
    if(!global._IS_WINDOWS) fs.chmodSync(jshconfig.path+'/app.js', '755');
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
    "install-windows-service": "winser -i",\r\n\
    "uninstall-windows-service": "winser -r"\r\n\
  },\r\n\
  "dependencies": {\r\n\
    "jsharmony": "^1.1.0",\r\n\
    '+db_dependency+'\r\n\
    "jsharmony-validate": "^1.1.0",\r\n\
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
    var rslt = 'supervisor -i test,public,data -w "./models,./views,./app.config.js,./app.js" -e "node,js,json,css" node "./app.js"';
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

  //Check if supervisor is installed
  .then(function(){ return new Promise(function(resolve, reject){
    xlib.spawn(global._SUPERVISOR_CMD,[],function(code){},function(data){
      global._FOUND_SUPERVISOR = true;
      resolve();
    },undefined,function(err){ 
      global._FOUND_SUPERVISOR = false;
      resolve();
    });
  }); })

  //Ask user to install supervisor
  .then(xlib.getStringAsync(function(){
    if(global._FOUND_SUPERVISOR) return false;
    console.log('\r\nInstall "supervisor" package to auto-restart the jsHarmony server when models are updated?');
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ global._INSTALL_SUPERVISOR = true; return true; }
    else if(rslt=="2"){ return false; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }  }))

  //Install supervisor globally
  .then(function(){ return new Promise(function(resolve, reject){
    if(!global._INSTALL_SUPERVISOR) return resolve();
    console.log('\r\nInstalling Node.js supervisor to auto-restart jsHarmony Factory');
    xlib.spawn(global._NPM_CMD,['install','-g','supervisor'],function(code){ resolve(); },function(data){
      console.log(data);
    },undefined,function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); });
  }); })

  //Run npm install
  .then(function(){ return new Promise(function(resolve, reject){
    console.log('\r\nInstalling local dependencies');
    xlib.spawn(global._NPM_CMD,['update'],function(code){ resolve(); },function(data){
      console.log(data);
    },undefined,function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); });
  }); })

  .then(function(){ return new Promise(function(resolve, reject){
    resolve();
  }); })

  //Done
  .then(function(){
    console.log('');
    console.log('');
    console.log('jsHarmony has been initialized!');
    console.log('');
    console.log('** Please update the config in app.js');
    console.log('** Be sure to configure ports and HTTPS for security');
    console.log('');
    console.log('Start the server by running '+(global._IS_WINDOWS?'':'./')+global._NSTART_CMD);
    console.log('');
  })

  .catch(function(err){
    if(err) console.log(err);
    process.exit(1);
  });

  return;
}