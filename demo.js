let chats = [];
let active = false;
let activeChat = null;
let waitingAlertChat = null;
let alertBusy = false;

const queue = document.getElementById('queue');
const count = document.getElementById('count');
const body = document.getElementById('chatbody');
const end = document.getElementById('end');
const pulse = document.getElementById('pulseToggle');
const waitingAlert = document.getElementById('waitingAlert');
const waitingText = document.getElementById('waitingText');
const routeStatus = document.getElementById('routeStatus');

const names = ['Hersh Rasool','Wesley Hurley','Alex Johnson','Priya Rao'];

function currentRoute() {
  return location.hash ? location.hash.slice(1) : 'chat';
}

function renderRoutes() {
  const route = currentRoute();
  document.querySelectorAll('.route').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
  routeStatus.innerHTML = 'Route: <b>/' + route + '</b>';
}

document.querySelectorAll('.route').forEach(a => {
  a.addEventListener('click', () => {
    location.hash = a.dataset.route;
    renderRoutes();
  });
});
window.addEventListener('hashchange', renderRoutes);

function hideWaitingAlert() {
  waitingAlert.hidden = true;
  waitingAlertChat = null;
  alertBusy = false;
}

function showNextWaitingAlert() {
  if (alertBusy || waitingAlertChat || chats.length === 0) return;
  waitingAlertChat = chats[0];
  alertBusy = true;
  waitingText.textContent = waitingAlertChat.name + ' is waiting for a chat.';
  waitingAlert.hidden = false;
}

function acceptChat(chat) {
  const index = chats.indexOf(chat);
  if (index === -1) return;

  // Remove from queue immediately: this also makes the waiting popup disappear.
  chats.splice(index, 1);
  hideWaitingAlert();

  active = true;
  activeChat = chat;
  document.querySelector('.chatHeader .name').textContent = chat.name;
  body.innerHTML = '<div><b>Customer:</b> ' + chat.name +
    '</div><p>Hello, I need help with my order.</p>';
  render();

  // If another chat is already waiting, alert it after the current popup closes.
  setTimeout(showNextWaitingAlert, 50);
}

function render() {
  count.textContent = chats.length;
  queue.innerHTML = chats.map((c, i) => `
    <div class="queueItem">
      <div>
        <div class="name">${c.name}<span class="badge">1</span></div>
        <div class="sub">ABC-3P-Human-En</div>
        <div class="sub">Waiting for ${Math.floor((Date.now()-c.created)/1000)} s</div>
      </div>
      <button class="btn accept" title="Accept" data-i="${i}">✓</button>
    </div>`).join('');

  queue.querySelectorAll('[data-i]').forEach(b => {
    b.onclick = () => acceptChat(chats[+b.dataset.i]);
  });

  if (!waitingAlert.hidden && waitingAlertChat) {
    const stillWaiting = chats.includes(waitingAlertChat);
    if (!stillWaiting) hideWaitingAlert();
  }
  showNextWaitingAlert();
}

document.getElementById('newChat').onclick = () => {
  chats.push({
    name: names[Math.floor(Math.random() * names.length)],
    created: Date.now()
  });
  render();
};

document.getElementById('alertAccept').onclick = () => {
  if (waitingAlertChat) acceptChat(waitingAlertChat);
};

document.getElementById('alertDismiss').onclick = () => {
  // Dismiss only this alert. The chat remains waiting and can alert again
  // when another waiting-chat cycle is requested.
  waitingAlert.hidden = true;
  waitingAlertChat = null;
  alertBusy = false;
};

end.onclick = () => {
  if (!active) return;
  // Demo native flow: End Chat first changes the header action to Close.
  end.textContent = 'Close';
  end.classList.remove('end');
  end.classList.add('closeChat');
  end.onclick = closeChat;
  body.innerHTML = '<div class="empty">End Chat selected. Click Close to close the chat.</div>';
};

function closeChat() {
  if (!active) return;
  // Close the chat first, then show the pulse tracker.
  active = false;
  activeChat = null;
  body.innerHTML = '<div class="empty">Chat closed.</div>';
  end.textContent = 'End Chat';
  end.classList.remove('closeChat');
  end.classList.add('end');
  end.onclick = endChat;
  showPulse();
  render();
}

function endChat() {
  if (!active) return;
  end.onclick = endChat;
  end.click();
}

function showPulse() {
  const modal = document.createElement('div');
  modal.className = 'pulse-modal';
  modal.innerHTML = `
    <div class="pulse-card">
      <h3>Is chat Good?</h3>
      <p>How was this chat?</p>
      <div class="pulse-options">
        <button data-value="good" class="good">🟢 Good</button>
        <button data-value="not-sure" class="not-sure">⚪ Not sure</button>
        <button data-value="bad" class="bad">🔴 Bad</button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  modal.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      const value = btn.dataset.value;
      if (value === 'good') chrome.runtime?.sendMessage?.({type:'PULSE', value:'good'});
      if (value === 'bad') chrome.runtime?.sendMessage?.({type:'PULSE', value:'bad'});
      modal.remove();
    };
  });
}

document.querySelector('.select').addEventListener('change', e => {
  document.getElementById('since').textContent = new Date().toLocaleTimeString();
});

document.getElementById('agentName').addEventListener('click', () => {
  // In the real extension this is extension-relative index.html.
  window.open('index.html', '_blank', 'noopener');
});

renderRoutes();
setInterval(render, 1000);
render();
