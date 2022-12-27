const crypto = require('../utils/cryptMethods');

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

function sendReponse(res, data) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.status(200).json(data).end()
}

module.exports = (req, res) => {
  data = req.body
  const cookies = req.cookies || {}
  console.log(cookies)
  console.log(data)
  if (cookies.hasOwnProperty('uid') && cookies.hasOwnProperty('sid') && cookies.hasOwnProperty('state')) {
    //TODO: valid uid?
    //valid state?
    let state = ''
    try {
      //decrpt state
      state = crypto.decryptState(cookies.state)
    } catch (error) {
      console.log(error)
      //send bad state error response
      sendReponse(res, {
        lines: [
          {carret: 'sys>\xa0', content: 'Bad state!'}
        ],
        foot: 'Intenta recargar la página',
      })
    }

    console.log(state)

    switch (state) {
      case 'lobby':
        if (!data.hasOwnProperty('cmd') && !cookies.hasOwnProperty('uname')) {
          sendReponse(res, { 
            lines: [
              {carret: '', content: '\xa0', class: ''},
              {carret: 'sys>\xa0', content: 'Accede con un buen nombre de usuario!', class: ''},
              {carret: '', content: '\xa0', class: ''},
            ],
            opts: [
              {cmd: 'l', name: 'Login'},
              {cmd: 'h', name: 'Ayuda'},
            ],
            foot: '/[CMD] para comandos, ej. > /h',
            clean: false
          })
        } else if (data.hasOwnProperty('cmd')) {
          if (!/^(\/\w+)(\s[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+)*/.test(data.cmd)) {
            //bad command
            sendReponse(res, {
              lines: [
                {carret: 'sys>\xa0', content: 'Error en el commando'}
              ]
            })
          } else {
            //good command
            command = cleanCommand(data.cmd)
            switch (matchCommand(['login', 'help'], command.cmd)) {
              case 'login':
                //verify username
                if (!/^([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.\-_!#$%&=])*/.test(command.params) && command.params.length > 3 && command.params.length < 16) {
                  sendReponse(res, {
                    lines: [
                      {carret: 'sys>\xa0', content: 'Nombre de usuario inválido!'}
                    ]
                  })
                }

                //prepare cookie
                res.cookie('uname', command.params, {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
                //prepare response
                //  change state
                res.cookie('state', crypto.encryptState('logged'), {sameSite: 'none', secure: true, maxAge: 9000000000, httpOnly: true })
                //  logged state lines
                sendReponse(res, {
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
                  clean: true
                })
                break;
              case 'help':
                sendReponse(res, {
                  lines: [
                    {carret: 'sys>\xa0', content: 'Accede con: /l [nombre_de_usuario]', class: ''},
                    {carret: 'sys>\xa0', content: ' - Debe contener entre 3 y 15 caractéres', class: ''},
                    {carret: 'sys>\xa0', content: ' - Además de carácteres alfanuméricos puede contener: .-_!#$%&=', class: ''},
                    {carret: '', content: '\xa0', class: ''},
                  ]
                })
                break;
              default:
                sendReponse(res, {
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
        if (!data.hasOwnProperty('cmd') && !cookies.hasOwnProperty('uname')) {
          sendReponse(res, {
            lines: [
              {carret: '', content: '\xa0', class: ''},
              {carret: 'sys>\xa0', content: `BIENVENIDO!`, class: ''},
              {carret: 'sys>\xa0', content: `Has accedido como: ${cookies.uname}`, class: ''},
              {carret: '', content: '\xa0', class: ''},
            ],
            opts: [
              {cmd: 'b', name: 'Board'},
              {cmd: 'q', name: 'Salir'},
              {cmd: 'h', name: 'Ayuda'},
              {cmd: 'i', name: 'Info'}
            ],
            foot: '/[CMD] para comandos, ej. > /h',
            clean: true
          })
        } else {
          command = cleanCommand(data.cmd)
          switch (matchCommand(['board', 'quit', 'help', 'info'], command.cmd)) {
            case 'quit':
              
              break;
          
            default:
              break;
          }
          break;
        }
        
      default:
        //send bad state error response
        break;
    }
  } else {
    //send error, bad credentials
  }

  /*
  if (data.hasOwnProperty('cmd') && data.hasOwnProperty('uid') && data.hasOwnProperty('state')) {
    if (data.cmd.match(/^(\/[a-zA-Z])([\s\w])* /g)) {

      command = cleanCommand(data.cmd)
      
      state = decryptState(data.state)

      switch (state) {
        case 'lobby':
          switch (matchCommand(['login', 'help'], command.cmd)) {
            case 'login':
              
              break;
            case 'help':
              
              break;
            default:
              sendReponse(res, {
                lines: [
                  {carret: 'sys>\xa0', content: 'Error: comando desconocido :(', class: 'dim-error'},
                ]
              })
              break;
          }
          break;
        case 'loggedMenu':
          switch (matchCommand(['board', 'quit', 'help', 'info'], command.cmd)) {
            case 'board':
              
              break;
            case 'quit':
              
              break;
            case 'help':
              
              break;
            case 'info':
              
              break;
            default:
              
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
  } else {
    if (data.hasOwnProperty('uid') && !data.hasOwnProperty('state')) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
      res.status(200).json({ 
        state: crypto.encryptState('lobby').concatenned,
        lines: [
          {carret: '', content: '\xa0', class: ''},
          {carret: 'sys>\xa0', content: 'Accede con un buen nombre de usuario!', class: ''},
          {carret: '', content: '\xa0', class: ''},
        ],
        opts: [
          {cmd: 'l', name: 'Login'},
          {cmd: 'h', name: 'Ayuda'},
        ],
        foot: '/[CMD] para comandos, ej. > /h',
        clean: false
      })
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
      res.status(200).json({
        lines: [
          {carret: 'sys>\xa0', content: `Bad endpoint!`, class: ''},
          {carret: '', content: '\xa0', class: ''},
        ],
        opts: [],
        foot: '\xa0Error',
      });
    }
  }
  */
}