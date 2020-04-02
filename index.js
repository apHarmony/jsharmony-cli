#!/usr/bin/env node

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
var os = require('os');

var path_TestDBConfig = path.join(os.homedir(),'jsharmony/testDB.json');
if(fs.existsSync(path_TestDBConfig)){
  global.default_jshconfig = JSON.parse(fs.readFileSync(path_TestDBConfig,'utf8'));
  console.log('\r\n==== Loading test database config ====\r\n'+path_TestDBConfig+'\r\n');
}

var jshcli_CreateFactory = require('./cli.create-factory.js');
var jshcli_CreateEmpty = require('./cli.create-empty.js');
var jshcli_CreateTutorials = require('./cli.create-tutorials.js');
var jshcli_GenerateModels = require('./cli.generate-models.js');
var jshcli_GenerateSQLObjects = require('./cli.generate-sqlobjects.js');
var jshcli_CreateDatabase = require('./cli.create-database.js');
var jshcli_InitDatabase = require('./cli.init-database.js');

global._IS_WINDOWS = /^win/.test(process.platform);
global._NPM_CMD = global._IS_WINDOWS ? 'npm.cmd' : 'npm';
global._NSTART_CMD = global._IS_WINDOWS ? 'nstart.cmd' : 'nstart.sh';
global._SUPERVISOR_CMD = global._IS_WINDOWS ? 'supervisor.cmd' : 'supervisor';
global._FOUND_SUPERVISOR = false;
global._INSTALL_SUPERVISOR = false;
global._NPM_VER = '';
global._NODE_VER = '';
global._DEFAULT_SQLITE_PATH = 'data/db/project.db';

global.debug = true;
global.help_text = "\r\n\
-------------------\r\n\
:::jsHarmony CLI:::\r\n\
-------------------\r\n\
Usage: jsharmony [command] [options]\r\n\
\r\n\
The following commands are available:\r\n\
\r\n\
create factory   - Initializes a standard application\r\n\
    --with-client-portal | --no-client-portal\r\n\
create empty     - Initializes empty scaffolding\r\n\
create tutorials - Initializes the quickstart tutorials application\r\n\
create database  - Creates a new jsHarmony Factory database\r\n\
init database    - Adds jsHarmony Factory tables to an existing database\r\n\
    --with-client-portal | --no-client-portal\r\n\
generate models  - Auto-generate models based on the database schema\r\n\
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)\r\n\
    -f [FILENAME]        Output filename (optional)\r\n\
    -d [PATH]            Output path (optional)\r\n\
    -db [DATABASE]      Target database (optional)\r\n\
generate sqlobjects - Auto-generate sqlobjects based on the database schema\r\n\
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)\r\n\
    -f [FILENAME]        Output filename (optional)\r\n\
    -d [PATH]            Output path (optional)\r\n\
    -db [DATABASE]       Target database (optional)\r\n\
    --with-data          Include data in generated models\r\n\
";
global.commands = {
  'create factory': jshcli_CreateFactory.Run,
  'create tutorials': jshcli_CreateTutorials.Run,
  'create empty': jshcli_CreateEmpty.Run,
  'create database': jshcli_CreateDatabase.Run,
  'init database': jshcli_InitDatabase.Run,
  'generate models': jshcli_GenerateModels.Run,
  'generate sqlobjects': jshcli_GenerateSQLObjects.Run,
};
global.start_time = new Date();

process.on('exit', function () {
  if(global.debug){
    var end_time = new Date();
    var runtime_ms = end_time - global.start_time;
    //Log('Run time: '+(runtime_ms/1000)+' seconds');
  }
});

function Log(txt){
  if(global.debug) console.log(txt);
}

function sys_error(txt){ return xlib.sys_error("\r\n"+txt); }

