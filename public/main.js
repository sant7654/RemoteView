$(function() {
  // Initialize variables
  var username;
  var socket = io('');

  sessionStorage.setItem('IMEINumber',window.location.href.slice(window.location.href.indexOf('?') + 1));

  var uri = window.location.toString();
	if (uri.indexOf("?") > 0) { //To remove the query string from the URL..
	    var clean_uri = uri.substring(0, uri.indexOf("?"));
	    window.history.replaceState({}, document.title, clean_uri);
	}
  username = sessionStorage.getItem('IMEINumber');
  socket.emit('add user', username + '|$'); //To call the add user while page load itself 

  $('#imeinumber').text('IMEINumber: '+username);

  //To check the user already using ir not..
  socket.on('onlineNumbers', (data) => {
    console.log(data);
    if(data.user_count >= 1)
    {  
      if(confirm('Someone already using this, do you want to disconnect him'))
      {
        socket.emit('removeUsername',data.username);
      }
      else
      {
        alert('busy');
      }
      return;
    }
  });

    //While adding the user if the sender is not registered with then have to throw error..
    socket.on('senderNotRegisterd', (data) => {
      alert('The sender is not registered..')
      $('#con_discon_txt').text('User disconnected');
      $("#imgtrack").attr('src', 'img/Tablet.png');
    });

    //Get response from mobile while emiting the add message if no user registered this will display..
    socket.on('reconnectuser', (data) => {
      alert('The sender is not registered..')
      $('#con_discon_txt').text('Connect');
      $("#imgtrack").attr('src', 'img/Tablet.png');
    });

  //Get response from API while adding user while no registration from mobile
  socket.on('connectuser', (data) => {
    $('#con_discon_txt').text('User disconnected');
    alert('Unable to connect the user: '+ data.username)
  });

  //Get response from API while removing user while no registration from mobile
  socket.on('disconnectuser', (data) => {
    $('#con_discon_txt').text('User disconnected');
    alert('Unable to disconnect the user: '+ data.username)
  });

  //Get the response for the removed user while user_removed calling..
  socket.on('removedResponseSuccess', (data) => {
    socket.emit('add user', username + '|$');
  });

  //TO prevent double user login ..
  socket.on('removedUserSuccess', (data) => {
    //alert('user removed successfully'+data.username);
    socket.close();
    window.location.replace('https://optimise-uatcloud.marstongroup.co.uk/UAT/TestOW/AccessDenied.html');
  });

  //TO send message while sender disconnected..
  socket.on('removedUserSuccess', (data) => {
    //alert('user removed successfully'+data.username);
    socket.close();
    window.location.replace('https://optimise-uatcloud.marstongroup.co.uk/UAT/TestOW/AccessDenied.html');
  });

   //To redirect after removed the user successfully..
   socket.on('senderDisconnected', (data) => {
    alert('The sender has been went to offline');
  });

  // Log a message
    const log = (message, options) => {
    var $el = $('<li>').addClass('log').text(message);
  }

  // To append the data into image tag..
  const addChatMessage = (data, options) => {
      $('#imgtrack').attr("src","data:image/jpg;base64," + data.message);
  }

  //TO prevent double user login ..
  socket.on('redirect', (data) => {
	  alert(data.message);
  });
  // Socket events

  // After the add user server emits 'login', log the login message
  socket.on('login', (data) => {
    //Get response from API while adding user while no registration from mobile
	  console.log('user added'+data);
    connected = true;
    socket.emit('connectOrDisconnectUser', 'connectuser', username);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    console.log(data);
    $('#con_discon_txt').text('Disconnect');
    addChatMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(data.username + ' left');
    removeChatTyping(data);
  });


  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    if (username) {
      log('you have been reconnected');
    }
  });

  socket.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });

});

//last change - socket.connect()