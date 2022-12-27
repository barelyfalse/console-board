const input = document.getElementById('input');
const lines = document.getElementById('lines');
const linesContainer = document.getElementById('lines-container');
const optsEl = document.getElementById('opts');
const footEl = document.getElementById('foot');
let profile = {}
let options = []
let loginState = false;
let logged = false;
let loadI = 0;
let loading = false;
let onBoard = false;
const loadChars = ['/', '-', '\\', '|']

//Pusher.logToConsole = true;

var pusher = new Pusher('9f0b98fbf42211664194', { 
  cluster: 'us2',
  userAuthentication: { endpoint: "/api/user-auth" }
});

var channel = pusher.subscribe('chnnl');

function addLine(carret, content, style = '') {
  let ln = document.createElement('div')
  ln.className = 'line ' + style
  let car = document.createElement('div')
  car.className = 'line-carret'
  car.innerText = carret
  let cont = document.createElement('div')
  cont.className = 'line-cont'
  cont.innerText = content
  ln.appendChild(car)
  ln.appendChild(cont)
  lines.appendChild(ln)
  settleLines()
}

pusher.bind('recieve', function (data) {
  if (data.hasOwnProperty('state')) {
    profile.state = data.state
    localStorage.setItem('profile', JSON.stringify(profile));
  }

  if (data.hasOwnProperty('clean') && data.clean) {
    cleanLines()
  }

  if (data.hasOwnProperty('foot')) {
    setFoot(data.foot)
  }

  if (data.hasOwnProperty('opts')) {
    setOptions(data.opts)
  }

  if (data.hasOwnProperty('lines')) {
    data.lines.forEach((msg) => {
      addLine(msg.carret, msg.content, msg.class)
    })
  }
  setLoading(false);
  setMainCarret('\xa0\xa0\xa0>')
  input.focus()
})

pusher.bind('pusher:signin_success', function(data) {
  if(JSON.parse(data.user_data).id !== null) {
    profile = JSON.parse(localStorage.getItem('profile')) || {}
    profile.uid = JSON.parse(data.user_data).id
    addSysLine('Conectado al servicio de persistencia.')
    addSysLine('id: ' + profile.uid, true)
    fetch("api/set-state-channel", {
      method: "POST",
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify(profile)
    }).then(res => {
      res.json().then((json) => console.log(json))
      if(res.status !== 200) {
        addSysLine('Ocurrió un error :c')
      }
    });
    
  } else {
    addSysLine('Conexión al servicio de persistencia sin éxito! :c')
  }
})


pusher.bind('signin', function(data) {
  profile.uname = data.uname
  localStorage.setItem('profile', JSON.stringify(profile));
})

pusher.bind('logout', function() {
  localStorage.removeItem('profile')
  window.location.reload()
})

function pushData(data) {
  setLoading(true)
  fetch("api/event-channel", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(data)
  }).then(res => {
    if(res.status !== 200) {
      addSysLine('Ocurrió un error :c')
    }
  });
}

function pushCommand(data) {
  setLoading(true)
  fetch("api/command-channel", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(data)
  }).then(res => {
    setLoading(false)
    if(res.status !== 200) {
      addSysLine('Ocurrió un error :c')
    } else {
      res.json().then(data => {
        if (data.hasOwnProperty('state')) {
          profile.state = data.state
          localStorage.setItem('profile', JSON.stringify(profile));
        }
      
        if (data.hasOwnProperty('clean') && data.clean) {
          cleanLines()
        }
      
        if (data.hasOwnProperty('foot')) {
          setFoot(data.foot)
        }
      
        if (data.hasOwnProperty('opts')) {
          setOptions(data.opts)
        }
      
        if (data.hasOwnProperty('lines')) {
          data.lines.forEach((msg) => {
            addLine(msg.carret, msg.content, msg.class)
          })
        }
        setLoading(false);
        setMainCarret('\xa0\xa0\xa0>')
        input.focus()
      })
    }
  });
}

function addSysLine(msg, dim = false) {
  addLine('sys>\xa0', msg, dim?'dim-text':'')
}

function addLocalLine(msg) {
  addLine('\xa0\xa0\xa0>\xa0', msg)
}

