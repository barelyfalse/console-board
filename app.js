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

const encryptState = (plain) => {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(process.env.CRYPTO_KEY, salt, 100000, 256/8, 'sha256');
  var cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

  cipher.write(plain);
  cipher.end()

  const encrypted = cipher.read();
  
  return {
    salt: salt.toString('base64'),
    iv: iv.toString('base64'),
    encrypted: encrypted.toString('base64'),
    concatenned: Buffer.concat([salt, iv, encrypted]).toString('base64')
  }
}

const decryptState = (cyphState) => {
  encrypted = Buffer.from(cyphState, 'base64');
  const salt_len = iv_len = 16;
  
  const salt = encrypted.slice(0, salt_len);
  const iv = encrypted.slice(0+salt_len, salt_len+iv_len);
  const key = crypto.pbkdf2Sync(process.env.CRYPTO_KEY, salt, 100000, 256/8, 'sha256');
  
  decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  
  decipher.write(encrypted.slice(salt_len+iv_len));
  decipher.end();
  
  decrypted = decipher.read();
  return decrypted.toString()
}

const cleanCommand = (dirty) => {
  clean = dirty.match(/^(\/)(\w*)(\s*)([a-zA-Z\s\d]*)/)
  return {cmd: clean[2].toLowerCase(), params: clean[4]}
}

function matchCommand(cmds, cmd) {
  const a = cmds.find((c) => {
    return c.startsWith(cmd.toLowerCase())
  })
  if (a === undefined) {
    return 'no match'
  } else {
    return a
  }
}

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

/*
app.post("/api/command-channel", (req, res) => {
  data = req.body
  if (data.hasOwnProperty('cmd') && data.hasOwnProperty('uid') && data.hasOwnProperty('state')) {
    if (data.cmd.match(/^(\/[a-zA-Z])([\s\w])* /g)) {
      command = cleanCommand(data.cmd)
      command.params = command.params.trim()
      state = decryptState(data.state)

      switch (state) {
        case 'lobby':
          switch (matchCommand(['login', 'help'], command.cmd)) {
            case 'login':
              if (command.params.match(/^([a-z0-9áéíóúü\s\-_#!&$]{3,15})/gi)) {
                pusher.sendToUser(data.uid, "signin", { uname: command.params })
                pusher.sendToUser(data.uid, "recieve", {
                  state: encryptState('loggedMenu').concatenned,
                  lines: [
                    {carret: '', content: '\xa0', class: ''},
                    {carret: 'sys>\xa0', content: `BIENVENIDO!`, class: ''},
                    {carret: 'sys>\xa0', content: `Has accedido como: ${command.params}`, class: ''},
                    {carret: '', content: '\xa0', class: ''},
                  ],
                  opts: [
                    {cmd: 'b', name: 'Board'},
                    {cmd: 'q', name: 'Salir'},
                    {cmd: 'h', name: 'Ayuda'},
                    {cmd: 'i', name: 'Info'}
                  ],
                  foot: '/[CMD] para comandos, ej. > /h',
                  clean: false
                });
                res.status(200).end()
              } else {
                pusher.sendToUser(data.uid, "recieve", {
                  lines: [
                    {carret: '', content: '\xa0', class: ''},
                    {carret: 'sys>\xa0', content: 'Error: nombre de usuario inválido!', class: ''},
                    {carret: 'sys>\xa0', content: 'Accede con: /l [nombre_de_usuario]', class: ''},
                    {carret: 'sys>\xa0', content: ' - Debe contener entre 3 y 15 caractéres', class: ''},
                    {carret: 'sys>\xa0', content: ' - Además de carácteres alfanuméricos puede contener: - _ # ! & $', class: ''},
                  ]
                });
                res.status(200).end()
              }
              break;
            case 'help':
              pusher.sendToUser(data.uid, "recieve", {
                lines: [
                  {carret: 'sys>\xa0', content: 'Comandos disponibles:', class: ''},
                  {carret: '\xa0', content: `l - Login - Para iniciar sesión. (login)`, class: ''},
                  {carret: '\xa0', content: `${'\xa0'.repeat(12)}Sintáxis: /l [nombre_de_usuario]`, class: 'dim-text'},
                  {carret: '\xa0', content: `h - Ayuda - Imprime estas opciones. (help)`, class: ''},
                  {carret: '\xa0', content: `${'\xa0'.repeat(12)}Sintáxis: /h`, class: 'dim-text'},
                  {carret: '\xa0', content: '\xa0', class: ''},
                ]
              });
              break;
            default:
              pusher.sendToUser(data.uid, "recieve", {
                lines: [
                  {carret: 'sys>\xa0', content: 'Error: comando desconocido :(', class: 'dim-error'},
                ]
              });
              break;
          }
          break;
        case 'loggedMenu':
          switch (matchCommand(['board', 'quit', 'help', 'info'], command.cmd)) {
            case 'board':
              pusher.sendToUser(data.uid, "recieve", {
                lines: [
                  {carret: 'sys>\xa0', content: 'Cargar tablero.', class: ''},
                ]
              });
              break;
            case 'quit':
              pusher.sendToUser(data.uid, "logout", {})
              break;
            case 'help':
              pusher.sendToUser(data.uid, "recieve", {
                lines: [
                  {carret: 'sys>\xa0', content: 'Comandos disponibles:', class: ''},
                  {carret: '\xa0', content: `b - Board - Carga el tablero. (board)`, class: ''},
                  {carret: '\xa0', content: `${'\xa0'.repeat(12)}Sintáxis: /b`, class: 'dim-text'},
                  {carret: '\xa0', content: `q - Salir - Cierra sesión y elimina el perfil local. (quit)`, class: ''},
                  {carret: '\xa0', content: `${'\xa0'.repeat(12)}Sintáxis: /q`, class: 'dim-text'},
                  {carret: '\xa0', content: `h - Ayuda - Imprime estas opciones. (help)`, class: ''},
                  {carret: '\xa0', content: `${'\xa0'.repeat(12)}Sintáxis: /h`, class: 'dim-text'},
                  {carret: '\xa0', content: `i - Ayuda - Imprime valiosa información. (info)`, class: ''},
                  {carret: '\xa0', content: `${'\xa0'.repeat(12)}Sintáxis: /i`, class: 'dim-text'},
                  {carret: '\xa0', content: '\xa0', class: ''},
                ]
              });
              break;
            case 'info':
              pusher.sendToUser(data.uid, "recieve", {
                lines: [
                  {carret: 'sys>\xa0', content: `Has iniciado sesión como: ${data.uname}`, class: ''},
                  {carret: 'sys>\xa0', content: `Id: ${data.uid}`, class: ''},
                  {carret: 'sys>\xa0', content: `E-mail me: ${process.env.EMAIL_ADDRESS}`, class: ''},
                  {carret: '', content: '\xa0', class: ''},
                ]
              });
              break;
            default:
              pusher.sendToUser(data.uid, "recieve", {
                lines: [
                  {carret: 'sys>\xa0', content: 'Error: comando desconocido :(', class: 'dim-error'},
                ]
              });
              break;
          }
          break;
        case 'board':
          break;
        default:
          res.status(403).end('Bad state')
          break;
      }
      res.status(200).end();
    } else {
      res.status(403).end('Bad command');
    }
  }
})
*/

