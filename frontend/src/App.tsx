import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './lib/AppProvider'
import Home from './pages/Home'
import GamePage from './pages/Game'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/:slug" element={<GamePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
