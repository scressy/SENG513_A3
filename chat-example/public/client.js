// shorthand for $(document).ready(...)
$(function() {
    var name = document.getElementById('user');
    var name_color = "#12130F";
    var message;
    var empty_msg_case;
    var timestamp;
    var time_string;

    //socket
    var socket = io();


    $('form').submit(function(){
        message = $('#m').val().toString();
        //Check if message is just white space
        empty_msg_case = message.replace(/[" " \t]/g,"");
        if (message.length > 0) {

            if (message.startsWith("\\nickcolor")) {
                let colors = message.slice(11);
                colors = colors.trim();
                if (colors.length === 6) {
                    name_color =  "#" + colors;
                    document.cookie = "color=" + name_color;
                    socket.emit('colorchange');
                } else {
                    let msg = "\<Incorrect color format. Please use RRGGBB format with no hashtag\>";
                    $('#messages').append($('<li class="svmsg">').text(msg));
                }

            }
            else if (message.startsWith("\\nick")) {
                //change name
                let nickname = message.slice(6);
                socket.emit('namechange', nickname);
            }
            else {
                //Normal message
                let colored_name = "\<span style=\"color: " + name_color + "\"\> " + name.innerHTML + " \<\/span\>";
                timestamp = new Date();
                time_string = "[" + timestamp.getHours() + ":" + timestamp.getMinutes() + ":" + timestamp.getSeconds() + "] ";
                socket.emit('chat', time_string + colored_name + ": " + message);
            }
        }
        $('#m').val('');
	    return false;
    });

    //server message
    socket.on('message', function(msg){
        $('#messages').append($('<li class="svmsg">').text(msg));
    });


    //send message
    socket.on('chat', function(msg){
	    $('#messages').append($('<li>').html(msg));
    });

    //on connect
    socket.on('connect', function(){
        let username = "Lonely Soul 0";
        //fill chat history and online users
        socket.emit('setuserlist');
        socket.emit('chathistory');

        //check for cookie
        if (document.cookie.length > 0) {
            username = document.cookie.replace(/(?:(?:^|.*;\s*)name\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            name_color = document.cookie.replace(/(?:(?:^|.*;\s*)color\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        }
        //set and add user
        socket.emit('setuser', username);
        socket.emit('adduser', {color:name_color, name:name.innerHTML});
    });

    //add user
    socket.on('adduser', function(username){
        $('#users').append($('<li>').html(username));
    });

    //set user
    socket.on('setuser', function(username){
        name.innerHTML = username;
        //if first login, set cookie
        if (document.cookie.length === 0) {
            document.cookie = "name=" + username;
            document.cookie = "color=" + name_color;
        } else {
            //if name was changed
            let cookie_name = document.cookie.replace(/(?:(?:^|.*;\s*)name\s*\=\s*([^;]*).*$)|^.*$/, "$1");
            if (username !== cookie_name) {
                document.cookie = "name=" + username;
            }
        }
    });

    //send username to server
    socket.on('getuser', function(){
        let username = name.innerHTML;
        socket.emit('updateusers', {user: username, color: name_color});
    });

    //populate list of online users
    socket.on('setuserlist', function(users){
        $('#users').html("");
        let i = 0;
        for (i = 0; i < users.length; i++){
            $('#users').append($('<li>').html(users[i]));
        }
    });

    //populate chat history
    socket.on('chathistory', function(msgs){
        let i = 0;
        for (i = 0; i < msgs.length; i++){
            $('#messages').append($('<li>').html(msgs[i]));
        }
    });

});

