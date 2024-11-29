import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
  },
  onOfflineReady() {
  },
  onRegistered(swRegistration) {
    if (swRegistration) {
      setInterval(() => {
        swRegistration.update().catch(console.error)
      }, 5 * 60 * 1000)
    }
  },
  onRegisterError(error) {
    console.error('Error durante el registro del SW:', error)
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)