// Electron Preload Script
// Isolamento de contexto ativo para segurança máxima da aplicação
window.addEventListener('DOMContentLoaded', () => {
  // Flag indicativa no ambiente de execução
  window.isElectronApp = true
})
