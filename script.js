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
    msg.innerHTML = `<img src="logo.png" class="avatar" alt="logo"> <div>${nodo.mensaje}</div>`;
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
        userMsg.textContent = opcion.texto;
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
