import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
})

export const launchAttack = (attackType, payload, targetEndpoint) =>
    api.post('/attacks/launch', { attack_type: attackType, payload, target_endpoint: targetEndpoint })

export const getAttacks = (limit = 50, page = 1) =>
    api.get('/attacks', { params: { limit, page } })

export const getAttack = (id) => api.get(`/attacks/${id}`)

export const replayAttack = (id) => api.post(`/attacks/${id}/replay`)

export const getStats = () => api.get('/stats')

export const getLogs = () => api.get('/logs')

// Target endpoints
export const targetLogin = (username, password) =>
    api.post('/target/login', { username, password })

export const targetComment = (comment, author) =>
    api.post('/target/comment', { comment, author })

export const targetAdmin = (username, password) =>
    api.post('/target/admin', { username, password })

export const targetSearch = (q) =>
    api.get('/target/search', { params: { q } })

export default api
