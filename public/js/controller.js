const input = document.getElementById('input');
const lines = document.getElementById('lines');
const linesContainer = document.getElementById('lines-container');
console.log(linesContainer)

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

input.addEventListener('keypress', (e) => {
  const keyPressed = e.key
  if (keyPressed === 'Enter') {
    e.preventDefault();
    if(e.target.value !== '') {
      sendSimple(e.target.value)
    }
  } else {
    
  }
})

input.addEventListener('input', (e) => {
  e.target.style.height = '1rem';
  e.target.style.height = ((e.target.scrollHeight) / 16) + 'rem';
  if(e.target.value[0] == '/') {
    document.getElementById('input-carret').innerText = 'OPT>\xa0'
  } else {
    document.getElementById('input-carret').innerText = 'MSG>\xa0'
  }
})

function settleLines() {
  setTimeout(() => {
    linesContainer.scrollTop = linesContainer.scrollHeight;
  }, 200)
}
