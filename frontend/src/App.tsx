import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppProvider } from './lib/AppProvider'
import Home from './pages/Home'
import GamePage from './pages/Game'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games/:slug" element={<GamePage />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
