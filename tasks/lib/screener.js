'use strict';

var fs          = require('fs');
var path        = require('path');
var phantomjs   = require('phantomjs');
var phantomPath = phantomjs.path;

var deleteFolderRecursive = function(path) {
    var files = [];
    if( fs.existsSync(path) ) {
        files = fs.readdirSync(path);
        files.forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

var Screener = function (grunt, files, options, callback) {
  this.callback = callback;
  this.diffCount = 0;
  this.grunt = grunt;
  this.files = files;
  this.options = options;
  this.pictures = this.makePicPaths();
  this.screenNames = [];
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
      pictures.push(baseUrl + '#' + file + '#' + width);
    }, this);
  }, this);

  return pictures;
};

Screener.prototype.takeScreenShots = function() {
  this.grunt.log.subhead( 'PHOTOBOX STARTED PHOTO SESSION.' );

  this.pictures.forEach(function(picture, index) {
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
      var split = picture.split('#');
      this.screenNames.push( split[1].replace( /\//g, '-').replace(/\./g, '-') + '-' + split[2] + '.png' );
      this.pictureCount += 1;
      if (this.pictureCount === this.pictures.length) {
        this.handleImages(err, result, code);
      }
    }.bind( this ) );

  }, this);
}

Screener.prototype.handleImages = function(err, result, code) {
  // if screens have been previously taken
  if ( fs.existsSync(this.options.indexPath + 'img/screens') ) {
    this.screenNames.forEach(function(screenName) {
      var latestScreen = this.grunt.file.read(this.options.indexPath + 'img/tmp/' + screenName);
      // do comparison here
      var previousScreen = this.grunt.file.read(this.options.indexPath + 'img/screens/' + screenName);
      this.grunt.file.write(this.options.indexPath + 'img/screens/' + screenName, latestScreen);
    }, this);
  }
  // if screens have not been previously taken
  else {
    this.screenNames.forEach(function(screenName) {
      var latestScreen = this.grunt.file.read(this.options.indexPath + 'img/tmp/' + screenName);
      this.grunt.file.write(this.options.indexPath + 'img/screens/' + screenName, latestScreen);
    }, this);
  }
  // delete img directory if it already exists
  deleteFolderRecursive(this.options.indexPath + 'img/tmp');
}

// expose the Screener object
module.exports = Screener;