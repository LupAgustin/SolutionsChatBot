let flujo = {};
let nodoActual = "inicio";



function link(text) {
  return text.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
}

// Inicializo el chat
async function inicioChat() {
  try {
    const res  = await fetch('flujo.json');
    const data = await res.json();
    flujo = data.flow ?? data;

    if (!flujo.inicio) {
      console.error('El JSON no contiene el nodo "inicio".');
      return;
    }
    resetChat();
  } catch (err) {
    console.error('Error cargando flujo.json:', err);
  }
}
inicioChat();

// Resetea el chat al inicio
function resetChat() {
  const chatbox = document.getElementById('chatbox');
  chatbox.innerHTML = '';
  nodoActual = "inicio";
  mostrarNodo(nodoActual);
}

//Muestro los mensajes
function mostrarNodo(id) {
  nodoActual = id;
  const nodo   = flujo[id];
  const chatbox = document.getElementById('chatbox');

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatbox.appendChild(typing);
  chatbox.scrollTop = chatbox.scrollHeight;

  setTimeout(() => {
    typing.remove();

    const contenido = link(nodo.mensaje)
      .replace(/\n/g, '<br>');

    const msg = document.createElement('div');
    msg.className = 'message bot';
    msg.innerHTML = `
      <img src="imagenes/logo.png" class="avatar" alt="logo">
      <div class="bubble">${contenido}</div>
    `;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'option-buttons';

    (nodo.opciones || []).forEach(opcion => {
      const btn = document.createElement('button');
      btn.textContent = opcion.texto;
      btn.onclick = () => {
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `<div class="bubble-user">${opcion.texto}</div>`;
        chatbox.appendChild(userMsg);
        chatbox.scrollTop = chatbox.scrollHeight;

        buttonsContainer.remove();

        let nextId = opcion.siguiente;
        if (!flujo[nextId]) {
          console.warn(`Siguiente "${nextId}" inválido, regresando a "inicio".`);
          nextId = "inicio";
        }
        mostrarNodo(nextId);
      };
      buttonsContainer.appendChild(btn);
    });

    chatbox.appendChild(buttonsContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
  }, 800);
}



let chatAbierto = false;
const boton      = document.getElementById('chatbotToggle');
const popup      = document.getElementById('chatbotPopup');
const btnContent = boton.querySelector('.btn-content');

function toggleChatbot() {
  btnContent.style.opacity = '0';
  setTimeout(() => {
    if (!chatAbierto) {
      popup.style.visibility = 'visible';
      popup.classList.remove('animar-cerrar');
      popup.classList.add('animar-abrir');
      btnContent.innerHTML = '<img src="imagenes/flechaAbajo.png" alt="Cerrar">';
    } else {
      popup.classList.remove('animar-abrir');
      popup.classList.add('animar-cerrar');
      btnContent.innerHTML = '<img src="imagenes/chat-bot.png" class="icono-chat" alt="Icono"> ChatBot';
      setTimeout(() => {
        popup.style.visibility = 'hidden';
        popup.classList.remove('animar-cerrar');
      }, 200);
    }
    chatAbierto = !chatAbierto;
    btnContent.style.opacity = '1';
  }, 200);
}

// Boton de reset para volver a inicio
document.getElementById('resetButton').addEventListener('click', resetChat);
