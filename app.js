require('dotenv').config()
const express = require('express')
var app = express()

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

app.use(express.static(__dirname+'/public'))

app.listen(process.env.SERVER_PORT)
console.log("Listening on port " + process.env.SERVER_PORT)