var app = require('express')();
var http = require('http').Server(app);
var PubSub = require('pubsub-js');
var winston = require('winston');

var PORT = 31173;

winston.loggers.add('main', {
  console: { level: 'silly', colorize: 'true', label: 'main' }
});

var logger = winston.loggers.get('main');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});

var io = require('socket.io')(http);

var ioChat = io.of('/chat');
ioChat.on('connection', function (socket) {

  var id = socket.id;
  var currName, currSystem;

  logger.info('Socket ' + id + ' connected');

  socket.on('disconnect', function(){
    logger.info('Socket ' + id + ' disconnected');
  });

  socket.on('updateSystem', function (msg) {
    logger.info('Socket ' + id + ' updated system ' + msg);
    if (currSystem == msg) { return; }
    socket.leave(currSystem);
    currSystem = msg;
    socket.join(currSystem);
    socket.emit('notice', 'Changed system to ' + msg);
  });

  socket.on('updateName', function (msg) {
    logger.info('Socket ' + id + ' updated name ' + msg);
    if (currName == msg) { return; }
    currName = msg;
    socket.emit('notice', 'Changed name to ' + msg);
  });

  socket.on('chat', function(msg){
    if (!currSystem || !currName) { return; }
    ioChat.to(currSystem).emit('chat', {
      name: currName,
      msg: msg
    });
  });

});
