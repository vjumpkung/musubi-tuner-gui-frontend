import { type TrainingJob, queryKeys, trainingApi } from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
import { cn } from '../../utils/cn'
import TerminalComponent from './terminal'
import {
    ArrowPathIcon,
    CommandLineIcon,
    PauseIcon,
    PlayIcon,
    StopIcon,
    TrashIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardBody, Progress, Typography } from '@material-tailwind/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const activeStatuses: TrainingJob['status'][] = ['queued', 'running']

const statusStyles: Record<TrainingJob['status'], string> = {
    queued: 'bg-amber-50 text-amber-800',
    running: 'bg-blue-50 text-blue-800',
    completed: 'bg-green-50 text-green-800',
    failed: 'bg-red-50 text-red-800',
    cancelled: 'bg-blue-gray-50 text-blue-gray-700'
}

const useJobLog = (jobId: string) => {
    const [stream, setStream] = useState({ jobId: '', offset: 0, content: '' })
    const offset = stream.jobId === jobId ? stream.offset : 0
    const logQuery = useQuery({
        queryKey: queryKeys.logs(jobId, offset),
        queryFn: () => trainingApi.getLogs(jobId, offset),
        enabled: Boolean(jobId),
        staleTime: 0,
        refetchInterval: (query) => (query.state.data?.eof ? false : 1_500)
    })

    useEffect(() => {
        if (stream.jobId !== jobId) setStream({ jobId, offset: 0, content: '' })
    }, [jobId, stream.jobId])

    useEffect(() => {
        const chunk = logQuery.data
        if (!chunk) return

        setStream((current) => {
            if (current.jobId !== jobId || current.offset !== chunk.offset) return current
            if (chunk.next_offset === current.offset && !chunk.content) return current
            return {
                jobId,
                offset: chunk.next_offset,
                content: current.content + chunk.content
            }
        })
    }, [jobId, logQuery.data])

    return {
        content: stream.jobId === jobId ? stream.content : '',
        error: logQuery.error
    }
}

