/*
Copyright 2022 apHarmony

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
var path = require('path');
var fs = require('fs');
var jshcli_Shared = require('./lib/cli.shared.js');
var async = require('async');

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  params = _.extend({
    DOMAIN: 'localhost',
  }, params);
  if(!onSuccess) onSuccess = function(){};

  var keyPath = path.join(process.cwd(), 'localhost-key.pem');
  var certPath = path.join(process.cwd(), 'localhost-cert.pem');

  var certData = null;

  async.waterfall([

    function(cb){
      fs.exists(keyPath, function(exists){
        if(exists){ console.log('ERROR - Key already exists: "'+keyPath+'"'); return; }
        return cb();
      });
    },
    
    function(cb){
      fs.exists(certPath, function(exists){
        if(exists){ console.log('ERROR - Cert already exists: "'+certPath+'"'); return; }
        return cb();
      });
    },

    function(cb){
      certData = jshcli_Shared.generateSelfSignedCert(3650, params.DOMAIN);
      return cb();
    },

    function(cb){
      console.log('Writing key to "'+keyPath+'"');
      fs.writeFile(keyPath, certData.key, 'utf8', function(err){
        if(err) return cb(err);
        return cb();
      });
    },

    function(cb){
      console.log('Writing cert to "'+certPath+'"');
      fs.writeFile(certPath, certData.cert, 'utf8', function(err){
        if(err) return cb(err);
        return cb();
      });
    },
  ], function(err){
    if(err) console.log(err);
    return onSuccess();
  });
};