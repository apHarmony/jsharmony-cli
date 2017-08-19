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
var jshcli_Generate = require('./cli.generate.js');
var jshcli_InitDB = require('./cli.init-db.js');

global._IS_WINDOWS = /^win/.test(process.platform);
global._NPM_CMD = global._IS_WINDOWS ? 'npm.cmd' : 'npm';
global._NSTART_CMD = global._IS_WINDOWS ? 'nstart.cmd' : 'nstart.sh';
global._SUPERVISOR_CMD = global._IS_WINDOWS ? 'supervisor.cmd' : 'supervisor';
global._FOUND_SUPERVISOR = false;
global._INSTALL_SUPERVISOR = false;
global._NPM_VER = '';
global._NODE_VER = '';

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
create empty     - Initializes empty scaffolding\r\n\
create tutorials - Initializes the quickstart tutorials application\r\n\
init db          - Initializes the jsHarmony Factory database\r\n\
generate         - Auto-generate models based on the database schema\r\n\
    -t [DATABASE TABLE]  Database table name, or * for all tables (required)\r\n\
    -f [FILENAME]        Output filename (optional)\r\n\
    -d [PATH]            Output path (optional)\r\n\
";
global.commands = {
  'create factory': jshcli_CreateFactory.Run,
  'create tutorials': jshcli_CreateTutorials.Run,
  'create empty': jshcli_CreateEmpty.Run,
  'init db': jshcli_InitDB.Run,
  'generate': jshcli_Generate.Run,
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
  if(!(cmd in global.commands)){ return sys_error('INVALID COMMAND: '+cmd); }
  while(args.length > 0){
    var arg = args.shift();
    if(cmd=='generate'){
      if(arg == '-t'){ if(args.length === 0){ return sys_error('Missing DATABASE TABLE: -t [DATABASE TABLE]'); } params.DATABASE_TABLE = args.shift(); continue; }
      else if(arg == '-f'){ if(args.length === 0){ return sys_error('Missing FILENAME: -f [FILENAME]'); } params.OUTPUT_FILE = args.shift(); continue; }
      else if(arg == '-d'){ if(args.length === 0){ return sys_error('Missing FILENAME: -d [PATH]'); } params.OUTPUT_PATH = args.shift(); continue; }
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

  if(cmd=='generate'){
    if(!params.DATABASE_TABLE){ return sys_error('Generate command requires a database table (-t) parameter.\r\nUse * for all tables'); }
  }

  if(onComplete) onComplete(cmd, params);
  return true;
}

//Main Workflow
ValidateParameters(function(cmd, params){
  global.commands[cmd](params);
});