const formatDate = (value?: string | null) => {
    if (!value) return 'Not started'
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const LogViewer = () => {
    const queryClient = useQueryClient()
    const [selectedJobId, setSelectedJobId] = useState('')
    const jobsQuery = useQuery({
        queryKey: queryKeys.jobs,
        queryFn: trainingApi.listJobs,
        refetchInterval: 1_500
    })
    const queueQuery = useQuery({
        queryKey: queryKeys.queue,
        queryFn: trainingApi.getQueue,
        refetchInterval: 1_500
    })
    const jobs = jobsQuery.data ?? []
    const selectedJob =
        jobs.find((job) => job.id === selectedJobId) ??
        jobs.find((job) => job.status === 'running') ??
        jobs[0]
    const jobLog = useJobLog(selectedJob?.id ?? '')

    const refresh = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
            queryClient.invalidateQueries({ queryKey: queryKeys.queue })
        ])
    }

    const queueMutation = useMutation({
        mutationFn: () =>
            queueQuery.data?.state === 'running'
                ? trainingApi.pauseQueue()
                : trainingApi.startQueue(),
        onSuccess: (queue) => queryClient.setQueryData(queryKeys.queue, queue)
    })
    const cancelMutation = useMutation({
        mutationFn: trainingApi.cancel,
        onSuccess: refresh
    })
    const retryMutation = useMutation({
        mutationFn: trainingApi.retry,
        onSuccess: async (job) => {
            setSelectedJobId(job.id)
            await refresh()
        }
    })
    const deleteMutation = useMutation({
        mutationFn: trainingApi.remove,
        onSuccess: async () => {
            setSelectedJobId('')
            await refresh()
        }
    })

    const actionError =
        jobsQuery.error ??
        queueQuery.error ??
        jobLog.error ??
        queueMutation.error ??
        cancelMutation.error ??
        retryMutation.error ??
        deleteMutation.error
    const errorMessage = actionError
        ? getApiErrorMessage(actionError, 'The training service request failed.')
        : undefined

    return (
        <main className="mx-auto w-full max-w-7xl p-3 pb-12 sm:p-5 sm:pb-12">
            <header className="mb-6 rounded-xl border border-blue-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                            <CommandLineIcon className="h-4 w-4" />
                            Training queue and live output
                        </div>
                        <Typography variant="h1" color="blue-gray">
                            Jobs & logs
                        </Typography>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-blue-gray-600">
                            Monitor queued and running training jobs, control the worker, and
                            inspect server logs.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                            <p className="font-semibold capitalize text-blue-gray-900">
                                Queue {queueQuery.data?.state ?? 'unavailable'}
                            </p>
                            <p className="text-blue-gray-600">
                                {queueQuery.data?.queued ?? 0} waiting
                            </p>
                        </div>
                        <Button
                            type="button"
                            color="blue"
                            disabled={!queueQuery.data || queueMutation.isPending}
                            className="flex min-h-11 items-center gap-2"
                            onClick={() => queueMutation.mutate()}
                        >
                            {queueQuery.data?.state === 'running' ? (
                                <PauseIcon className="h-5 w-5" />
                            ) : (
                                <PlayIcon className="h-5 w-5" />
                            )}
                            {queueQuery.data?.state === 'running' ? 'Pause' : 'Start'}
                        </Button>
                    </div>
                </div>
            </header>

            {errorMessage ? (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <Card className="border border-blue-gray-100 shadow-sm">
                    <CardBody className="p-3">
                        <div className="mb-2 flex items-center justify-between px-2 py-1">
                            <Typography variant="h5" color="blue-gray">
                                Training jobs
                            </Typography>
                            <span className="text-sm text-blue-gray-600">{jobs.length}</span>
                        </div>
                        <div className="max-h-[70vh] space-y-2 overflow-y-auto">
                            {jobs.map((job) => (
                                <button
                                    key={job.id}
                                    type="button"
                                    className={cn(
                                        'w-full rounded-lg border p-3 text-left transition-colors',
                                        selectedJob?.id === job.id
                                            ? 'border-blue-300 bg-blue-50'
                                            : 'border-blue-gray-100 hover:bg-blue-gray-50'
                                    )}
                                    onClick={() => setSelectedJobId(job.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="truncate font-semibold text-blue-gray-900">
                                            {job.name}
                                        </span>
                                        <span
                                            className={cn(
                                                'rounded px-2 py-0.5 text-xs font-semibold capitalize',
                                                statusStyles[job.status]
                                            )}
                                        >
                                            {job.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 truncate text-xs text-blue-gray-600">
                                        {job.profile_id}
                                        {job.queue_position !== null &&
                                        job.queue_position !== undefined
                                            ? ` · queue #${job.queue_position + 1}`
                                            : ''}
                                    </p>
                                    {job.status === 'running' ? (
                                        <Progress
                                            value={job.progress.percent ?? 0}
                                            color="blue"
                                            className="mt-2"
                                        />
                                    ) : null}
                                </button>
                            ))}
                            {!jobsQuery.isPending && jobs.length === 0 ? (
                                <p className="px-3 py-10 text-center text-sm text-blue-gray-600">
                                    No training jobs yet.
                                </p>
                            ) : null}
                        </div>
                    </CardBody>
                </Card>

                <div className="min-w-0 space-y-5">
                    {selectedJob ? (
                        <Card className="border border-blue-gray-100 shadow-sm">
                            <CardBody className="p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <Typography variant="h5" color="blue-gray">
                                            {selectedJob.name}
                                        </Typography>
                                        <p className="mt-1 text-sm text-blue-gray-600">
                                            Created {formatDate(selectedJob.created_at)}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {activeStatuses.includes(selectedJob.status) ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                color="red"
                                                variant="outlined"
                                                className="flex items-center gap-2"
                                                disabled={cancelMutation.isPending}
                                                onClick={() =>
                                                    cancelMutation.mutate(selectedJob.id)
                                                }
                                            >
                                                <StopIcon className="h-4 w-4" /> Cancel
                                            </Button>
                                        ) : null}
                                        {['failed', 'cancelled'].includes(selectedJob.status) ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                color="blue"
                                                variant="outlined"
                                                className="flex items-center gap-2"
                                                disabled={retryMutation.isPending}
                                                onClick={() => retryMutation.mutate(selectedJob.id)}
                                            >
                                                <ArrowPathIcon className="h-4 w-4" /> Retry
                                            </Button>
                                        ) : null}
                                        {!activeStatuses.includes(selectedJob.status) ? (
                                            <Button
                                                type="button"
                                                size="sm"
                                                color="blue-gray"
                                                variant="text"
                                                className="flex items-center gap-2"
                                                disabled={deleteMutation.isPending}
                                                onClick={() => {
                                                    if (
                                                        window.confirm(
                                                            `Delete “${selectedJob.name}” and its logs?`
                                                        )
                                                    ) {
                                                        deleteMutation.mutate(selectedJob.id)
                                                    }
                                                }}
                                            >
                                                <TrashIcon className="h-4 w-4" /> Delete
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    {selectedJob.stages.map((stage) => (
                                        <div
                                            key={stage.key}
                                            className="rounded-lg bg-blue-gray-50 px-3 py-2 text-xs"
                                        >
                                            <p className="font-medium text-blue-gray-800">
                                                {stage.key.replaceAll('_', ' ')}
                                            </p>
                                            <p className="mt-0.5 capitalize text-blue-gray-600">
                                                {stage.status}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {selectedJob.error ? (
                                    <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
                                        {selectedJob.error}
                                    </p>
                                ) : null}
                            </CardBody>
                        </Card>
                    ) : null}

                    <Card className="overflow-hidden border border-blue-gray-100 shadow-sm">
                        <TerminalComponent
                            content={jobLog.content}
                            emptyMessage={
                                selectedJob
                                    ? 'Waiting for server log output…'
                                    : 'Select or create a training job to view logs.'
                            }
                        />
                    </Card>
                </div>
            </div>
        </main>
    )
}

export default LogViewer
