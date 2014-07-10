/*
 * grunt-phantom-slimer-screens
 * 
 *
 * Copyright (c) 2014 
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path');
var Screener = require( path.resolve(__dirname, 'lib/screener.js') );

module.exports = function (grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('phantom_slimer_screens', 'screenshot engine for phantomjs and slimerjs', function () {
    var done = this.async();
    var srcFiles = [];

    this.files.forEach(function(file) {
      srcFiles.push(file.src[0]);
    });

    var screener = new Screener(grunt, srcFiles, this.options(), done);

    console.log(screener.makePicPaths());
  });

};
