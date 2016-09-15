//Acolyte^2 - Chatbot - Slack Only so far

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;
// The memory data store is a collection of useful functions we can include in our RtmClient
var MemoryDataStore = require('@slack/client').MemoryDataStore;
// useful string funtions
var S = require('string');
var fs = require("fs");

//commands from json - currently unused - commands are currently inline
var commands = require('./bin/config/commands.json');

//sets slack tokens (multiple team support)
var token1 = process.env.SLACK_API_TOKEN1 || '';
var token2 = process.env.SLACK_API_TOKEN2 || '';



//Client 1
var rtm1 = new RtmClient(token1,
  {
    //set loglevel
    logLevel: 'dev' /*'debug'*/,
    // Initialise a data store for our client, this will load additional helper functions for the storing and retrieval
    dataStore: new MemoryDataStore()
  });


//Global var
var DEV_SLACK_CHANNEL = 'G0UQBBM5Y';

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
  // this sends a message to the channel identified by id 'G0UQBBM5Y' ivie-tech
  rtm1.sendMessage('Hello Agents, I am here to help.', DEV_SLACK_CHANNEL, function messageSent() 
  {
    // optionally, you can supply a callback to execute once the message has been sent
  });
});




// Slack RTM Message monitor - when it see's a command it will run the action
rtm1.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) 
{
  var channel_sent_from;

  
  if (message.text === '!help')
    {
      channel_sent_from = message.channel;
      // this sends a message to the channel identified by id 'G0UQBBM5Y' ivie-tech
      rtm1.sendMessage('Currently No Commands Are Setup.', DEV_SLACK_CHANNEL, function messageSent() 
      {
      // optionally, you can supply a callback to execute once the message has been sent
      });
      
    }
  console.log('Message:', message);
});



//disabling conlose messages for now
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
