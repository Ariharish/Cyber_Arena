// Vercel-friendly realtime shim.
// The original app used Flask-SocketIO on localhost:5000, which cannot be
// relied on from a Vercel serverless deployment. We poll the API and expose
// the same on/off interface so existing dashboard/feed components continue
// to work without code changes.

import { getAttacks } from './api'

let timer = null
let lastAttackId = null
const listeners = new Set()

const emit = (data) => {
    listeners.forEach((listener) => {
        try { listener(data) } catch (error) { console.warn('[Realtime]', error) }
    })
}

const poll = async () => {
    try {
        const res = await getAttacks(1)
        const latest = res.data?.attacks?.[0]
        if (!latest) return

        if (lastAttackId === null) {
            lastAttackId = latest.attack_id || latest._id
            return
        }

        const currentId = latest.attack_id || latest._id
        if (currentId && currentId !== lastAttackId) {
            lastAttackId = currentId
            emit({
                attack_id: latest.attack_id,
                attack_type: latest.attack_type,
                payload: latest.payload,
                severity: latest.severity,
                attacker_ip: latest.attacker_ip,
                country: latest.attacker_location?.country,
                city: latest.attacker_location?.city,
                browser: latest.browser,
                operating_system: latest.operating_system,
                timestamp: latest.timestamp,
                ai_summary: latest.ai_analysis?.explanation || '',
                replay_conclusion: latest.replay_results?.conclusion || '',
            })
        }
    } catch (error) {
        // Keep the UI usable if the API is temporarily cold-starting.
    }
}

export const getSocket = () => ({
    on(event, listener) {
        if (event !== 'attack_alert') return
        listeners.add(listener)
        if (!timer) {
            poll()
            timer = window.setInterval(poll, 4000)
        }
    },
    off(event, listener) {
        if (event !== 'attack_alert') return
        listeners.delete(listener)
        if (listeners.size === 0 && timer) {
            window.clearInterval(timer)
            timer = null
        }
    },
})

export const disconnectSocket = () => {
    listeners.clear()
    if (timer) {
        window.clearInterval(timer)
        timer = null
    }
}

export default getSocket
