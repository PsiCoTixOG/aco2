//Acolyte^2 - Chatbot - Slack Only so far


//----------NODE MODULES---------------------------------//

//Slack Real-Time Messaging 
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;


//Web-API
var IncomingWebhooks = require('@slack/client').IncomingWebhook;
// Anyone who has access to this url will be able to post your
// slack org without authentication. So don't save this value in version control
var url = process.env.SLACK_WEBHOOK_URL;


// The memory data store is a collection of useful functions we can include in our RtmClient
var MemoryDataStore = require('@slack/client').MemoryDataStore;

// useful string funtions
var S = require('string');
var fs = require('fs');

//-------------------------------------------------------//

//Configuration settings\files - not fully implemented - 
var config = require('./bin/config/config.json');

//commands from json - currently unused - commands are currently inline
var help = require('./bin/commands.json');
var checkpoint = require('./bin/acocp.js');

//sets slack tokens (multiple team support - pending)
var token1 = process.env.SLACK_API_TOKEN1 || '';
var token2 = process.env.SLACK_API_TOKEN2 || '';

//Other system vars
var debugchan = process.env.SLACK_DEBUG1 || '';

//Client 1
var rtm1 = new RtmClient(token1,
  {
    //set loglevel
    logLevel: 'debug' /*'debug'*/,
    // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval
    dataStore1: new MemoryDataStore()
  });


//Global var
//IVIE Dev Channel 
var DEV_SLACK_CHANNEL = 'G2HAS3H6U';
//CodeCollective Dev Channel - Bot isn't connected to this yet
var DEV_SLACK_CHANNEL2 = 'G0UQBBM5Y';


rtm1.start();

//confirm start
rtm1.on(RTM_CLIENT_EVENTS.AUTHENTICATED, function (rtmStartData) 
{
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});

//proof she's alive: make her talk
// Function Notes: you need to wait for the client to fully connect before you can send messages
rtm1.on(RTM_CLIENT_EVENTS.RTM_CONNECTION_OPENED, function () 
{
  // this sends a message to the channel identified by id 'G2HAS3H6U' ivie-dev
  rtm1.sendMessage('Hello Agents, I am here to help.', debugchan, function messageSent() 
  {
    // optionally, you can supply a callback to execute once the message has been sent
  });
});




// Slack RTM Message monitor - when it see's a command it will run the action
rtm1.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) 
{
  var checkpoint_response;
  var parsedmessage = S(message.text);
  var iscommand = parsedmessage.startsWith("!");
  
  if (iscommand === true)
  {
    var msgcommand = parsedmessage.splitLeft(" ");
    //msgcommand[0] = !command 
    //msgcommand[1+] = command options
    
    //commands are currently inline. Plan is to point them to commands.json
    
    //help command
    
    //Testing command
    if (msgcommand[0] === '!ping') 
    {
      rtm1.sendMessage('pong!', message.channel, function messageSent() {});
    }
    
    if (msgcommand[0] === '!help')
    {
      // this sends a message to the channel identified by id 'G2HAS3H6U' ivie-dev
      rtm1.sendMessage('Type !help <command> to see more. (just kidding, this does nothing yet)', message.channel, function messageSent() {});
    }
    
    
    //checkpoint - NOT IMPLEMENTED
    if (msgcommand[0] === '!cp')
      {
        //CP FUNCTION GOES HERE
        checkpoint_response = checkpoint(message);
        //var user = MemoryDataStore.getUserById(message.user);
        //CP message sent to requested channel
        rtm1.sendMessage(checkpoint_response, message.channel, function messageSent()
        {
        // optionally, you can supply a callback to execute once the message has been sent
        });
    }
  }
  
//    console.log('Message:', message);
});



//disabling console messages for now
/*
rtm.on(RTM_EVENTS.REACTION_ADDED, function handleRtmReactionAdded(reaction) {
  console.log('Reaction added:', reaction);
});

rtm.on(RTM_EVENTS.REACTION_REMOVED, function handleRtmReactionRemoved(reaction) {
  console.log('Reaction removed:', reaction);
});
*/

//
//PsiCoTix - Left the chat server in as a 'local test' of the chat bot and as an admin interface
//also cuz .. like website what???  this shits all new

//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var wsmessages = [];
var sockets = [];

io.on('connection', function (socket) {
    wsmessages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        wsmessages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
