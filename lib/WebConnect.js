﻿/*
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

var urlparser = require('url');
var http = require('http');
var https = require('https');
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var querystring = require('querystring');
var spawn = require("child_process").spawn;
exports = module.exports = {};

/***************************
**  xlib Helper Functions **
***************************/
var xlib = {
  'spawn': function(path, params, cb, stdout, stderr, onError, options, onMessage){
    if(!options) options = { };
    var cmd = spawn(path, params, options);
    if(stdout) cmd.stdout.on('data',function(data){ stdout(data.toString()); }); //stdout(data){ xxx; }
    if(stderr) cmd.stderr.on('data',stderr); //stderr(data){ xxx; }
    cmd.on('error', function(err){if(onError) return onError(err); console.log(err); });
    if(onMessage) cmd.on('message', onMessage);
    if(cb) cmd.on('close',cb); //cb(code){ xxx; }
    return cmd;
  },
  'getSalt': function(len, options){
    options = _.extend({ noSymbols: false }, options);
    var rslt = "";
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=][}{|~,.<>?";
    if(options.noSymbols) chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i=0;i<len;i++) rslt += chars.charAt(Math.floor(Math.random()*chars.length));
    return rslt;
  },
  'createFolderIfNotExistsSync': function(path){
    if(fs.existsSync(path)) return;
    fs.mkdirSync(path, '0777');
  },
  'createFolderRecursiveSync': function (fpath) {
    fpath = path.resolve(fpath);
    if(fs.existsSync(fpath)) return;
    xlib.createFolderRecursiveSync(path.dirname(fpath));
    fs.mkdirSync(fpath, '0777');
  },
  'touchSync': function(fpath){
    if(fs.existsSync(fpath)) return;
    fs.closeSync(fs.openSync(fpath, 'w'));
  },
  'merge': function (arr1, arr2) {
    var rslt = {};
    for (var key1 in arr1) rslt[key1] = arr1[key1];
    for (var key2 in arr2) rslt[key2] = arr2[key2];
    return rslt;
  },
  'sys_error': function (err) {
    console.log('An error occurred while processing the operation:');
    console.log(err);
    console.log('\r\nPress enter to exit');
    xlib.getString(function (rslt) { process.exit(1); });
  },
  'rmdir_sub': function (path, cb){
    if ((path[path.length - 1] == '/') || (path[path.length - 1] == '\\')) path = path.substr(0, path.length - 1);
    fs.exists(path, function (exists) {
      if (!exists) return cb();
      fs.readdir(path, function (err, files) {
        if (err) return xlib.sys_error(err);
        async.eachSeries(files, function (file, files_cb) {
          var filepath = path + '/' + file;
          fs.lstat(filepath, function (lstat_err, stats) {
            if (lstat_err) return xlib.sys_error(lstat_err);
            if (stats.isDirectory()) {
              xlib.rmdir_sub(filepath, function () {
                fs.rmdir(filepath, function (rmdir_err) {
                  if (rmdir_err) return xlib.sys_error(rmdir_err);
                  files_cb();
                });
              });
            }
            else {
              fs.unlink(filepath, function (unlink_err) {
                if (unlink_err) return xlib.sys_error(unlink_err);
                files_cb();
              });
            }
          });
        }, function (files_err) {
          if (err) return xlib.sys_error(err);
          cb();
        });
      });
    });
  },
  'padLeftZ': function (str, len) {
    var rslt = str.toString();
    while (rslt.length < len) rslt = '0' + rslt;
    return rslt;
  },
  'isFormData': function(d){ return ((_.isObject(d)) && ('submit' in d) && (_.isFunction(d.submit))); },
  'getPassword': function (cb) { return xlib.getString(cb, '*'); },
  'getStringAsync': function(onStart,onComplete, passchar){
    return function(){ return new Promise(function(resolve,reject){
      var rslt_onStart = true;
      var handleResult = function(rslt, retry){ var cbrslt = onComplete(rslt,retry); if(cbrslt===false) return reject(); if(cbrslt===true) return resolve(rslt); };
      if(onStart) rslt_onStart = onStart();
      if(rslt_onStart === false) return resolve();
      if(_.isString(rslt_onStart)) return handleResult(rslt_onStart, function(){ xlib.getString(handleResult,passchar); });
      xlib.getString(handleResult,passchar);
    }); };
  },
  'getString': function (cb, passchar) {
    var stdin = process.openStdin();
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    var rslt = "";
    stdin.on("data", function (c) {
      c = c + "";
      switch (c) {
        case "\n": case "\r": case "\u0004":
          process.stdout.write('\n');
          //stdin.setRawMode(false); //Would cause problems on Windows 8, subsequent reads don't work
          stdin.pause();
          stdin.removeAllListeners('data');
          cb(rslt, function(){ xlib.getString(cb,passchar); });
          break;
        case "\u0003":
          process.exit();
          break;
        case "\u0008":
          process.stdout.write(c);
          process.stdout.write(' ');
          process.stdout.write(c);
          if (rslt.length > 0) rslt = rslt.substr(0, rslt.length - 1);
          break;
        default:
          if (c.charCodeAt(0).toString(16) == '1b') break;
          if (passchar) process.stdout.write(passchar);
          else process.stdout.write(c);
          rslt += c;
          break;
      }
    });
  }
};

