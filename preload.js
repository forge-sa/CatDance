'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cat', {
  onState: (cb) => ipcRenderer.on('state', (_e, s) => cb(s)),
  menu: () => ipcRenderer.send('menu'),
});
