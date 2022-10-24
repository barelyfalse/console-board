const input = document.getElementById('input');
const lines = document.getElementById('lines');
const linesContainer = document.getElementById('lines-container');
let loginState = false;
let loadI = 0;
let loadingState = false;

const loadChars = ['/', '-', '\\', '|']

Pusher.logToConsole = true;

var pusher = new Pusher('9f0b98fbf42211664194', { cluster: 'us2' });
var channel = pusher.subscribe('chnnl');

channel.bind('event', function(data) {
  alert(JSON.stringify(data));
});

function pushData(data) {
  console.log(JSON.stringify(data));
  fetch("api/event-channel", {
    method: "POST",
    headers: {'Content-Type': 'application/json'}, 
    body: JSON.stringify(data)
  }).then(res => {
    console.log("Request complete! response:", res);
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

function sysLine(msg) {
  addLine('sys>\xa0', msg)
}

function localLine(msg) {
  addLine('>\xa0', msg)
}

function setMainCarret(carret) {
  document.getElementById('input-carret').innerText = `${carret}\xa0`
}

input.addEventListener('keypress', (e) => {
  const keyPressed = e.key
  if (keyPressed === 'Enter') {
    e.preventDefault();
    if (e.target.value[0] == '/' && e.target.value.length == 2) {
      switch (e.target.value[1]) {
        case 'L':
          sysLine('Loading state')
          setLoading(true)
          break;
        case 'S':
          sysLine('Loading state off')
          setLoading(false)
          setMainCarret('MSG>')
          break;
        default:
          sysLine('Unknown command!')
          break;
      }
      e.target.value = ''
    } else if(e.target.value !== '') {
      localLine(e.target.value)
      e.target.value = ''
    }
    
  } else {
    
  }
})

input.addEventListener('input', (e) => {
  e.target.style.height = '1rem';
  e.target.style.height = ((e.target.scrollHeight) / 16) + 'rem';
  console.log(loadingState)
  if(!loadingState){
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

settleLines()

function setLogin() {
  input.childNodes = new Array();
  sysLine('Log with a cool name!')
  addLine('', '\xa0')
  setMainCarret('username:')
  // TODO: Set opt and foot
}


function entryState() {
  if(localStorage.getItem('profile') !== null) {
    //load with profile
  } else {
    //set login phase
    setLogin()
  }
}

function setLoading(loading) {
  if(loading) {
    loadingState = true
    rec = setTimeout(() => {
      setMainCarret(`\xa0${loadChars[loadI%loadChars.length]}\xa0`)
      loadI++
      setLoading(true)
    }, 200)
  } else {
    loadingState = false
    clearTimeout(rec)
  }
}

entryState()
