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
  const options = document.getElementById('options');

  const typing = document.createElement('div');
  typing.className = 'typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatbox.appendChild(typing);
  chatbox.scrollTop = chatbox.scrollHeight;

  setTimeout(() => {
    typing.remove();

    const msg = document.createElement('div');
    msg.className = 'message bot';
    msg.innerHTML = '<img src="logo.png" class="avatar" alt="logo"> ' + nodo.mensaje;
    chatbox.appendChild(msg);
    chatbox.scrollTop = chatbox.scrollHeight;

    options.innerHTML = '';
    nodo.opciones.forEach(opcion => {
      const btn = document.createElement('button');
      btn.textContent = opcion.texto;
      btn.onclick = () => {
        const userMsg = document.createElement('div');
        userMsg.className = 'message user';
        userMsg.textContent = opcion.texto;
        chatbox.appendChild(userMsg);
        nodoActual = opcion.siguiente;
        mostrarNodo(nodoActual);
      };
      options.appendChild(btn);
    });
  }, 800);
}
