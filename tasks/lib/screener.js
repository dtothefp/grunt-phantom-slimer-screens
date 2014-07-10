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
  this.pictureCount = 0;
};

Screener.prototype.makePicPaths = function() {
  var pictures = [];
  var baseUrl = this.options.baseUrl;

  this.files.forEach(function(file) {
    this.options.screenSizes.forEach(function(width) {
      if ( file.match(/index\.html/) ) {
        file = file.replace(/index\.html/, '');
      }
      pictures.push(baseUrl + file + '#' + width);
    }, this);
  }, this);

  return pictures;
};


Screener.prototype.showFiles = function() {
  return this.files;
};

module.exports = Screener;