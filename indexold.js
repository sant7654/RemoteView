  // Setup basic express server
  var express = require('express');
  var app = express();
  var path = require('path');
  var server = require('http').createServer(app);
  var io = require('socket.io')(server);
  var MonGoClient = require('mongodb').MongoClient;
  var MongoDbUrl  = "mongodb://localhost:27017/"; 
  var port = process.env.PORT || 5000;

  var connect =  MonGoClient.connect(MongoDbUrl,{ useNewUrlParser: true });
  var dbname  = 'RemoteView';
  var collection_name = 'users';
  server.listen(port, () => {
    console.log('Server listening at port %d', port);
  });

  // Routing
  app.use(express.static(path.join(__dirname, 'public')));

  // Chatroom
  var numUsers = 0;

  io.on('connection', (socket) => {
    console.log('This socket is now connected to the Sails server...');
    var addedUser = false;
    
    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data, username) => {
      console.log(username);
      var mobile_team = username+ '|#';
      var web_team    = username+ '|$';
      connect.then(db =>{
        db.db(dbname).collection(collection_name).findOne({'original_name':mobile_team}, (err,res) => { //Creating databse
          if(err) console.log(err);
          if(res != null){
              io.sockets.in(web_team).emit('new message', { //Emit the message to display for specfic user..
                username: socket.username,
                message: data
              });
        }
        else{
          io.to(mobile_team).emit('wakeup', { //Emit the message to display for specfic user..
            data : 'reconnectuser'
          });
          io.to(web_team).emit('reconnectuser', { //Emit the message to display for specfic user..
            data : 'reconnectuser'
          });
        }
        });
      });
    });
    
    
    socket.on('getOnlineNumbers', (username) => //To get all online numbers deatils
    {
      connect.then(db =>{
        db.db(dbname).collection(collection_name).find({"original_name":username}).count((err, result) =>{ //Creating collections
          console.log('getonlienumbers called by' + username);
          socket.emit('onlineNumbers',{
            data : Object.keys(socket.adapter.rooms),
            user_count : result,
            username : username
          });
      });
      });
    });
    
    socket.on('add user', (username) =>{ // when the client emits 'add user', this listens and executes
    console.log('add user called');
    var count_Added = 0;
    var count_Added_Mob = 0;
    connect.then(db =>{
      console.log("DB created.");

        db.db(dbname).createCollection(collection_name, (err,res) => { //Creating databse
          if(err) console.log(err);
          console.log('collection created');
        });
        var temp_name = username.slice(0, -2);
        var last_String = username.slice(-2);
        db.db(dbname).collection(collection_name).find({"original_name":username}).count((err, result) => //Creating collections
        {
          if(err) console.log(err);
          count_Added = result;
          console.log('from one' + count_Added); //Check user added in db
          if(count_Added < 1) //Allow user to add in db if less than two user joined
          {
            db.db(dbname).collection(collection_name).find({"original_name":temp_name+'|#'}).count((err, result_mob) => //Creating collections
            { //To check the mobile user added in socket or not..
                count_Added_Mob = result_mob;
                if(count_Added_Mob == 1 || last_String == '|#')
                {
                  var ins_Obj = {name : temp_name, original_name : username};
                  connect.then(db =>{
                    db.db(dbname).collection(collection_name).insertOne(ins_Obj, (err, res)=>{
                      if(err) console.log(err);
                      console.log('User added successfully');
                  });
                  if (addedUser) return;

                  socket.username = username; //we store the username in the socket session for this client
                  ++numUsers;
                  addedUser = true;
                  //if(username.slice(-2) == '|#')
                  //{
                      socket.join(username, function () { //Join the specific user to the group ..
                        console.log(Object.keys(socket.adapter.rooms));
                      });
                // }
                  socket.emit('login', {
                    numUsers: numUsers //To display number of users
                  });
                });
              }
              else
              {
                socket.emit('senderNotRegisterd', {
                  data: username //To display number of users
                });
              }
            });
          }
          else
          { //If already joined have to redirect failed message..
            console.log('user already joined: '+ username);
            socket.emit('onlineNumbers',{
              data : Object.keys(socket.adapter.rooms),
              user_count : 3,
              username : username
            });
            /*socket.emit('redirect', {
              message : 'failed to add the user' //To display number of users
            });*/
          }
        });
      });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
      connect.then(db =>{
        if (addedUser) {
          --numUsers;
          console.log('user disconnected');

          db.db(dbname).collection(collection_name).findOne({"original_name":socket.username}, (err,res) => { //Creating databse
            if(err) console.log(err);
            if(res !=null)
            {
              db.db(dbname).collection(collection_name).deleteOne({'_id' : res._id}, (err, rest) => {
                if(err) console.log(err);
                console.log('user deleted the object id is: ' +res._id);
              });
              if(socket.username.slice(-2) == '|#')
              {
                io.to(socket.username.slice(0, -2)+'|$').emit('senderDisconnected',{
                  username : socket.username
                });
              }
            }
            else
            {
              console.log('delete id is null, first function');
              if(socket.username.slice(-2) == '|#')
              {
                io.to(socket.username.slice(0, -2)+'|$').emit('senderDisconnected',{
                  username : socket.username
                });
              }
            }
          });
          
          socket.leave(socket.username);
          console.log(socket.username);
          // echo globally that this client has left
          socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
          });
        }
    });
    });

    socket.on('removeUsername', (username) => //To delete the name from database while user clickes confirm to remove
    {
      connect.then(db =>{
        db.db(dbname).collection(collection_name).findOne({'original_name':username}, (err,res) => { //Creating databse
          if(err) console.log(err);
          if(res != null)
          {
            db.db(dbname).collection(collection_name).deleteOne({'_id' : res._id}, (err, rest) => {
              if(err) console.log(err);
              console.log('user deleted the object id is: ' +res._id);
              console.log(username);
              io.to(username).emit('removedUserSuccess', { //Emit the message to display for specfic user..
                username: username
              });
              socket.emit('removedResponseSuccess',{
                username : username
              });
          });
        }
        else
        {
          console.log('delete id is null, second function');
        }
        });
      });
    });

    socket.on('connectOrDisconnectUser', (methodtocall,username) => //To call this while clicking the Connect or disconnect button..
    {
      var mobile_team = username+ '|#';
      var web_team    = username+ '|$';
      connect.then(db =>{
        
        db.db(dbname).collection(collection_name).findOne({'original_name':mobile_team}, (err,res) => { //Creating databse
          if(err) console.log(err);
          if(res != null){
            console.log('Mobile user to emit: '+ mobile_team);
              io.to(mobile_team).emit('wakeup', { //Emit the message to display for specfic user..
                data : methodtocall
              });
        }
        else{
          console.log('Web user to emit: '+ web_team);
          io.to(web_team).emit(methodtocall, { //Emit the message to display for specfic user..
            username : web_team
          });
        }
        });

      });
    });
  });