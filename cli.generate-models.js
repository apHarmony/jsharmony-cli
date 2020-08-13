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
var async = require('async');
var jshcli_Shared = require('./lib/cli.shared.js'); 
var jsfapi = null;

exports = module.exports = {};

exports.Run = function(params, onSuccess){
  console.log('Running Generate Models operation...');

  var jshconfig = {
    path: process.cwd()
  };
  jshconfig.projectname = path.basename(jshconfig.path) || 'application';

  if(global.default_jshconfig) _.extend(jshconfig, global.default_jshconfig);

  var models_path = '';
  var tables = [];
  var models = {};
  var gen_messages = [];

  Promise.resolve()

  //Load Config
  .then(function(){ return new Promise(function(resolve, reject){
    jsfapi = jshcli_Shared.jsHarmonyFactoryAPI(jshconfig, { db: params.DATABASE });

    jsfapi.Init(function(){
      if(params.OUTPUT_PATH) models_path = params.OUTPUT_PATH + '/';
      else if(params.OUTPUT_FILE) models_path = path.dirname(params.OUTPUT_FILE) + '/';
      else models_path = jsfapi.jsh.Config.appbasepath + '/models/';
      resolve();
    });
  }); })

  //Verify the output folder is accessible
  .then(xlib.getStringAsync(function(){
    if(fs.existsSync(models_path)) return false;

    console.log('\r\nThe output folder is not accessible');
    console.log(models_path);
    console.log('\r\nCreate output folder?');
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ fs.mkdirSync(models_path, '0777'); return true; }
    else if(rslt=="2"){ return false; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Test Database Connection
  .then(function(){ return new Promise(function(resolve, reject){
    jsfapi.dbTest(function(err){
      if(err) return reject();
      return resolve();
    });
  }); })

  //Generate the models
  .then(function(){ return new Promise(function(resolve, reject){
    var table = null;
    var tablestr = params.DATABASE_TABLE;
    if(tablestr && (tablestr != '*')){
      tablestr = tablestr.trim();
      table = { schema: '', name: '' };
      var idx = tablestr.indexOf('.');
      if(idx >= 0){
        table.schema = tablestr.substr(0,idx);
        table.name = tablestr.substr(idx + 1,tablestr.length - idx - 1);
      }
      else table.name = tablestr;
    }
    jsfapi.codegen.generateModels(table,{ db: params.DATABASE, short: true },function(err, messages, rslt){
      if(err) return reject(err);
      if(messages.length > 0) gen_messages = gen_messages.concat(messages);
      models = rslt;
      return resolve();
    });
  }); })

  //Display warnings and messages, if applicable
  .then(xlib.getStringAsync(function(){
    if(gen_messages.length == 0) return false;

    console.log('');
    for(var i=0;i<gen_messages.length;i++) console.log(gen_messages[i]);
    console.log('\r\nContinue with model generation?');
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ return true; }
    else if(rslt=="2"){ return false; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Test Database Connection
  .then(function(){ return new Promise(function(resolve, reject){
    jsfapi.dbTest(function(err){
      if(err) return reject();
      return resolve();
    });
  }); })

  //Verify if output files will be overwritten
  .then(xlib.getStringAsync(function(){
    //Check if any files will be overwritten
    var overwritten = [];
    if(params.OUTPUT_FILE){
      if(fs.existsSync(params.OUTPUT_FILE)) overwritten.push(params.OUTPUT_FILE);
    }
    else {
      for(var modelname in models){
        var filepath = models_path + modelname + '.json';
        if(fs.existsSync(filepath)) overwritten.push(filepath);
      }
    }
    if(overwritten.length==0) return false;

    console.log('\r\nThe following models already exist in the models folder:');
    for(var i=0;i<overwritten.length;i++) console.log(overwritten[i]);
    console.log('\r\nOverwrite the existing models?');
    console.log('1) Yes');
    console.log('2) No');
  },function(rslt,retry){
    if(rslt=="1"){ return true; }
    else if(rslt=="2"){ return false; }
    else{ console.log('Invalid entry.  Please enter the number of your selection'); retry(); }
  }))

  //Save to disk
  .then(function(){ return new Promise(function(resolve, reject){
    if(params.OUTPUT_FILE){
      var txt = "";
      var modelcount = _.size(models);
      if(modelcount == 1){ for(var modelname in models) txt = models[modelname]; }
      else {
        txt += "{";
        var first = true;
        for(var modelname in models){
          if(!first) txt += ',';
          txt += "\r\n  " + JSON.stringify(modelname) + ": ";
          var modeltxt = models[modelname].trim().replace(new RegExp("\n",'g'),"\n  ");
          txt += modeltxt;
          first = false;
        }
        txt += "\r\n}";
      }
      fs.writeFile(params.OUTPUT_FILE, txt, 'utf8', function(err){
        if(err) return reject(err);
        return resolve();
      });
    }
    else{
      async.eachSeries(_.keys(models), function(modelname, callback){
        var filepath = models_path + modelname + '.json';
        fs.writeFile(filepath, models[modelname], 'utf8', callback);
      }, function(err){
        if(err) return reject(err);
        return resolve();
      });
    }
  }); })

  //Done
  .then(function(){
    console.log("\r\n\r\nOperation complete.  The following models have been generated: \r\n");
    if(params.OUTPUT_FILE){
      console.log(params.OUTPUT_FILE);
    }
    else{
      for(var modelname in models) console.log(models_path + modelname + '.json');
    }
  })

  .then(function(){
    jsfapi.dbClose(onSuccess);
  })

  .catch(function(err){
    if(err) console.log(err);
    if(jsfapi) jsfapi.dbClose();
    process.exit(1);
  });

  return;
}