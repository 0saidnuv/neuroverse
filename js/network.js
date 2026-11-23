/* ============================================================
   NEUROVERSE — Capa de red (preparada para multijugador online)

   ESTADO ACTUAL: el juego funciona 100% LOCAL. No existe ninguna
   conexión online y la interfaz lo indica claramente ("Modo local").

   Toda acción importante de la partida pasa por NV.Net.emit(), así que
   para agregar multijugador en línea basta con implementar un adaptador
   que envíe esos eventos a un servidor en tiempo real (por ejemplo,
   Node.js + WebSocket / Socket.IO) y registrarlo con NV.Net.use().

   Eventos que emite el juego:
     'match:start'   { match }            una partida comenzó
     'match:step'    { stepIndex, step }  inicia una pregunta/reto/duelo/jefe
     'match:answer'  { who, correct, points }
     'match:end'     { results }
     'state:sync'    { snapshot }         estado completo (para espectadores)

   Ejemplo de adaptador futuro (NO activo):

   NV.Net.use({
     name: 'websocket',
     online: true,
     connect: function (url) { this.ws = new WebSocket(url); ... },
     send: function (type, payload) { this.ws.send(JSON.stringify({ type, payload })); },
     onMessage: function (handler) { this.ws.onmessage = e => handler(JSON.parse(e.data)); }
   });

   En el servidor, cada sala tendría un anfitrión (esta pantalla) y los
   equipos podrían responder desde sus celulares enviando 'match:answer'.
   ============================================================ */
window.NV = window.NV || {};

NV.Net = (function () {
  var LocalAdapter = {
    name: 'local',
    online: false,
    connect: function () { return Promise.resolve(false); },
    send: function () { /* modo local: no se envía nada a ningún servidor */ },
    onMessage: function () { }
  };
  var adapter = LocalAdapter;
  var listeners = {};

  return {
    use: function (a) { adapter = a || LocalAdapter; },
    isOnline: function () { return !!adapter.online; },
    adapterName: function () { return adapter.name; },
    emit: function (type, payload) {
      (listeners[type] || []).forEach(function (fn) { try { fn(payload); } catch (e) { console.error(e); } });
      adapter.send(type, payload);
    },
    on: function (type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
  };
})();
