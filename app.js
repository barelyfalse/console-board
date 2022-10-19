require('dotenv').config()
const Pusher = require("pusher");
const express = require('express')
var app = express()

const {
  PUSHER_APP_ID: pusherAppId,
  PUSHER_KEY: pusherKey,
  PUSHER_SECRET: pusherSecret,
  PUSHER_CLUSTER: pusherCluster,
} = process.env;

const pusher = new Pusher({
  appId: pusherAppId,
  key: pusherKey,
  secret: pusherSecret,
  cluster: pusherCluster,
  useTLS: true
});

app.use(express.static(__dirname+'/public'))
app.use(express.json())

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

app.post('/api/event-channel', (req, res) => {
  data = req.body
  pusher.trigger('chnnl', 'event', data, () => {
    res.status(200).end('sent event successfully');
  });
})

app.listen(process.env.SERVER_PORT || 3000, () => {console.log('Listening on port ' + process.env.SERVER_PORT)})