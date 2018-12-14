$( document ).ready(function() {
  /* global io */
  let socket = io();

  socket.on('user', function(data) {
    $('#num-users').text(data.currentUsers+' users online');
    let message = data.name;
    if (data.connected) {
      message += ' has joined the chat.';
    } else {
      message += ' has left the chat.';
    }
    $('#messages').append($('<li>').html(`<b>${message}</b>`))
  });
});