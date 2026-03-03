import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AdminTopUp from "./components/";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminTopUp />
  </StrictMode>,
)
