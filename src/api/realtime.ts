import { baseURL } from './client'
import { type Socket, io } from 'socket.io-client'

export type RealtimeTopic = 'system' | 'job-log'

type SubscriptionPayload = { topic: 'system' } | { topic: 'job-log'; job_id: string }

type SubscriptionEntry = {
    payload: SubscriptionPayload
    count: number
}

let socket: Socket | null = null
const subscriptions = new Map<string, SubscriptionEntry>()

export const getSocket = () => {
    if (!socket) {
        const created = io(baseURL || undefined, {
            path: '/api/socket.io',
            withCredentials: true,
            autoConnect: false
        })
        // Server-side rooms are lost on every reconnect, so re-join all active topics.
        created.on('connect', () => {
            for (const { payload } of subscriptions.values()) created.emit('subscribe', payload)
        })
        socket = created
    }

    return socket
}

export const subscribe = (topic: RealtimeTopic, jobId?: string) => {
    const payload: SubscriptionPayload =
        topic === 'job-log' ? { topic, job_id: jobId ?? '' } : { topic }
    const key = payload.topic === 'job-log' ? `job-log:${payload.job_id}` : payload.topic
    const existing = subscriptions.get(key)
    let released = false

    if (existing) {
        existing.count += 1
    } else {
        subscriptions.set(key, { payload, count: 1 })
        if (socket?.connected) socket.emit('subscribe', payload)
    }

    return () => {
        if (released) return
        released = true

        const entry = subscriptions.get(key)
        if (!entry) return

        entry.count -= 1
        if (entry.count > 0) return

        subscriptions.delete(key)
        if (socket?.connected) socket.emit('unsubscribe', payload)
    }
}
