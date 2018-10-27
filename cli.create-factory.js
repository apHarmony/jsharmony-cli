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
var jshcli_CreateDatabase = require('./cli.create-database.js');
var jshcli_Shared = require('./lib/cli.shared.js'); 

exports = module.exports = {};

exports.Run = function(params, onSuccess){
  console.log('Running CreateFactory operation...');
  //console.log('\r\nThese settings can later be changed in your app.config.js file');
  console.log('\r\n*** jsHarmony Factory requires a PostgreSQL or SQL Server database');

  var jshconfig = {
    path: process.cwd(),
    dbserver: '___DB_SERVER___',
    dbname: '___DB_NAME___',
    dbuser: '___DB_USER___',
    dbpass: '___DB_PASS___'
  };
  jshconfig.projectname = path.basename(jshconfig.path);

  if(global.default_jshconfig) _.extend(jshconfig, global.default_jshconfig);

  Promise.resolve()
  
  //Confirm that jsHarmony factory will be set up in the current folder
  .then(xlib.getStringAsync(function(){
    if(fs.readdirSync(jshconfig.path).length > 0) console.log('\r\nThis command will overwrite any existing configuration, and set up the jsHarmony Factory in the current folder:');
    else console.log('\r\nThis command will set up the jsHarmony Factory in the current folder:');
    console.log(jshconfig.path);
    console.log('Continue with the operation?');
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
  },function(rslt,retry){
    if(rslt=="1"){  jshconfig.dbtype = 'pgsql'; return true; }
    else if(rslt=="2"){ jshconfig.dbtype = 'mssql'; return true; }
    else if(rslt=="3"){ jshconfig.dbtype = 'sqlite'; return true; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Create app.js
  .then(function(){ return new Promise(function(resolve, reject){
    var rslt = "#!/usr/bin/env node\r\n\r\n";
    rslt += "var jsHarmonyFactory = require('jsharmony-factory');\r\n";
    rslt += "var jsh = new jsHarmonyFactory.Application({},{});\r\n";
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
    rslt += "  //Database Configuration\r\n";
    if(jshconfig.dbtype=='pgsql'){
      rslt = "var pgsqlDBDriver = require('jsharmony-db-pgsql');\r\n\r\n"+rslt;
      rslt += "  dbconfig['default'] = { _driver: new pgsqlDBDriver(), host: "+JSON.stringify(jshconfig.dbserver)+", database: "+JSON.stringify(jshconfig.dbname)+", user: "+JSON.stringify(jshconfig.dbuser)+", password: "+JSON.stringify(jshconfig.dbpass)+" };\r\n";
    }
    else if(jshconfig.dbtype=='mssql'){
      rslt = "var mssqlDBDriver = require('jsharmony-db-mssql');\r\n\r\n"+rslt;
      rslt += "  dbconfig['default'] = { _driver: new mssqlDBDriver(), server: "+JSON.stringify(jshconfig.dbserver)+", database: "+JSON.stringify(jshconfig.dbname)+", user: "+JSON.stringify(jshconfig.dbuser)+", password: "+JSON.stringify(jshconfig.dbpass)+" };\r\n";
    }
    else if(jshconfig.dbtype=='sqlite'){
      rslt = "var sqliteDBDriver = require('jsharmony-db-sqlite');\r\n\r\n"+rslt;
      rslt += "  dbconfig['default'] = { _driver: new sqliteDBDriver(), database: "+JSON.stringify(jshconfig.dbname)+" };\r\n";
    }
    rslt += "\r\n";
    rslt += "  //Server Settings\r\n";
    rslt += "  //config.server.http_port = 8080;\r\n";
    rslt += "  //config.server.https_port = 8081;\r\n";
    rslt += "  //config.server.https_cert = 'path/to/https-cert.pem';\r\n";
    rslt += "  //config.server.https_key = 'path/to/https-key.pem';\r\n";
    rslt += "  //config.server.https_ca = 'path/to/https-ca.crt';\r\n";
    rslt += "  config.frontsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "\r\n";
    rslt += "  //jsHarmony Factory Configuration\r\n";
    rslt += "  var configFactory = config.modules['jsHarmonyFactory'];\r\n";
    rslt += "\r\n";
    rslt += "  configFactory.clientsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  configFactory.clientcookiesalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  configFactory.mainsalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
    rslt += "  configFactory.maincookiesalt = "+JSON.stringify(xlib.getSalt(60))+";\r\n";
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
    "install-windows-service": "winser -i",\r\n\
    "uninstall-windows-service": "winser -r",\r\n\
    "create-database": "node node_modules/jsharmony-factory/init/create.js",\r\n\
    "init-database": "node node_modules/jsharmony-factory/init/init.js"\r\n\
  },\r\n\
  "dependencies": {\r\n\
    "jsharmony": "^1.1.0",\r\n\
    '+db_dependency+'\r\n\
    "jsharmony-factory": "^1.1.0",\r\n\
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
    var rslt = 'supervisor -i test,public,data -w "./models,./views,./app.config.js,./app.js" -e "node,js,json,css,sql" node "./app.js"';
    fs.writeFileSync(jshconfig.path+'/'+global._NSTART_CMD, rslt);
    if(!global._IS_WINDOWS) fs.chmodSync(jshconfig.path+'/'+global._NSTART_CMD, '755');
    resolve();
  }); })

  //Create folders if they do not exist
  .then(function(){ return new Promise(function(resolve, reject){
    xlib.createFolderIfNotExistsSync(jshconfig.path+'/data');
    xlib.createFolderIfNotExistsSync(jshconfig.path+'/models');
    xlib.createFolderIfNotExistsSync(jshconfig.path+'/models/_reports');
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
    global._INSTALL_SUPERVISOR = false;
    if(global._FOUND_SUPERVISOR) return false;
    console.log('\r\nInstall "supervisor" package to auto-restart the jsHarmony server when models are updated?');
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ global._INSTALL_SUPERVISOR = true; return true; }
    else if(rslt=="2"){ return true; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

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
    xlib.spawn(global._NPM_CMD,['install'],function(code){ resolve(); },function(data){
      console.log(data);
    },undefined,function(err){ console.log('ERROR: Could not find or start '+global._NPM_CMD+'. Check to make sure Node.js and NPM is installed.'); });
  }); })

  //Ask to create a new database
  .then(xlib.getStringAsync(function(){
    global._CREATE_DATABASE = false;
    console.log('\r\nA database is required to run the jsHarmony Factory');
    console.log('\r\nCreate a new database for this jsHarmony Factory project?');
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ global._CREATE_DATABASE = true; return true; }
    else if(rslt=="2"){ return true; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Create jsHarmony Factory Database
  .then(function(){ return new Promise(function(resolve, reject){
    if(!global._CREATE_DATABASE){
      console.log('\r\nPlease configure your database settings in '+jshconfig.path+'\\app.config.js');
      console.log('Then run "jsharmony init database" to set up the jsHarmony Factory tables in the existing database');
      console.log('\r\nIf you decide to create a new database for the project, instead run "jsharmony create database" from the project root to automatically create the database.');
      return resolve();
    }
    else jshcli_CreateDatabase.Run(params,resolve);
  }); })

  .then(function(){ return new Promise(function(resolve, reject){
    resolve();
  }); })

  //Done
  .then(function(){
  })

  .catch(function(err){
    if(err) console.log(err);
    process.exit(1);
  });

  return;
}