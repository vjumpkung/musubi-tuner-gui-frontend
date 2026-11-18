import {
    type DownloadJob,
    type QueueStatus,
    type SystemResourceSnapshot,
    type TrainingJob,
    queryKeys
} from '../api/api'
import { type RealtimeTopic, getSocket, subscribe } from '../api/realtime'
import { type QueryClient, type QueryKey, hashKey, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { create } from 'zustand'

type RealtimeStatus = {
    connected: boolean
}

export const useRealtimeStatus = create<RealtimeStatus>(() => ({ connected: false }))

export const useRealtimeConnected = () => useRealtimeStatus((state) => state.connected)

// Query keys whose cache was written by the socket while an HTTP fetch was in flight. That fetch
// may resolve with older data, so the key is refetched once the query goes idle again.
const dirtyKeys = new Map<string, QueryKey>()

const applyRealtime = <T>(
    queryClient: QueryClient,
    key: QueryKey,
    updater: (old: T | undefined) => T | undefined
) => {
    queryClient.setQueryData<T>(key, updater)
    if (queryClient.isFetching({ queryKey: key, exact: true }) > 0) {
        dirtyKeys.set(hashKey(key), key)
    }
}

// Lists are newest-first. Returns undefined (no cache write) when the list is not loaded yet.
const upsertById = <T extends { id: string }>(list: T[] | undefined, item: T) => {
    if (!list) return undefined

    const index = list.findIndex((entry) => entry.id === item.id)
    if (index === -1) return [item, ...list]

    return list.map((entry) => (entry.id === item.id ? item : entry))
}

export const useRealtimeSync = () => {
    const queryClient = useQueryClient()

    useEffect(() => {
        const socket = getSocket()
        const cleanups: Array<() => void> = []
        const listen = <T>(event: string, handler: (payload: T) => void) => {
            socket.on(event, handler)
            cleanups.push(() => socket.off(event, handler))
        }

        cleanups.push(
            queryClient.getQueryCache().subscribe((event) => {
                if (dirtyKeys.size === 0) return

                const { query } = event
                const dirtyKey = dirtyKeys.get(query.queryHash)
                if (!dirtyKey || query.state.fetchStatus !== 'idle') return

                dirtyKeys.delete(query.queryHash)
                void queryClient.invalidateQueries({ queryKey: dirtyKey, exact: true })
            })
        )

        listen('connect', () => {
            useRealtimeStatus.setState({ connected: true })
            void queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
            void queryClient.invalidateQueries({ queryKey: queryKeys.queue })
            void queryClient.invalidateQueries({ queryKey: queryKeys.downloads })
        })
        listen('disconnect', () => useRealtimeStatus.setState({ connected: false }))
        listen('connect_error', () => useRealtimeStatus.setState({ connected: false }))

        listen<QueueStatus>('queue:update', (queue) => {
            applyRealtime<QueueStatus>(queryClient, queryKeys.queue, () => queue)
        })
        listen<TrainingJob>('job:update', (job) => {
            applyRealtime<TrainingJob[]>(queryClient, queryKeys.jobs, (jobs) =>
                upsertById(jobs, job)
            )
            applyRealtime<TrainingJob>(queryClient, queryKeys.job(job.id), () => job)
        })
        listen<{ id: string }>('job:removed', ({ id }) => {
            applyRealtime<TrainingJob[]>(queryClient, queryKeys.jobs, (jobs) =>
                jobs?.filter((job) => job.id !== id)
            )
            queryClient.removeQueries({ queryKey: queryKeys.job(id), exact: true })
        })
        listen('jobs:changed', () => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.jobs })
        })
        listen<DownloadJob>('download:update', (download) => {
            applyRealtime<DownloadJob[]>(queryClient, queryKeys.downloads, (downloads) =>
                upsertById(downloads, download)
            )
        })
        listen<SystemResourceSnapshot>('system:resources', (snapshot) => {
            applyRealtime<SystemResourceSnapshot>(
                queryClient,
                queryKeys.systemResources,
                () => snapshot
            )
        })

        socket.connect()

        return () => {
            for (const cleanup of cleanups) cleanup()
            dirtyKeys.clear()
            socket.disconnect()
            useRealtimeStatus.setState({ connected: false })
        }
    }, [queryClient])
}

export const useRealtimeSubscription = (topic: RealtimeTopic, jobId?: string) => {
    useEffect(() => {
        if (topic === 'job-log' && !jobId) return

        return subscribe(topic, jobId)
    }, [topic, jobId])
}