/**********************
**  Node Web Connect **
**********************/
function WebConnect() {
  this.MAX_REDIRECTS = 20;
}
WebConnect.prototype.reqjson = function (url, method, post, headers, ftarget, callback) {
  this.req(url, method, post, headers, ftarget, function (err, res, rslt) {
    if (callback) {
      if (err) return callback(err, null, null, null);
      if (rslt && (rslt == '---SAVEDTOFILE---')) return callback(err, '---SAVEDTOFILE---', null, res);
      var rsltjson = null;
      try { rsltjson = JSON.parse(rslt); }
      catch (ex) { /* Do nothing */ }
      return callback(null, rslt, rsltjson, res);
    }
  });
};
WebConnect.prototype.req = function (url, method, post, headers, ftarget, callback, options) {
  var _this = this;
  options = _.extend({ redirects: 0 }, options);
  if (typeof (url) == 'function') url = url();
  if (typeof (post) == 'function') post = post();
  if (!xlib.isFormData(post) && (typeof (post) !== 'string')) post = querystring.stringify(post);
  var urlparts = urlparser.parse(url, true);
  var browser = http;
  if (url.substring(0, 6) == 'https:') browser = https;
  if (!urlparts.port) {
    if (url.substring(0, 6) == 'https:') { urlparts.port = 443; }
    else urlparts.port = 80;
  }
  var reqoptions = {
    host: urlparts.hostname,
    port: urlparts.port,
    path: urlparts.path,
    method: method,
    timeout: 0
  };
  if (reqoptions.host == 'localhost') reqoptions.rejectUnauthorized = false;
  reqoptions.headers = {};
  if (global.authcookie) reqoptions.headers.Cookie = global.authcookie;
  if (post) {
    if (xlib.isFormData(post)) {
      reqoptions['headers'] = _.merge(reqoptions['headers'], post.getHeaders());
    }
    else {
      reqoptions.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      reqoptions.headers['Content-Length'] = post.length;
    }
  }
  if (headers) {
    reqoptions.headers = xlib.merge(reqoptions.headers, headers);
  }
  
  var req = browser.request(reqoptions, function (res) {
    // response is here
    if (global.debug) console.log(reqoptions.method + ' ' + url + "  Status: " + res.statusCode);

    if((options.redirects >= 0) && res.statusCode && ((res.statusCode >= 300) && (res.statusCode <= 399))){
      var redirectUrl = (res.headers && res.headers.location);
      if(url){
        if(options.redirects >= _this.MAX_REDIRECTS){
          return callback(new Error('Maximum number of redirects exceeded'));
        }
        _this.req(redirectUrl, method, post, headers, ftarget, callback, _.extend(options, { redirects: options.redirects+1 }));
        return;
      }
    }
    
    var isdownload = false;
    //if (res.statusCode == 302) console.log('Redirect to ' + res.headers.location);
    //if (global.debug) console.log('Response: ' + JSON.stringify(res.headers));
    if (ftarget && ('content-type' in res.headers) && (res.headers['content-type'].indexOf('text/plain') !== 0) && (res.headers['content-type'].indexOf('text/html') !== 0)) isdownload = true;
    if (!isdownload) res.setEncoding('utf8');
    
    var rslt = '';
    res.on('end', function () {
      if (callback) {
        if (isdownload) return; //Use the fout.on('finish') handler
        return callback(null, res, rslt);
      }
    });
    if (isdownload) {
      //console.log('Saving output to ' + ftarget);
      var fout = fs.createWriteStream(ftarget);
      fout.on('finish', function () {
        if (callback) {
          return callback(null, res, '---SAVEDTOFILE---');
        }
      });
      res.pipe(fout);
    }
    else {
      res.on('data', function (chunk) {
        rslt += chunk;
        //Append chunk to file when working with large file sizes
        //fs.appendFile('testout.txt', chunk, function (err) { });
      });
    }
  });
  
  req.on('error', function (err) {
    if (callback) callback(err, null, null);
  });
  if (post) {
    if (xlib.isFormData(post)) {
      post.getLength(function (err, length) {
        req.setHeader('Content-Length', length);
        post.pipe(req);
      });
      return;
    }
    else req.write(post);
  }
  req.end();
};

exports.WebConnect = WebConnect;
exports.xlib = xlib;