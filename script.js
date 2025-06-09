let flujo = {};
let nodoActual = "inicio";

fetch('flujo.json')
  .then(res => res.json())
  .then(data => {
    flujo = data;
    mostrarNodo(nodoActual);
  });

function mostrarNodo(id) {
  const nodo = flujo[id];
  const chatbox = document.getElementById('chatbox');

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatbox.appendChild(typing);
  chatbox.scrollTop = chatbox.scrollHeight;

  setTimeout(() => {
    typing.remove();

    const msg = document.createElement('div');
    msg.className = 'message bot';
    msg.innerHTML = `
      <img src="logo.png" class="avatar" alt="logo">
      <div class="bubble">${nodo.mensaje}</div>
    `;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;

    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'option-buttons';

    nodo.opciones.forEach(opcion => {
      const btn = document.createElement('button');
      btn.textContent = opcion.texto;
      btn.onclick = () => {
        
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `<div class="bubble-user">${opcion.texto}</div>`;
        chatbox.appendChild(userMsg);
        chatbox.scrollTop = chatbox.scrollHeight;

        buttonsContainer.remove();

        
        nodoActual = opcion.siguiente;
        mostrarNodo(nodoActual);
      };
      buttonsContainer.appendChild(btn);
    });

    chatbox.appendChild(buttonsContainer);
    chatbox.scrollTop = chatbox.scrollHeight;

  }, 800);
}

let chatAbierto = false;
const boton = document.getElementById('chatbotToggle');
const popup = document.getElementById('chatbotPopup');
const btnContent = boton.querySelector('.btn-content');

function toggleChatbot() {
  btnContent.style.opacity = '0';

  setTimeout(() => {
    if (!chatAbierto) {
      popup.style.visibility = 'visible';
      popup.classList.remove('animar-cerrar');
      popup.classList.add('animar-abrir')
      btnContent.innerHTML = '<img src="flechaAbajo.png" alt="Cerrar">';
      chatAbierto = true;
    } else {
      popup.classList.remove('animar-abrir');
      popup.classList.add('animar-cerrar');

      btnContent.innerHTML = '<img src="chat-bot.png" alt="Icono" class="icono-chat"> ChatBot';
      chatAbierto = false;

      
      setTimeout(() => {
        popup.style.visibility = 'hidden';
        popup.classList.remove('animar-cerrar');
      }, 200);
    }

   
    btnContent.style.opacity = '1';
  }, 200);
}

  document.getElementById('resetButton').addEventListener('click', () => {
  const chatbox = document.getElementById('chatbox');
  chatbox.innerHTML = '';      
  nodoActual = "inicio";       
  mostrarNodo(nodoActual);
});
