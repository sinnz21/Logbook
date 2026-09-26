import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './context/AppContext.jsx'

// `npm run demo` sets VITE_DEMO=true (see .env.demo): /api is then answered from
// src/mock instead of the backend. The import is dynamic and the flag is inlined
// at build time, so none of the sample data ships in a normal build.
if (import.meta.env.VITE_DEMO === 'true') {
  const { installMockApi } = await import('./mock/install.js')
  installMockApi()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
