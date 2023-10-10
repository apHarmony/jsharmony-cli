/*
Copyright 2023 apHarmony

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

var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var path = require('path');
var http = require('http');
var crypto = require('crypto');
var wclib = require('./lib/WebConnect.js');
var xlib = wclib.xlib;

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  if(!onSuccess) onSuccess = function(){};
  options = _.extend({
    notifyPort: (params.NOTIFY_PORT||''),
    paths: params.PATHS||[],
    exec: params.EXEC||[],
  }, options);
  if(!options.paths || !options.paths.length) options.paths = ['.'];

  for(var i=0;i<options.paths.length;i++){
    options.paths[i] = path.resolve(options.paths[i]);
    try{
      var pathStat = fs.lstatSync(options.paths[i]);
      if(pathStat.isDirectory()) options.paths[i] += (global._IS_WINDOWS ? '\\' : '/');
    }
    catch(ex){
      console.log('Error processing path "' + options.paths[i] + '": ' + ex.toString());
      return;
    }
  }

  var notifyOperations = [];
  var notifyServer = null;
  if(options.notifyPort){
    var notifyPort = parseInt(options.notifyPort);
    if(!notifyPort || (notifyPort.toString()!==options.notifyPort.toString())){ console.log('Invalid --notify-port parameter: '+options.notifyPort); return; }

    notifyServer = http.createServer(function(req, res){
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Change Listener');
    });
    notifyServer.on('upgrade', function(req, socket){
      var clientKey = req.headers['sec-websocket-key'];
      var clientHash = crypto.createHash('sha1').update(clientKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', 'binary').digest('base64');
      socket.write(([
        'HTTP/1.1 101 Web Socket Protocol Handshake',
        'Upgrade: WebSocket',
        'Connection: Upgrade',
        'Sec-WebSocket-Accept: '+clientHash,
        '',
        ''
      ]).join('\r\n'));
      var changeClientFunc = function(){
        var str = JSON.stringify('CHANGE');
        const strlen = Buffer.byteLength(str);
        const buffer = Buffer.alloc(2 + strlen);
        buffer.writeUInt8(0b10000001, 0);
        buffer.writeUInt8(strlen, 1);
        buffer.write(str, 2);
        socket.write(buffer);
      };
      notifyOperations.push(changeClientFunc);
      function removeSocket(){
        for(var i=0;i<notifyOperations.length;i++){
          if(notifyOperations[i]==changeClientFunc){
            notifyOperations.splice(i, 1);
            i--;
          }
        }
      }
      socket.on('error', function(){
        removeSocket();
      });
      socket.on('close', function(){
        removeSocket();
      });
    });
    notifyServer.listen(notifyPort, '127.0.0.1', function(){
      console.log('Notifier listenening on port '+notifyPort);
    });
  }

  console.log('\r\nWatching for changes on \n  '+options.paths.join('  \n')+'\n');

  var pendingNotification = false;
  _.each(options.paths, function(watchPath){
    fs.watch(watchPath, { recursive: true }, function(evt, fname){
      if(!fname){ return; }
      var fpath = path.join(watchPath,fname);
      var fstat = null;
      try{ fstat = fs.lstatSync(fpath); } catch(ex) { /* Do nothing */ }
      if(fstat && fstat.isFile()){
        if(!pendingNotification){
          console.log('>> Change @ '+(new Date().toString()));
          pendingNotification = true;
          setTimeout(function(){
            async.eachSeries(options.exec, function(execOperation, exec_cb){
              var execCmd = (execOperation.cmd || '').trim();
              var execFor = (execOperation.for || '');
              if(!execOperation.cmd) return exec_cb();
              if(execFor && !fname.match(new RegExp(execFor))) return exec_cb();

              var returned = false;
              xlib.spawn(execCmd,[],
                function(code){
                  if(!returned){
                    returned = true;
                    return exec_cb();
                  }
                },
                function(data){
                  console.log(data);
                },
                undefined,
                function(err){
                  console.log('Error running "'+execCmd+'": '+err.toString());
                  if(!returned){
                    returned = true;
                    return exec_cb();
                  }
                },
                { shell: true }
              );
            }, function(err){
              if(err) console.log(err);

              for(var i=0;i<notifyOperations.length;i++){
                try{
                  notifyOperations[i]();
                }
                catch(ex){
                  console.log(ex);
                }
              }
              pendingNotification = false;
            });
          }, 100);
        }
      }
    });
  });
};