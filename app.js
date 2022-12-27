require('dotenv').config()
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp } = require('firebase/firestore')
const express = require('express')
const cookieParser = require('cookie-parser')
const favicon = require('serve-favicon')
const uuid = require('uuid').v4
const crypto = require('crypto');

const commandChannel = require('./api/command-channel');
const userAuth = require('./api/client-auth');

var app = express()

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

app.use(express.static(__dirname+'/public'))
app.use(favicon(__dirname + '/public/img/favicon.ico'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html')
})

/*
app.post('/api/event-channel', (req, res) => {
  data = req.body
  console.log(data)
  if(data.cmd !== undefined) {
    if(data.cmd == 'load') {
      const msgCol = collection(db, 'messages')
      const a = query(msgCol, orderBy('timestamp'), limit(50))
      getDocs(a).then((response) => {
        const msgList = response.docs.map(doc => doc.data());
        let msgLines = []
        let lastUname = ''
        let lastDay = ''
        msgList.map(msg => {
          const date = new Date(msg.timestamp.seconds)
          //console.log(date.getDate() + ' ' + date.getUTCDate())
          msgLines.push({carret: '>\xa0', content: msg.msg})
        })
        pusher.sendToUser(data.uid, 'load-board', msgLines, () => {
          res.status(200).end('Board loaded successfully')
        })
        
      }).catch((err) => {
        console.log(err)
        res.status(403).end('An error ocurred');
      })
    } else if(data.cmd == 'msg') {
      const msgCol = collection(db, 'messages')
      addDoc(msgCol, {
        msg: data.msg,
        timestamp: serverTimestamp(),
        uname: data.uProf.uname
      }).then((docRef => {
        res.status(200).end('Message send successfully')
        pusher.trigger('chnnl', 'recieve-line', [{carret: '>\xa0', content: data.msg}])
      })).catch((err) => {
        console.log(err)
        res.status(403).end('An error ocurred')
      })
    } else {
      res.status(403).end('Bad command ocurred');
    }
  } else {
    res.status(403).end('Bad command ocurred');
  }
  
})
*/

app.post("/api/command-channel", commandChannel)

app.post('/api/client-auth', userAuth)

app.listen(process.env.SERVER_PORT || 3000, () => {console.log('Listening on port ' + process.env.SERVER_PORT)})

module.exports = app