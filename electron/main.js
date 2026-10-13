// Processo principal do Electron para empacotar o sistema no Windows (.exe)
// Requer: npm install --save-dev electron electron-builder (ou execução via npx)
// Build Windows: npx electron-builder --win

const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

const isDev = process.env.NODE_ENV === 'development'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    title: 'Sistema Help Desk',
    icon: path.join(__dirname, '../public/favicon.svg'),
    backgroundColor: '#0F1222',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  // Menu customizado ou minimalista
  Menu.setApplicationMenu(null)

  // Em modo de desenvolvimento aponta pro servidor Vite local, em produção carrega a dist compilada
  if (isDev) {
    mainWindow.loadURL('http://localhost:8080')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Links externos abrem no navegador padrão do sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
