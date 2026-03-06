import { io } from 'socket.io-client'

let socket = null

export const getSocket = () => {
    if (!socket) {
        socket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        })

        socket.on('connect', () => {
            console.log('[Socket] Connected to CyberArena backend')
            socket.emit('join_blue_team', { role: 'blue_team' })
        })

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected from backend')
        })

        socket.on('connect_error', (err) => {
            console.warn('[Socket] Connection error:', err.message)
        })
    }
    return socket
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

export default getSocket
