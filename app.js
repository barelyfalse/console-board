require('dotenv').config()
const Pusher = require("pusher");
const express = require('express')
const favicon = require('serve-favicon')
var app = express()

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: '9f0b98fbf42211664194',
  secret: process.env.PUSHER_SECRET,
  cluster: 'us2',
  useTLS: true
});

app.use(express.static(__dirname+'/public'))
app.use(favicon(__dirname + '/public/img/favicon.ico'))
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