const input = document.getElementById('input');
const lines = document.getElementById('lines');
const linesContainer = document.getElementById('lines-container');
const opts = document.getElementById('opts');
const foot = document.getElementById('foot');
let profile = {}
let loginState = false;
let loadI = 0;
let loading = false;

const loadChars = ['/', '-', '\\', '|']

//Pusher.logToConsole = true;

var pusher = new Pusher('9f0b98fbf42211664194', { cluster: 'us2' });
var channel = pusher.subscribe('chnnl');

channel.bind('event', function(data) {
  alert(JSON.stringify(data));
});

function pushData(data) {
  console.log(JSON.stringify(data))
  fetch("api/event-channel", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(data)
  }).then(res => {
    console.log("Request complete! response:", res)
  });
}

function send() {
  pushData({data: 2, user: 'nomas'})
}

function sendSimple(msg) {
  let el = document.createElement('div')
  el.innerText = msg
  el.className = 'line'
  lines.appendChild(el)
  settleLines()
}

function addLine(carret, content) {
  let ln = document.createElement('div')
  ln.className = 'line'
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

function addSysLine(msg) {
  addLine('sys>\xa0', msg)
}

function addLocalLine(msg) {
  addLine('>\xa0', msg)
}

function setMainCarret(carret) {
  document.getElementById('input-carret').innerText = `${carret}\xa0`
}

function setOptions(optText) {
  opts.innerText = optText
}

function setFoot(ftext) {
  foot.innerText = ftext
}

function printBanenr() {
  
}

function logIn() {
  if(loginState) {
    if(input.value !== '' && input.value.length > 2 && input.value.length < 20) {
      //login
      loginState = false
      localStorage.setItem('profile', JSON.stringify({'uname': input.value.trim()}))
      input.value = ''
      setLogged()
    } else {
      addSysLine('Invalid username!')
    }
  }
}

input.addEventListener('keypress', (e) => {
  const keyPressed = e.key
  if (keyPressed === 'Enter') {
    e.preventDefault();
    if (e.target.value[0] == '/' && e.target.value.length == 2) {
      switch (e.target.value[1].toLowerCase()) {
        case 'l':
          addSysLine('Loading state')
          setLoading(true)
          break;
        case 's':
          addSysLine('Loading state off')
          setLoading(false)
          setMainCarret('MSG>')
          break;
        case 'c':
          clearLines()
          break;
        case 'a':
          for (let i = 0; i < 10; i++) {
            addLocalLine('hi')
          }
          break;
        case 'q':
          clearLines()
          localStorage.clear('profile')
          addSysLine('Deleting profile')
          addSysLine('Loggin off')
          addLine('', '\xa0')
          setLogin()
          break;
        case 'b':
          addSysLine('Work on progress!')
          break;
        case 'i':
          addSysLine('Información valiosísima!')
          break;
        default:
          addSysLine('Unknown command!')
          break;
      }
      e.target.value = ''
    } else if(loginState) {
      logIn()
    } else if(e.target.value !== '') {
      addLocalLine(e.target.value)
      e.target.value = ''
    }
    e.target.style.height = '1rem';
  }
})

input.addEventListener('input', (e) => {
  e.target.style.height = '1rem';
  e.target.style.height = ((e.target.scrollHeight) / 16) + 'rem';
  if(!loading && !loginState){
    if(e.target.value[0] == '/') {
      setMainCarret('OPT>')
    } else {
      setMainCarret('MSG>')
    }
  }
})

function settleLines() {
  setTimeout(() => {
    linesContainer.scrollTop = linesContainer.scrollHeight;
  }, 200)
}

function clearLines() {
  var child = lines.lastElementChild; 
  while (child) {
    lines.removeChild(child);
      child = lines.lastElementChild;
  }
}


function setLogin() {
  loginState = true
  addSysLine('Log with a cool name!')
  addLine('', '\xa0')
  setMainCarret('username:')
  setFoot('\xa0')
}

function setLogged() {
  profile = JSON.parse(localStorage.getItem('profile'))
  clearLines()
  opts.classList.remove('hidden')
  setOptions('Q:Quit\xa0\xa0B:Load Board\xa0\xa0I:Info')
  setMainCarret('MSG>')
  addLocalLine(`Logged as ${profile.uname}` )
  addLine('', '\xa0')
  addSysLine(`Welcome ${profile.uname}!`)
  addSysLine('Write te command of your choose. /h for help.')
  addLine('', '\xa0')
  setFoot('\xa0/[CMD] for commands') 
}

function entryState() {
  if(localStorage.getItem('profile') !== null) {
    setLogged()
  } else {   
    clearLines()
    setLogin()
  }
}

function setLoading(ldng) {
  if(ldng) {
    loading = true
    rec = setTimeout(() => {
      setMainCarret(`\xa0${loadChars[loadI%loadChars.length]}\xa0`)
      loadI++
      setLoading(true)
    }, 200)
  } else {
    loading = false
    if(rec !== undefined) {
      clearTimeout(rec)
    }
  }
}

entryState()
