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