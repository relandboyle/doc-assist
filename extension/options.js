(function(){
  const api = typeof browser !== 'undefined' ? browser : chrome;
  const store = (api.storage && api.storage.sync) || api.storage.local;
  const DEFAULT_ORIGIN = 'https://doc-tailor.com';

  const originInput = document.getElementById('origin');
  const status = document.getElementById('status');
  const saveBtn = document.getElementById('save');

  function show(msg){ status.textContent = msg; setTimeout(()=> status.textContent = '', 1500); }

  function load(){
    try {
      store.get({ appOrigin: DEFAULT_ORIGIN }, (res) => {
        originInput.value = (res && res.appOrigin) || DEFAULT_ORIGIN;
      });
    } catch (e) {
      originInput.value = DEFAULT_ORIGIN;
    }
  }

  function save(){
    const value = originInput.value.trim() || DEFAULT_ORIGIN;
    try {
      store.set({ appOrigin: value }, () => show('Saved'));
    } catch (e) {
      show('Failed to save');
    }
  }

  saveBtn.addEventListener('click', save);
  load();
})();


