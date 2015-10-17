// Bug fixes for current versions. 

//
// This server will start a bash shell and expose it
// over socket.io to a browser. See ./term.html for the
// client side.
//
// You should probably:
//
//   npm install socket.io
//   curl -O https://github.com/LearnBoost/Socket.IO/raw/master/socket.io.min.js
//
// To get socket.io in the node_modules directory and
// the socket.io.min.js file needed for the client.
//
// To start the server:
//
//   node server.js
//
// And then load up your term!
//
//   open http://`hostname`:8080/term.html
//
// You can even share the url with a friend on your
// local network. Be sure they're a friend though :-)
//

var http  = require('http'),
    url   = require('url'),
    path  = require('path'),
    fs    = require('fs'),
    io    = require('socket.io'),
    sys   = require('sys'),
    util  = require('util'),
    spawn = require('child_process').spawn;

server = http.createServer(function(request, response){
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    fs.exists(filename, function(exists) {
      if (!exists) {
        response.writeHead(404, {'Content-Type':'text/plain'});
        response.end("Can''t find it...");
      }
      fs.readFile(filename, 'binary',function(err, file){
        if (err) {
          response.writeHead(500, {'Content-Type':'text/plain'});
          response.end(err + "\n");
          return;
        }
        response.writeHead(200);
        response.write(file, 'binary');
        response.end();

      });
    });
  }
);
var server_port = process.env.OPENSHIFT_NODEJS_PORT || 3000
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1'
server.listen(server_port);

var listener = io.listen(server);

listener.on('connection', function(client){
  var sh = spawn('bash');

  client.on('message', function(data){
    sh.stdin.write(data+"\n");
    client.send(new Buffer("> "+data.toString()));
  });

  sh.stdout.on('data', function(data) {
    
    client.send(data.toString());
  });

  sh.stderr.on('data', function(data) {
    client.send(data.toString());
  });

  sh.on('exit', function (code) {
    client.send('** Shell exited: '+code+' **');
  });
});