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

var wclib = require('./lib/WebConnect.js');
var xlib = wclib.xlib;
var _ = require('lodash');

exports = module.exports = {};

exports.Run = function(params, options, onSuccess){
  params = _.extend({
    NO_SYMBOLS: false,
    LENGTH: 60,
  }, params);
  if(!onSuccess) onSuccess = function(){};

  var saltLength = parseInt(params.LENGTH);
  if(saltLength != params.LENGTH.toString()){
    console.log('Invalid salt length: '+params.LENGTH);
    process.exit(1);
  }

  console.log(xlib.getSalt(saltLength, { noSymbols: params.NO_SYMBOLS }));
  return onSuccess();
};