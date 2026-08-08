const { app, BrowserWindow, shell, Menu, nativeTheme } = require('electron');
const path = require('path');

const APP_URL = 'https://app.zetstudiointl.com';

nativeTheme.themeSource = 'dark';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 360,
    minHeight: 600,
    title: 'ZET Portal',
    backgroundColor: '#070916',
    icon: path.join(__dirname, '..', 'frontend', 'public', 'icon-512.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
  });

  win.once('ready-to-show', () => win.show());

  win.loadURL(APP_URL);

  // Yüklenemezse yeniden dene (ağ hatası vb.)
  win.webContents.on('did-fail-load', (event, errorCode) => {
    if (errorCode !== -3) win.loadURL(APP_URL);
  });

  // External links → default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Dosya indirme — Downloads klasörüne kaydet ve aç
  win.webContents.session.on('will-download', (event, item) => {
    const fileName = item.getFilename();
    const savePath = path.join(app.getPath('downloads'), fileName);
    item.setSavePath(savePath);
    item.once('done', (e, state) => {
      if (state === 'completed') shell.showItemInFolder(savePath);
    });
  });

  return win;
}

// macOS: minimal menu
Menu.setApplicationMenu(Menu.buildFromTemplate([
  { role: 'appMenu' },
  { role: 'editMenu' },
  { role: 'viewMenu', submenu: [
    { role: 'reload' },
    { role: 'toggleDevTools' },
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' },
  ]},
  { role: 'windowMenu' },
]));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
