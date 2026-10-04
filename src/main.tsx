import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource-variable/fraunces/opsz.css'
import '@fontsource-variable/fraunces/opsz-italic.css'
import '@fontsource-variable/inter'
import './theme/tokens.css'
import './theme/global.css'
import App from './App'
import { createUpdateGate } from './app/updateGate'

const setUpdateSafe = createUpdateGate(registerSW)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App onUpdateSafe={setUpdateSafe} />
  </StrictMode>,
)
