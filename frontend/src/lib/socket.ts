import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    // Same origin in both dev (via Vite proxy) and prod (Nginx). Cookies carry
    // the better-auth session — server-side socket middleware reads them.
    socket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    })
  }
  return socket
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}
