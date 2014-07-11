'use strict';

var http        = require('http');
var fs          = require('fs');
var fsRecur     = require('node-fs');
var path        = require('path');
var phantomjs   = require('phantomjs');
var phantomPath = phantomjs.path;
var resemblejs  = require('resemblejs');
var HTTP        = require('q-io/http');
var Q           = require('q');
var gm          = require('gm');

// used because fs.rmdirSync will not remove non-empty directories 
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
  this.previousScreens = this.previousScreensGenerated();
};

Screener.prototype.previousScreensGenerated = function() {
  //TODO: Handle scenarios for removed directories by user
  if ( !fs.existsSync(this.options.indexPath) ) {
    fsRecur.mkdirSync(this.options.indexPath + 'img/screens', '0777', true);
    return false;
  } 
  else if ( !fs.existsSync(this.options.indexPath + 'img') ) {
    fsRecur.mkdirSync(this.options.indexPath + 'img/screens', '0777', true);
    return false;
  }
  else if (!fs.existsSync(this.options.indexPath + 'img/screens')) {
    fs.mkdirSync(this.options.indexPath + 'img/screens');
    return false;
  }
  else {
    return true;
  }
  console.log("screens dir exists", fs.existsSync(this.options.indexPath + 'img/screens'));
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
      var pictureDetails = {};
      pictureDetails.name = (file + width).replace(/_/g, "-").replace(/\.html/, '-').replace( /\//g, '-').replace(/\./g, '-');
      pictureDetails.path = baseUrl + '#' + file + '#' + width;

      pictures.push(pictureDetails);
    }, this);
  }, this);


  return pictures;
};

Screener.prototype.takeScreenShots = function() {
  this.grunt.log.subhead( 'PHOTOBOX STARTED PHOTO SESSION.' );

  this.pictures.forEach(function(picture, index) {
    this.grunt.log.writeln( 'started photo session for ' + picture.name );

    var args = [
      path.resolve( __dirname, 'phantomScript.js' ),
      picture.path,
      picture.name,
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
      this.pictureCount += 1;
      this.handleImages(err, result, code, picture);
    }.bind(this) );

  }, this);
};

Screener.prototype.readWriteDecodeImg = function (readFrom, writeTo) {
  fs.readFile(readFrom, function(err, original_data){
      //TODO: handle errors
      var base64Image = original_data.toString('base64');
      var decodedImage = new Buffer(base64Image, 'base64');
      fs.writeFile(writeTo, decodedImage, function(err) {
        if(!err) {
          if(this.previousScreens) {
            console.log('Overwriting previous screen: ' + writeTo + ' with: ' + readFrom );
          } else {
            console.log('First screens created: ' + writeTo);
          }
          if (this.pictureCount === this.pictures.length) {
            //TODO: sometimes delete temp is firing twice
            //console.log("delete temp");
            //deleteFolderRecursive(this.options.indexPath + 'img/tmp');
          }
        }
        else {
          console.log("write file error", err);
        }
      }.bind(this));
  }.bind(this));
};

Screener.prototype.handleImages = function(err, result, code, picture) {
  var pictureName = picture.name + '.png';
  var tempPath = this.options.indexPath + 'img/tmp/' + pictureName;
  var screensPath = this.options.indexPath + 'img/screens/' + pictureName;

  // if screens have been previously taken check if they are equal -- don't write from tmp to screens, if not equal -- write form tmp to screens 
  if (this.previousScreens) {

    gm.compare(
      tempPath, 
      screensPath, 
      function (err, isEqual, equality, raw) {
        //console.log('Previous Screen: ' + tempPath + ' and Latest Screen: ' + screensPath);
        if(err) {
          console.log(err);
          //console.log('Previous Screen: ' + tempPath + ' and Latest Screen: ' + screensPath + 'could not be compared');
        } 
        // Images are equal, do nothing so they are not diffed on GitHub
        else if (isEqual) {
          console.log('Previous screen: ' + screensPath + ' is unchanged from current screen: ' + screensPath );
          if (this.pictureCount === this.pictures.length) {
            //TODO: sometimes delete temp is firing twice
            //console.log("delete temp");
            //deleteFolderRecursive(this.options.indexPath + 'img/tmp');
          }
        } 
        else {
          //TODO: Fix double logic here, try to find a way to read files with node and compare with gm or resemblejs
          this.readWriteDecodeImg(tempPath, screensPath);
        }
    }.bind(this));
  }
  // if screens have not previously been taken write them immediately from tmp to screens
  else {
    this.readWriteDecodeImg(tempPath, screensPath);
  }
};

// expose the Screener object
module.exports = Screener;