/*
app.post("/api/user-auth", (req, res) => {

  const socketId = req.body.socket_id
  const user = {
    id: uuid(),
  };
  const authResponse = pusher.authenticateUser(socketId, user);
  res.send(authResponse);
  //res.send(user)
});
*/

app.post('/api/client-auth', userAuth)

/*
app.post("/api/set-state-channel", (req, res) => {

  if (req.body && req.body.hasOwnProperty('uid')) {
    if (req.body && req.body.hasOwnProperty('state')) {
      state = decryptState(req.body.state)
      switch (state) {
        case 'lobby':
          pusher.sendToUser(req.body.uid, "recieve", {
            lines: [
              {carret: '', content: '\xa0', class: ''},
              {carret: 'sys>\xa0', content: 'Accede con un buen nombre de usuario!', class: ''},
            ],
            opts: [
              {cmd: 'l', name: 'Login'},
              {cmd: 'h', name: 'Ayuda'},
            ],
            foot: '\xa0/[CMD] para comandos, ej. > /h',
            clean: false
          });
          res.status(200).end();
          break;
        case 'loggedMenu':
          pusher.sendToUser(req.body.uid, "recieve", {
            lines: [
              {carret: '', content: '\xa0', class: ''},
              {carret: 'sys>\xa0', content: `BIENVENIDO!`, class: ''},
              {carret: 'sys>\xa0', content: `Has accedido como: ${req.body.uname}`, class: ''},
              {carret: '', content: '\xa0', class: ''},
            ],
            opts: [
              {cmd: 'b', name: 'Board'},
              {cmd: 'q', name: 'Salir'},
              {cmd: 'h', name: 'Ayuda'},
              {cmd: 'i', name: 'Info'}
            ],
            foot: '\xa0/[CMD] para comandos, ej. > /h',
            clean: false
          });
          res.status(200).end();
          break;
        case 'board':
          res.status(200).end();
          break;
        default:
          res.status(403).end('Bad state');
          break;
      }
    } else {
      pusher.sendToUser(req.body.uid, "recieve", { 
        state: encryptState('lobby').concatenned,
        lines: [
          {carret: '', content: '\xa0', class: ''},
          {carret: 'sys>\xa0', content: 'Accede con un buen nombre de usuario!', class: ''},
        ],
        opts: [
          {cmd: 'l', name: 'Login'},
          {cmd: 'h', name: 'Ayuda'},
        ],
        foot: '/[CMD] para comandos, ej. > /h',
        clean: false
      })
      res.status(200).json({keypro: 'valuepro'});
    }
  } else {
    res.status(403).end('Bad request ocurred');
  }
})
*/

app.listen(process.env.SERVER_PORT || 3000, () => {console.log('Listening on port ' + process.env.SERVER_PORT)})

module.exports = app