const crypto = require('../utils/cryptMethods');
const { initializeApp } = require('firebase/app')
const { getFirestore, collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp } = require('firebase/firestore')

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

const cleanCommand = (dirty) => {
  clean = dirty.match(/^(\/)(\w*)(\s*)([a-zA-Z\s\d]*)/)
  return {cmd: clean[2].toLowerCase(), params: clean[4].trim()}
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

module.exports = (req, res) => {
  data = req.body
  const cookies = req.cookies || {}
  //console.log(cookies)
  //console.log(data)

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');

  const sendReponse = (data) => {
    res.status(200).json(data).end()
  }

  const loadLobby = () => {
    sendReponse({ 
      lines: [
        {carret: '', content: '\xa0', class: ''},
        {carret: 'sys>\xa0', content: 'Accede con un buen nombre de usuario!', class: ''},
        {carret: '', content: '\xa0', class: ''},
      ],
      opts: [
        {cmd: 'l', name: 'Login'},
        {cmd: 'h', name: 'Ayuda'},
      ],
      foot: '\xa0/[CMD] para comandos, ej. > /h',
      clear: false
    })
  }

  const lobbyHelp = () => {
    sendReponse({
      lines: [
        {carret: 'sys>\xa0', content: 'Accede con: /l [nombre_de_usuario]', class: ''},
        {carret: 'sys>\xa0', content: ' - Debe contener entre 3 y 15 caractéres', class: ''},
        {carret: 'sys>\xa0', content: ' - Además de carácteres alfanuméricos puede contener: .-_!#$%&=', class: ''},
        {carret: '', content: '\xa0', class: ''},
      ]
    })
  }

  const loadLogged = (uname) => {
    sendReponse({
      lines: [
        {carret: '', content: '\xa0', class: ''},
        {carret: 'sys>\xa0', content: `BIENVENIDO!`, class: ''},
        {carret: 'sys>\xa0', content: `Has accedido como: ${uname}`, class: ''},
        {carret: 'sys>\xa0', content: `Esta consola utiliza cookies para mejorar su experiencia.`, class: 'dim-text'},
        {carret: 'sys>\xa0', content:'Al continuar navegando, acepta el uso de cookies.', class: 'dim-text'},
        {carret: '', content: '\xa0', class: ''},
      ],
      opts: [
        {cmd: 'b', name: 'Board'},
        {cmd: 'q', name: 'Salir'},
        {cmd: 'h', name: 'Ayuda'},
        {cmd: 'i', name: 'Info'}
      ],
      clear: true
    })
  }

  const loadBoard = () => {
    const msgCol = collection(db, 'messages')
    const a = query(msgCol, orderBy('timestamp'), limit(50))
    getDocs(a).then((response) => {
      const msgList = response.docs.map(doc => doc.data());
      let msgLines = []
      let lastUid = ''
      let lastDate = ''
      msgList.forEach(msg => {
        const msgts = msg.timestamp.toDate()
        const msgdate = `${msgts.getDate().toString().padStart(2, "0")}/${(msgts.getMonth() + 1).toString().padStart(2, "0")}/${msgts.getFullYear().toString().slice(-2)}`
        const msgtime = `${msgts.getHours().toString().padStart(2, "0")}:${msgts.getMinutes().toString().padStart(2, "0")}`
        if (msgdate !== lastDate) {
          msgLines.push({carret: '', content: msgdate, class: 'dim-text'})
          lastDate = msgdate
        }
        if (msg.uid !== lastUid) {
          msgLines.push({carret: '', content: msg.uname, class: 'dim-blue'})
          lastUid = msg.uid
        }
        msgLines.push({carret: `${msgtime} >\xa0`, content: msg.msg, class: ''})
      })
      sendReponse({
        clear: true,
        lines: msgLines,
        opts: [
          {cmd: 'h', name: 'Ayuda'},
          {cmd: 'm', name: 'Regresar'},
          {cmd: 'r', name: 'Recargar'},
        ],
        foot: '\xa0/[CMD] para comandos, ej. > /h',
        clear: true
      })
    }).catch((err) => {
      console.log(err)
      sendReponse({
        lines: [
          {carret: 'sys>\xa0', content: 'Error: Error loading messages! :('},
        ]
      })
    })
  }

  const loggedHelp = () => {
    sendReponse({
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
    })
  }

  const loggedInfo = () => {
    sendReponse({
      lines: [
        {carret: 'sys>\xa0', content: 'Board version: 0.5a', class:''},
        {carret: 'sys>\xa0', content: 'Project: https://github.com/barelyfalse/console-board', class:''},
        {carret: 'sys>\xa0', content: `Email me: ${process.env.EMAIL_ADDRESS}`, class:''},
        {carret: '\xa0', content: '\xa0', class: ''},
      ]
    })
  }

  const loggedQuit = () => {
    sendReponse({
      clear: true,
      lines: [
        {carret: 'sys>\xa0', content: 'Eliminando perfil...', class: ''},
        {carret: 'sys>\xa0', content: 'Perfil eliminado!', class: ''},
      ],
      opts: [],
      foot: '\xa0/[CMD] para comandos, ej. > /h',
      clear: false,
      reload: true,
    })
  }
  
  if (cookies.hasOwnProperty('uid') && cookies.hasOwnProperty('sid') && cookies.hasOwnProperty('state')) {
    //TODO: valid uid?
    let state = ''
    try {
      state = crypto.decryptState(cookies.state)
    } catch (error) {
      console.log(error)
      sendReponse({
        lines: [
          {carret: 'sys>\xa0', content: 'Bad state!'}
        ],
        foot: '\xa0Intenta recargar la página',
      })
    }

    //console.log(state)

    switch (state) {
      case 'lobby':
        if (!data.hasOwnProperty('cmd') && !cookies.hasOwnProperty('uname')) {
          loadLobby()
        } else if (data.hasOwnProperty('cmd')) {
          if (!/^(\/\w+)(\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+)*/.test(data.cmd)) {
            sendReponse({
              lines: [
                {carret: 'sys>\xa0', content: 'Error en el commando'}
              ]
            })
          } else {
            const command = cleanCommand(data.cmd)
            console.log(command)
            switch (matchCommand(['login', 'help'], command.cmd)) {
              case 'login':
                //verify username
                if (!/^([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.\-_!#$%&=])*/.test(command.params) || command.params.length < 3 || command.params.length > 16) {
                  sendReponse({
                    lines: [
                      {carret: 'sys>\xa0', content: 'Nombre de usuario inválido!'}
                    ]
                  })
                } else {
                  //prepare cookie
                  res.cookie('uname', command.params, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
                  //prepare response
                  //  change state
                  res.cookie('state', crypto.encryptState('logged').concatenned, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
                  //  logged state lines
                  loadLogged(command.params)
                }
                break;
              case 'help':
                lobbyHelp()
                break;
              default:
                sendReponse({
                  lines: [
                    {carret: 'sys>\xa0', content: 'Error: El comando no existe! :('},
                  ]
                })
                break;
            }
          }
        }
        break;
      case 'logged':
        if (!data.hasOwnProperty('cmd') && cookies.hasOwnProperty('uname')) {
          loadLogged(cookies.uname)
        } else {
          const command = cleanCommand(data.cmd)
          switch (matchCommand(['board', 'quit', 'help', 'info'], command.cmd)) {
            case 'board':
              res.cookie('state', crypto.encryptState('board').concatenned, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
              loadBoard()
              break;
            case 'quit':
              res.clearCookie('uname')
              res.cookie('state', crypto.encryptState('lobby').concatenned, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
              loggedQuit()
              break;
            case 'help':
              loggedHelp()
              break;
            case 'info':
              loggedInfo()
              break;
            default:
              sendReponse({
                lines: [
                  {carret: 'sys>\xa0', content: 'Error: El comando no existe! :('},
                ]
              })
              break;
          }
          break;
        }
      case 'board':
        if (!data.hasOwnProperty('cmd') && cookies.hasOwnProperty('uname')) {
          loadBoard()
        } else if (data.hasOwnProperty('cmd')) {
          command = cleanCommand(data.cmd)
          switch (matchCommand(['help', 'menu', 'reload'], command.cmd)) {
            case 'help':
              sendReponse({
                lines: [
                  {carret: 'sys>\xa0', content: 'Coming soon!', class: ''},
                ]
              })
              break;
            case 'info':
              sendReponse({
                lines: [
                  {carret: 'sys>\xa0', content: 'Coming soon!', class: ''},
                ]
              })
              break;
            case 'menu':
              res.cookie('state', crypto.encryptState('logged').concatenned, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
              loadLogged(cookies.uname)
              break;
            case 'reload':
              loadBoard()
              break;
            default:
              sendReponse({
                lines: [
                  {carret: 'sys>\xa0', content: 'Error: El comando no existe! :('},
                ]
              })
              break;
          }
          break;
        }
        break;
      default:
        sendReponse({
          lines: [
            {carret: 'sys>\xa0', content: 'Error: Bad state! :('},
          ]
        })
        break;
    }
  } else {
    //send error, bad credentials
    //TODO: Error response
    sendReponse({
      lines: [
        {carret: 'sys>\xa0', content: 'Error: Bad credentials! :('},
      ]
    })
  }
}