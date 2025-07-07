// script.js

let flujo = {};
let nodoActual = "inicio";

// Inicializo el chat leyendo flujo.json
async function initChat() {
  try {
    const res  = await fetch('flujo1.json');
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
initChat();

// Resetea el chat al inicio
function resetChat() {
  const chatbox = document.getElementById('chatbox');
  chatbox.innerHTML = '';
  nodoActual = "inicio";
  mostrarNodo(nodoActual);
}

// Muestra un nodo dado su id, validando que exista
function mostrarNodo(id) {
  if (!flujo[id]) {
    console.warn(`Nodo "${id}" no encontrado, regresando a "inicio".`);
    id = "inicio";
  }
  nodoActual = id;

  const nodo = flujo[id];
  const chatbox = document.getElementById('chatbox');

  // Indicador de escritura
  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatbox.appendChild(typing);
  chatbox.scrollTop = chatbox.scrollHeight;

  setTimeout(() => {
    typing.remove();

    // Mensaje del bot
    const msg = document.createElement('div');
    msg.className = 'message bot';
    msg.innerHTML = `
      <img src="/imagenes/logo.png" class="avatar" alt="logo">
      <div class="bubble">${nodo.mensaje}</div>
    `;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;

    // Botones de opciones
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'option-buttons';

    (nodo.opciones || []).forEach(opcion => {
      const btn = document.createElement('button');
      btn.textContent = opcion.texto;
      btn.onclick = () => {
        // Mensaje del usuario
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.innerHTML = `<div class="bubble-user">${opcion.texto}</div>`;
        chatbox.appendChild(userMsg);
        chatbox.scrollTop = chatbox.scrollHeight;

        buttonsContainer.remove();

        // Determino siguiente nodo, y si no existe, vuelvo a "inicio"
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

// Toggle del chatbot (igual que antes)
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
      btnContent.innerHTML = '<img src="/imagenes/flechaAbajo.png" alt="Cerrar">';
    } else {
      popup.classList.remove('animar-abrir');
      popup.classList.add('animar-cerrar');
      btnContent.innerHTML = '<img src="/imagenes/chat-bot.png" class="icono-chat" alt="Icono"> ChatBot';
      setTimeout(() => {
        popup.style.visibility = 'hidden';
        popup.classList.remove('animar-cerrar');
      }, 200);
    }
    chatAbierto = !chatAbierto;
    btnContent.style.opacity = '1';
  }, 200);
}

// Botón de reset para volver a inicio
document.getElementById('resetButton').addEventListener('click', resetChat);
