const inputEl = document.getElementById('input');
const linesWrappEl = document.getElementById('lines-wrapper');
const linesContEl = document.getElementById('lines-container');
const optsEl = document.getElementById('opts');
const footEl = document.getElementById('foot');
let profile = {}
let options = []
let loadIndx = 0;
let loading = false;
const loadChars = ['/', '-', '\\', '|']

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
  linesContEl.appendChild(ln)
  settleLines()
}

function addSysLine(msg, dim = false) {
  addLine('sys>\xa0', msg, dim?'dim-text':'')
}

function addLocalLine(msg) {
  addLine('\xa0\xa0\xa0>\xa0', msg)
}

function clearLines() {
  var child = linesContEl.lastElementChild; 
  while (child) {
    linesContEl.removeChild(child);
      child = linesContEl.lastElementChild;
  }
}

function settleLines() {
  setTimeout(() => {
    linesWrappEl.scrollTop = linesWrappEl.scrollHeight;
  }, 200)
}

function setOptions(opts) {
  options = opts || []
  let optText = '\xa0'
  opts.forEach((opt, i)=>{
    optText += `${(i == 0?'':'\xa0\xa0')}<span class="opt-letter">${opt.cmd.toUpperCase()}</span>:${opt.name}`
  })
  optsEl.innerHTML = optText
}

function setMainCarret(carret) {
  document.getElementById('input-carret').innerText = `${carret}\xa0`
}

function setFoot(ftext) {
  footEl.innerText = ftext
}

function setLoading(ldng) {
  if(ldng) {
    loading = true
    inputEl.disabled = true
    rec = setTimeout(() => {
      setMainCarret(`\xa0${loadChars[loadIndx%loadChars.length]}\xa0✕`)
      loadIndx++
      setLoading(true)
    }, 200)
  } else {
    if(loading) {
      loading = false
      loadIndx = 0
      inputEl.disabled = false
      clearTimeout(rec)
    }
  }
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
      
        if (data.hasOwnProperty('clear') && data.clear) {
          clearLines()
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
        inputEl.focus()
      })
    }
  });
}

inputEl.addEventListener('keypress', (e) => {
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
})

inputEl.addEventListener('input', (e) => {
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

function authorize() {
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
        }
      })
      //pushCommand()
    }
  });
  inputEl.focus()
}

authorize()