function setMainCarret(carret) {
  document.getElementById('input-carret').innerText = `${carret}\xa0`
}

function setOptions(opts) {
  options = opts || []
  let optText = '\xa0'
  opts.forEach((opt, i)=>{
    optText += `${(i == 0?'':'\xa0\xa0')}<span class="opt-letter">${opt.cmd.toUpperCase()}</span>:${opt.name}`
  })
  optsEl.innerHTML = optText
}

function setFoot(ftext) {
  footEl.innerText = ftext
}

function inputToCommands(input) {

}

input.addEventListener('keypress', (e) => {
  const keyPressed = e.key
  
  if (keyPressed === 'Enter') {
    e.preventDefault()
    if (e.target.value.match(/^(\/[a-zA-Z])([\s\w])*/g)) {
      switch (e.target.value[1].toLowerCase()) {
        case 's':
          for (let i = 0; i < 10; i++) {
            addLocalLine('hi')
          }
          break;
        default:
          addLocalLine(e.target.value)
          pushCommand({cmd: e.target.value})
          break;
      }
      
    } else if(e.target.value !== '') {
      addLocalLine(e.target.value)
    } else {
      addLine('','\xa0')
    }
    
    e.target.value = ''
    e.target.style.height = '1rem';
  }
  /*
  if (keyPressed === 'Enter') {
    e.preventDefault();
    if (e.target.value[0] == '/' && e.target.value.length == 2) {
      switch (e.target.value[1].toLowerCase()) {
        case 'c':
          clearLines()
          break;
        case 's':
          for (let i = 0; i < 10; i++) {
            addLocalLine('hi')
          }
          break;
        case 'q':
          if(logged) {
            clearLines()
            localStorage.removeItem('profile')
            addSysLine('Deleting profile')
            addSysLine('Loggin off')
            addLine('', '\xa0')
            onBoard = false
            logged = false
            entryState()
          }
          break;
        case 'b':
          if(logged)
            setBoard()
          break;
        case 'i':
          addSysLine('Información valiosísima!')
          break;
        default:
          addSysLine('Unknown command!')
          break;
      }
      
    } else if(loginState) {
      logIn()
    } else if(logged && onBoard && e.target.value !== '') {
      pushData({cmd: 'msg', msg: e.target.value, uProf: profile})
    } else if(e.target.value !== '') {
      addLocalLine(e.target.value)
    } else {
      addLine('','\xa0')
    }
    e.target.value = ''
    e.target.style.height = '1rem';
  }
  */
})

input.addEventListener('input', (e) => {
  e.target.style.height = '1rem';
  e.target.style.height = ((e.target.scrollHeight) / 16) + 'rem';
  if(!loading && !loginState){
    if(e.target.value[0] == '/') {
      setMainCarret('opt>')
    } else {
      setMainCarret('\xa0\xa0\xa0>')
    }
  }
})

function settleLines() {
  setTimeout(() => {
    linesContainer.scrollTop = linesContainer.scrollHeight;
  }, 200)
}

function cleanLines() {
  var child = lines.lastElementChild; 
  while (child) {
    lines.removeChild(child);
      child = lines.lastElementChild;
  }
}

function setLoading(ldng) {
  if(ldng) {
    loading = true
    input.disabled = true
    rec = setTimeout(() => {
      setMainCarret(`\xa0${loadChars[loadI%loadChars.length]}\xa0✕`)
      loadI++
      setLoading(true)
    }, 200)
  } else {
    if(loading) {
      loading = false
      loadI = 0
      input.disabled = false
      clearTimeout(rec)
    }
  }
}

function authorize() {
  //pusher.signin()
  setLoading(true)
  fetch("api/client-auth", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}
  }).then(res => {
    setLoading(false)
    setMainCarret('\xa0\xa0\xa0>\xa0')
    if (res.status != 200) {
      addSysLine('Ocurrió un error al autenticar el cliente! :(')
    } else {
      addSysLine('Cliente autenticado!')
      res.json().then(json => {
        if (json.hasOwnProperty('uid')) {
          addSysLine(`uid: ${json.uid}`, true)
          addLine('\xa0', '')
        }
      })
      pushCommand()
    }
  });
  input.focus()
}

authorize()