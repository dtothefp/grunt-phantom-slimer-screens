'use strict';

var fs          = require('fs');
var path        = require('path');
var phantomjs   = require('phantomjs');
var phantomPath = phantomjs.path;

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
      if (this.pictureCount === this.pictures.length) {
        console.log("handle images");
        this.handleImages(err, result, code);
      }
    }.bind( this ) );

  }, this);
};

Screener.prototype.handleImages = function(err, result, code) {
  // if screens have been previously taken
  if ( fs.existsSync(this.options.indexPath + 'img/screens') ) {
    this.pictures.forEach(function(picture) {
      var pictureName = picture.name + '.png';
      // do comparison with resemble JS here
      var latestScreen = this.grunt.file.read(this.options.indexPath + 'img/tmp/' + pictureName);
      var previousScreen = this.grunt.file.read(this.options.indexPath + 'img/screens/' + pictureName);
      this.grunt.file.write(this.options.indexPath + 'img/screens/' + pictureName, latestScreen);
      var latestScreen = fs.createReadStream(this.options.indexPath + 'img/tmp/' + pictureName);

    }, this);
  }
  // if screens have not been previously taken
  else {
    // create screens directory
    fs.mkdirSync(this.options.indexPath + 'img/screens');

    // copy immediately from tmp to screens directory as these are the first shots taken for otherst to be diffed against
    this.pictures.forEach(function(picture) {
      var pictureName = picture.name + '.png';
      
      //var latestScreen = this.grunt.file.read(this.options.indexPath + 'img/tmp/' + pictureName);
      //this.grunt.file.write(this.options.indexPath + 'img/screens/' + pictureName, latestScreen);

      fs.readFile(this.options.indexPath + 'img/tmp/' + pictureName, function(err, original_data){
          //TODO: handle errors
          var base64Image = original_data.toString('base64');
          var decodedImage = new Buffer(base64Image, 'base64');
          console.log(this.options.indexPath + 'img/screens/' + pictureName);
          fs.writeFile(this.options.indexPath + 'img/screens/' + pictureName, decodedImage, function(err) {
            console.log("write file", err);
          });
      }.bind(this));

    }, this);
  }

  // delete img directory if it already exists
  deleteFolderRecursive(this.options.indexPath + 'img/tmp');
};

// expose the Screener object
module.exports = Screener;