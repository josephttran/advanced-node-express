$( document ).ready(function() {
  /* global io */
  var socket = io();

  socket.on('user count', function(data) {
    console.log(data);
  });
});