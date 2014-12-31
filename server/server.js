var express = require('express');
var app = express();
var http = require('http').Server(app);
var _ = require('lodash');
var PubSub = require('pubsub-js');
var winston = require('winston');

var PORT = 31173;

winston.loggers.add('main', {
  console: { level: 'silly', colorize: 'true', label: 'main' }
});

var logger = winston.loggers.get('main');

var io = require('socket.io')(http);
var ioChat = io.of('/chat');

app.use(express.static('htdocs'));

app.get('/spy', function (req, res) {
  res.set('Content-Type', 'text/plain');
  res.status(200).send([
    JSON.stringify(ioChat.adapter.rooms, null, ' '),
    JSON.stringify(_.map(ioChat.sockets, function (socket) {
      return [socket.id, socket.meta];
    }), null, ' ')
  ].join("\n"));
});

http.listen(PORT, function(){
  console.log('listening on *:' + PORT);
});

ioChat.on('connection', function (socket) {

  var id = socket.id;
  socket.meta = { name: null, system: null };

  logger.info('Socket ' + id + ' connected');

  socket.on('disconnect', function(){
    logger.info('Socket ' + id + ' disconnected');
  });

  socket.on('updateMeta', function (msg) {
    if (socket.meta.system !== msg.system) {
      socket.leave(socket.meta.system);
    }
    socket.meta.name = msg.name;
    socket.meta.system = msg.system;
    socket.join(socket.meta.system);
    socket.emit('notice', socket.meta.name + ' entered system ' + socket.meta.system);
  });

  socket.on('chat', function(msg){
    if (!socket.meta.system || !socket.meta.name) { return; }
    ioChat.to(socket.meta.system).emit('chat', {
      name: socket.meta.name,
      msg: msg
    });
  });

  socket.emit('scanLogs');

});
