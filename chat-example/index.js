var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

http.listen( port, function () {
    console.log('listening on port', port);
});

app.use(express.static(__dirname + '/public'));

var users = [];
var colored_users = [];
var user_num;
var user_name;
var messages = [];
var msg_limit = 200;

//generate user name
function genName() {
    user_num = users.length;
    user_name = "Lonely Soul " + user_num;
    while (users.indexOf(user_name) != -1) {
        user_num++;
        user_name = "Lonely Soul " + user_num;
    }
}

// listen to 'chat' messages
io.on('connection', function(socket){
    //set user
    socket.on('setuser', function (name) {
        let index = users.indexOf(name);
        if (index === -1) {
            user_name = name;
        } else {
            genName();
        }
        socket.emit('setuser', user_name);
        io.send("\<" + user_name + " connected\>");
    });

    //set users list
    socket.on('setuserlist', function () {
        socket.emit('setuserlist', colored_users);
    });

    //set chat history
    socket.on('chathistory', function () {
        socket.emit('chathistory', messages);
    });

    //update users list
    socket.on('updateusers', function (username) {
        users.push(username.user);
        let colored_name = "\<span style=\"color: " + username.color + "\"\> " + username.user + " \<\/span\>";
        colored_users.push(colored_name);
        io.emit('setuserlist', colored_users);
    });

    //add user
    socket.on('adduser', function(name) {
        let colored_name;
        users.push(name.name);
        colored_name = "\<span style=\"color: " + name.color + "\"\> " + user_name + " \<\/span\>";
        colored_users.push(colored_name);
        io.emit('adduser', colored_name);
    });

    //remove user
    socket.on('disconnect', function() {
        //restart lists
        users = [];
        colored_users = [];
        io.emit('getuser');
        io.send("\<A user disconnected\>");
    });

    //send message
    socket.on('chat', function(msg){
        //add to chat history
        messages.push(msg);
        if (messages.length > msg_limit) {
            messages.shift();
        }
	    socket.broadcast.emit('chat', msg);
    });

    //update user name
    socket.on('namechange', function(name){
        let index = users.indexOf(name);
        if (index === -1) {
            socket.emit('setuser', name);
            //restart lists
            users = [];
            colored_users = [];
            io.emit('getuser');
            socket.send("\<Nickname changed\>");
        } else {
            socket.send("\<Nickname taken. Please try another.\>");
        }
    });

    //update user name color
    socket.on('colorchange', function(){
        //restart lists
        users = [];
        colored_users = [];
        io.emit('getuser');
        socket.send("\<Name color changed\>");
    });

});