function ValidateParameters(onComplete){
  var args = [];
  var i = 0;
  var cmd = '';
  var params = { };

  process.argv.forEach(function (val, index, array) {
    i++;
    if(i >= 3) args.push(val);
  });
  if(args.length === 0){ return console.log(global.help_text); }
  var cmd = args.shift();
  if(cmd=='create') cmd += ' ' + args.shift();
  if(cmd=='init') cmd += ' ' + args.shift();
  if(cmd=='generate') cmd += ' ' + args.shift();
  if(!(cmd in global.commands)){ return sys_error('INVALID COMMAND: '+cmd+"\r\n\r\nPlease run jsharmony without any arguments for arguments listing"); }
  while(args.length > 0){
    var arg = args.shift();
    if(cmd=='generate models'){
      if(arg == '-t'){ if(args.length === 0){ return sys_error('Missing DATABASE TABLE: -t [DATABASE TABLE]'); } params.DATABASE_TABLE = args.shift(); continue; }
      else if(arg == '-f'){ if(args.length === 0){ return sys_error('Missing FILENAME: -f [FILENAME]'); } params.OUTPUT_FILE = args.shift(); continue; }
      else if(arg == '-d'){ if(args.length === 0){ return sys_error('Missing FILENAME: -d [PATH]'); } params.OUTPUT_PATH = args.shift(); continue; }
      else if(arg == '-db'){ if(args.length === 0){ return sys_error('Missing DATABASE: -db [PATH]'); } params.DATABASE = args.shift(); continue; }
    }
    else if(cmd=='generate sqlobjects'){
      if(arg == '-t'){ if(args.length === 0){ return sys_error('Missing DATABASE TABLE: -t [DATABASE TABLE]'); } params.DATABASE_TABLE = args.shift(); continue; }
      else if(arg == '-f'){ if(args.length === 0){ return sys_error('Missing FILENAME: -f [FILENAME]'); } params.OUTPUT_FILE = args.shift(); continue; }
      else if(arg == '-d'){ if(args.length === 0){ return sys_error('Missing FILENAME: -d [PATH]'); } params.OUTPUT_PATH = args.shift(); continue; }
      else if(arg == '-db'){ if(args.length === 0){ return sys_error('Missing DATABASE: -db [PATH]'); } params.DATABASE = args.shift(); continue; }
      else if(arg == '--with-data'){ params.WITH_DATA = true; continue; }
    }
    else if(cmd=='create factory'){
      if(arg == '--with-client-portal'){ params.CLIENT_PORTAL = true; continue; }
      else if(arg == '--no-client-portal'){ params.CLIENT_PORTAL = false; continue; }
    }
    else if(cmd=='create database'){
      if(arg == '--with-client-portal'){ params.CLIENT_PORTAL = true; continue; }
      else if(arg == '--no-client-portal'){ params.CLIENT_PORTAL = false; continue; }
    }
    else if(cmd=='init database'){
      if(arg == '--with-client-portal'){ params.CLIENT_PORTAL = true; continue; }
      else if(arg == '--no-client-portal'){ params.CLIENT_PORTAL = false; continue; }
    }
    return sys_error('Invalid argument: '+arg);
  }
  
  //Valid output file
  if(params.OUTPUT_FILE){
    var is_valid_file = false;
    try{
      if(!fs.statSync(params.OUTPUT_FILE).isFile()){ return sys_error('OUTPUT_FILE is not a valid file'); }
      else is_valid_file = true;
    }
    catch(ex){ /* FILE NOT FOUND */ }
    if(!is_valid_file){
      //Check if folder is valid
      try{
        var dirname = path.dirname(params.OUTPUT_FILE);
        if(!fs.statSync(dirname).isDirectory()){ return sys_error('OUTPUT_FILE is not in a valid folder'); }
        else is_valid_file = true;
      }
      catch(ex){ return sys_error('OUTPUT_FILE is not in a valid folder'); }
    }
  }
  if(params.OUTPUT_PATH){
    params.OUTPUT_PATH = params.OUTPUT_PATH.replace(/[/\\]$/, "");
    //Check if folder is valid
    try{
      if(!fs.statSync(params.OUTPUT_PATH).isDirectory()){ return sys_error('OUTPUT_PATH is not a valid directory'); }
    }
    catch(ex){ return sys_error(ex.toString()); }
  }

  if(params.OUTPUT_FILE && params.OUTPUT_PATH){ return sys_error('Cannot use both OUTPUT_FILE and OUTPUT_PATH flags'); }

  if(cmd=='generate models'){
    if(!params.DATABASE_TABLE){ return sys_error('Generate models command requires a database table (-t) parameter.\r\nUse * for all tables'); }
  }

  if(cmd=='generate sqlobjects'){
    if(!params.DATABASE_TABLE){ return sys_error('Generate sqlobjects command requires a database table (-t) parameter.\r\nUse * for all tables'); }
  }

  if(onComplete) onComplete(cmd, params);
  return true;
}

//Main Workflow
ValidateParameters(function(cmd, params){
  global.commands[cmd](params);
});
