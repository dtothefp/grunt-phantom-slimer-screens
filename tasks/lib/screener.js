'use strict';

var fs          = require('fs');
var path        = require('path');
var phantomjs   = require('phantomjs');
var phantomPath = phantomjs.path;

var Screener = function (grunt, files, options, callback) {
  this.callback = callback;
  this.diffCount = 0;
  this.grunt = grunt;
  this.files = files;
  this.options = options;
  this.pictures = this.makePicPaths();
  this.pictureCount = 0;
};

// Make all paths for screenshots, concated with baseUrl and screenSizes, index.html removed 
Screener.prototype.makePicPaths = function() {
  var pictures = [];
  var baseUrl = this.options.baseUrl;
  if (baseUrl[baseUrl.length - 1] !== '/') {
    baseUrl = baseUrl + '/';
  }

  this.files.forEach(function(file) {
    if ( file.match(/index\.html/) ) {
      file = file.replace(/index\.html/, '');
    }
    if (file[0] === '/') {
      file = file.substring(1, file.length);
    } 
    this.options.screenSizes.forEach(function(width) {
      pictures.push(baseUrl + file + '#' + width);
    }, this);
  }, this);

  return pictures;
};

Screener.prototype.takeScreenShots = function() {
  this.grunt.log.subhead( 'PHOTOBOX STARTED PHOTO SESSION.' );

  this.pictures.forEach(function(picture) {
    this.grunt.log.writeln( 'started photo session for ' + picture );

    var args = [
      path.resolve( __dirname, 'phantomScript.js' ),
      picture,
      this.options.indexPath
    ];

    var opts = {};

    if ( this.grunt.option( 'verbose' ) ) {
      opts = {
        stdio: 'inherit'
      };
    }

    this.grunt.log.verbose.writeln( 'Command: phantomjs ' + args.join( ' ' ) + '\n' );

    this.grunt.util.spawn( {
      cmd  : phantomPath,
      args : args,
      opts : opts
    }, function( err, result, code ) {
      console.log("error", err);
      console.log("result", result);
      console.log("code", code);
    }.bind( this ) );

  }, this);
}

// expose the Screener object
module.exports = Screener;