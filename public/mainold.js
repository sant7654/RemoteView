$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $messages = $('.messages'); // Messages area
  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var socket = io('http://192.168.130.106:5000/');
  var con_discon_text = "";
  var myobject = ['mobileTeam','webTeam','test','864004034052271','358205084326142'];
  //alert(window.location.href.slice(window.location.href.indexOf('?') + 1));
  sessionStorage.setItem('IMEINumber',window.location.href.slice(window.location.href.indexOf('?') + 1));
  //alert(sessionStorage.getItem('IMEINumber'));
  //$.session.set('IMEINumber',window.location.href.slice(window.location.href.indexOf('?') + 1))
  $('#con_discon_txt').text('Connect');
  var uri = window.location.toString();
	if (uri.indexOf("?") > 0) {
	    var clean_uri = uri.substring(0, uri.indexOf("?"));
	    window.history.replaceState({}, document.title, clean_uri);
	}

  //Hide the side panel div..
  $('.nav_menu_icon').on('click', function() {
    $('.sidebar').animate({width: 'toggle'}, 235);
  });

  socket.emit('getOnlineNumbers',''); //get the online officers list..

  /* 
  username = sessionStorage.getItem('IMEINumber');
  socket.emit('add user', username + '|$'); //To call the add user while page load itself 
*/


  //get all online officers details and append the datas based on that..
  socket.on('onlineNumbers', (data) => {
    console.log(data);
    if(data.user_count >= 1)
    {  
      if(confirm('Someone already using this, do you want to disconnect him'))
      {
        //alert(data.username);
        socket.emit('removeUsername',data.username);
      }
      else
      {
        alert('busy');
      }
      return;
    }
    myobject.forEach(element => {
      var status = 0;
      data.data.forEach(item =>{
          if(element == item)
          {
            status = 1;
            return;
          }
      });
      if(status == 1)
      {
        $("#officerlist").append($("<li class = 'numberlist' value = "+element+">").html("<div class='items'>"+element+"</div><div class='active_int'><i class='fa fa-circle active' aria-hidden='true'></i></div>"));
      }
      else
      {
        $("#officerlist").append($("<li class = 'numberlist' value = "+element+">").html("<div class='items'>"+element+"</div><div class='active_int'><i class='fa fa-circle' aria-hidden='true'></i></div>"));
      }
    });
   // console.log(data);  
   $('.numberlist').click(function(){
    $('.numberlist').css('font-weight','normal');
    $('.numberlist').removeClass('active');
    $(this).css('font-weight','bold');
    $(this).addClass('active');
    //alert($(this).attr("value"));
    socket.disconnect(true); //to disconnect the previous click user..
    socket.connect(); // establish the new connection..
    $("#imgtrack").attr('src', 'img/Tablet.png');
    username = $(this).attr("value");
    $('#con_discon_txt').text('Please Wait');
    socket.emit('add user', username + '|$');
  });
  });

  //Connect/Disconnect button click..
  $('#con_discon_btn').click(()=>{
     con_discon_text = $('#con_discon_txt').text();
     $('#con_discon_txt').text('Please Wait');
     if(username == undefined)
     {
       alert('Please select atleast one user to connect');
       $('#con_discon_txt').text('Connect');
       return;
     }
     if(con_discon_text == 'Connect'){
      $('#con_discon_txt').text('Disconnect');
      socket.emit('connectOrDisconnectUser', 'connectuser', username);
     }
     else if(con_discon_text == 'Disconnect'){
      $('#con_discon_txt').text('Connect');
      $("#imgtrack").attr('src', 'img/Tablet.png');
      socket.emit('connectOrDisconnectUser', 'disconnectuser', username);
     }
     else if(con_discon_text == 'User disconnected'){
      alert('Please refersh the page and try again');
      $('#con_discon_txt').text('User disconnected');
     }
     else{
      alert('Please wait the process to complete');
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
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);
      $('#imgtrack').attr("src","data:image/jpg;base64," + data.message);
    //addMessageElement($messageDiv, options); 
  }

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    //$messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    /*for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }*/
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  //TO prevent double user login ..
  socket.on('redirect', (data) => {
	  alert(data.message);
  });
  // Socket events

  // After the add user server emits 'login', log the login message
  socket.on('login', (data) => {
    $('#con_discon_txt').text('Connect');
	  console.log('user added'+data);
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
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