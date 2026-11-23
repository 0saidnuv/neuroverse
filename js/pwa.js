/* ============================================================
   NEUROVERSE — Modo aplicación (PWA) y protección de datos
   - Registra el service worker: la app funciona sin internet.
   - Permite INSTALAR la app (ícono en escritorio / menú Inicio).
   - Pide al navegador guardado PERSISTENTE (no se borra solo).
   - Respaldo automático en un archivo .json elegido por el anfitrión.
   ============================================================ */
window.NV = window.NV || {};

NV.PWA = (function () {
  var deferredPrompt = null, persisted = null;
  var isHttp = /^https?:$/.test(location.protocol);

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
  }

  function init() {
    if (isHttp && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('Service worker no registrado:', e); });
    }
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(function (p) {
        if (p) { persisted = true; return; }
        return navigator.storage.persist().then(function (ok) { persisted = ok; });
      }).catch(function () { persisted = false; });
    }
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault(); deferredPrompt = e; refreshButtons();
    });
    window.addEventListener('appinstalled', function () {
      deferredPrompt = null; refreshButtons();
      NV.UI.toast('✓ NEUROVERSE se instaló como aplicación. Búscalo en tu escritorio o menú Inicio.', 'ok', 6000);
    });
  }

  function refreshButtons() {
    var b = document.querySelector('[data-action="install"]');
    if (b) b.classList.toggle('hidden', !canInstall());
  }
  function canInstall() { return !!deferredPrompt && !isStandalone(); }

  function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function () { deferredPrompt = null; refreshButtons(); });
      return;
    }
    var how = isStandalone()
      ? '<p>✓ Ya estás usando NEUROVERSE como aplicación instalada.</p>'
      : !isHttp
        ? '<p>Para instalar la app, abre el juego con el archivo <b>INICIAR NEUROVERSE.bat</b> (o con <code>node tools/serve.js</code>). Chrome no permite instalar apps abiertas con doble clic en <code>index.html</code>.</p>'
        : '<p>En Chrome, abre el menú <b>⋮</b> → <b>Transmitir, guardar y compartir</b> → <b>Instalar página como app…</b> (o el ícono de instalar en la barra de direcciones).</p>';
    NV.UI.alert('INSTALAR APLICACIÓN', how);
  }

  /* ---------- Respaldo automático en archivo ---------- */
  var DB = 'neuroverse-backup', handle = null;
  function idb(mode, fn) {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error('sin IndexedDB'));
      var r = indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('h'); };
      r.onerror = function () { rej(r.error); };
      r.onsuccess = function () {
        var tx = r.result.transaction('h', mode), st = tx.objectStore('h'), q = fn(st);
        tx.oncomplete = function () { res(q && q.result); };
        tx.onerror = function () { rej(tx.error); };
      };
    });
  }
  function loadHandle() {
    return idb('readonly', function (st) { return st.get('file'); }).then(function (h) { handle = h || null; return handle; }).catch(function () { return null; });
  }
  function backupSupported() { return 'showSaveFilePicker' in window && isHttp; }

  function chooseBackupFile() {
    if (!backupSupported()) {
      NV.UI.alert('RESPALDO AUTOMÁTICO', '<p>Esta función necesita Chrome abriendo el juego con <b>INICIAR NEUROVERSE.bat</b> o como app instalada. Mientras tanto usa <b>Respaldo completo (JSON)</b> en la pestaña Resultados.</p>');
      return Promise.resolve(false);
    }
    return window.showSaveFilePicker({ suggestedName: 'neuroverse-datos.json', types: [{ description: 'Datos de NEUROVERSE', accept: { 'application/json': ['.json'] } }] })
      .then(function (h) { handle = h; return idb('readwrite', function (st) { return st.put(h, 'file'); }); })
      .then(function () { return writeBackup(true); })
      .catch(function (e) { if (e && e.name !== 'AbortError') NV.UI.toast('No se pudo elegir el archivo: ' + e.message, 'warn'); return false; });
  }
  function forgetBackupFile() { handle = null; return idb('readwrite', function (st) { return st.delete('file'); }).catch(function () { }); }

  // Escribe el respaldo. Si falta permiso, lo pide (requiere un clic reciente del usuario).
  function writeBackup(ask) {
    if (!handle) return Promise.resolve(false);
    var opts = { mode: 'readwrite' };
    return Promise.resolve(handle.queryPermission ? handle.queryPermission(opts) : 'granted').then(function (p) {
      if (p === 'granted') return true;
      if (ask && handle.requestPermission) return handle.requestPermission(opts).then(function (r) { return r === 'granted'; });
      return false;
    }).then(function (ok) {
      if (!ok) return false;
      return handle.createWritable().then(function (w) {
        return w.write(NV.Store.exportJSON()).then(function () { return w.close(); });
      }).then(function () {
        var st = NV.Store.get(); st.lastBackup = Date.now(); NV.Store.save();
        return true;
      });
    }).catch(function (e) { console.warn('Respaldo no escrito:', e); return false; });
  }

  // Llamado al terminar cada partida
  function autoBackup() {
    if (!handle) return;
    writeBackup(true).then(function (ok) {
      if (ok) NV.UI.toast('💾 Respaldo guardado en <b>' + NV.UI.esc(handle.name) + '</b>', 'ok', 2500);
      else NV.UI.toast('⚠ No se pudo actualizar el archivo de respaldo. Revísalo en Panel → Sistema.', 'warn', 4500);
    });
  }

  return {
    init: init, install: install, canInstall: canInstall, isStandalone: isStandalone, isHttp: isHttp,
    persisted: function () { return persisted; },
    loadHandle: loadHandle, backupSupported: backupSupported, chooseBackupFile: chooseBackupFile,
    forgetBackupFile: forgetBackupFile, writeBackup: writeBackup, autoBackup: autoBackup,
    backupName: function () { return handle ? handle.name : null; },
    refreshButtons: refreshButtons
  };
})();
