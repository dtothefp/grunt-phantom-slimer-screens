var system        = require ( 'system' );
var webpage       = require( 'webpage' );
var fs            = require('fs');
var page          = webpage.create();
var combinedUrl   = system.args[ 1 ];
var split         = combinedUrl.split( '#' );
var baseUrl       = split[ 0 ];
var filePath      = split[ 1 ];
var width         = +split[ 2 ];
var indexPath     = system.args[ 2 ];
// if ( filePath.match(/index\.html/) ) {
//   filePath = filePath.replace(/index\.html/, '');
// }
var url = baseUrl + filePath;

page.onError = function ( msg ) {
  system.stderr.writeLine( 'ERROR:' + msg );
};

page.onConsoleMessage = function( msg, lineNum, sourceId ) {
  system.stderr.writeLine( 'CONSOLE: ' + msg, lineNum, sourceId );
};

page.viewportSize = {
  height : 1000,
  width  : width
};

page.open( url, function( status ) {
  window.setTimeout( function() {
    var height = page.evaluate( function() {
       return Math.max(
        document.body.scrollHeight, document.documentElement.scrollHeight,
        document.body.offsetHeight, document.documentElement.offsetHeight,
        document.body.clientHeight, document.documentElement.clientHeight
    );
    } );

    page.clipRect = {
      top    : 0,
      left   : 0,
      height : height,
      width  : width
    };

    // indexPath specified in Gruntfile or default options, path to where screenshots are stored
    var imgPath = indexPath +
                    'img/tmp/' +
                    filePath.replace( /\//g, '-').replace(/\./g, '-') +
                    '-' + width +
                    '.png';
    page.render( imgPath, {format: 'png', quality: '100'} );

    system.stdout.writeLine( 'Rendered: ' + filePath.replace( /\//g, '-').replace(/\./g, '-') );

    phantom.exit();
  }, 1000 );
} );