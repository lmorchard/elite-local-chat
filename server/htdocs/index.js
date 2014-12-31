var socket = io('/chat');

// Listen for messages from the desktop app
window.addEventListener('message', function (ev) {
  var msg = JSON.parse(ev.data);
  switch (msg.op) {
    case 'updateMeta':
      socket.emit('updateMeta', {
        system: msg.system,
        name: msg.name
      });
      break;
  }
}, false);

// Watch for message submissions from the user
$('form').submit(function(){
  socket.emit('chat', $('#m').val());
  $('#m').val('');
  return false;
});

// Perform log scan on request from server.
socket.on('scanLogs', function (msg) {
  parent_postMessage({op: 'scanLogs'});
});

socket.on('notice', function (msg) {
  addMsg('notice', msg);
});

socket.on('chat', function (msg) {
  addMsg('chat',
    '<span class="name">' + msg.name + '</span> ' +
    '<span class="msg">' + msg.msg + '</span>');
});

function addMsg (cls, msg) {
  $('#messages').append($('<li class="' + cls + '">').html(msg));
  window.scrollTo(0, document.body.scrollHeight);
}

function parent_postMessage (msg) {
  parent.postMessage(JSON.stringify(msg), '*');
}
