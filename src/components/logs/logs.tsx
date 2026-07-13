import { type TrainingJob, queryKeys, trainingApi } from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
import TerminalComponent from './terminal'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button, Card, CardBody, Progress, Typography } from '@/components/ui/legacy'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    RefreshCwIcon as ArrowPathIcon,
    SquareTerminalIcon as CommandLineIcon,
    PauseIcon,
    PlayIcon,
    SquareIcon as StopIcon,
    TrashIcon
} from 'lucide-react'
import { useEffect, useState } from 'react'

const activeStatuses: TrainingJob['status'][] = ['queued', 'running']

const statusStyles: Record<TrainingJob['status'], string> = {
    queued: 'bg-warning-muted text-warning-foreground',
    running: 'bg-accent text-primary',
    completed: 'bg-success-muted text-success-foreground',
    failed: 'bg-destructive/10 text-destructive',
    cancelled: 'bg-muted text-muted-foreground'
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
            <header className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                            <CommandLineIcon className="h-4 w-4" />
                            Training queue and live output
                        </div>
                        <Typography variant="h1" color="blue-gray">
                            Jobs & logs
                        </Typography>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                            Monitor queued and running training jobs, control the worker, and
                            inspect server logs.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right text-sm">
                            <p className="font-semibold capitalize text-foreground">
                                Queue {queueQuery.data?.state ?? 'unavailable'}
                            </p>
                            <p className="text-muted-foreground">
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
                <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    {errorMessage}
                </div>
            ) : null}

            <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
                <Card className="border border-border shadow-sm">
                    <CardBody className="p-3">
                        <div className="mb-2 flex items-center justify-between px-2 py-1">
                            <Typography variant="h5" color="blue-gray">
                                Training jobs
                            </Typography>
                            <span className="text-sm text-muted-foreground">{jobs.length}</span>
                        </div>
                        <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
                            {jobs.map((job) => (
                                <button
                                    key={job.id}
                                    type="button"
                                    className={cn(
                                        'w-full rounded-lg border p-3 text-left transition-colors',
                                        selectedJob?.id === job.id
                                            ? 'border-primary/30 bg-accent'
                                            : 'border-border hover:bg-muted'
                                    )}
                                    onClick={() => setSelectedJobId(job.id)}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <span className="truncate font-semibold text-foreground">
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
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
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
                                <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                                    No training jobs yet.
                                </p>
                            ) : null}
                        </div>
                    </CardBody>
                </Card>

                <div className="flex min-w-0 flex-col gap-5">
                    {selectedJob ? (
                        <Card className="border border-border shadow-sm">
                            <CardBody className="p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <Typography variant="h5" color="blue-gray">
                                            {selectedJob.name}
                                        </Typography>
                                        <p className="mt-1 text-sm text-muted-foreground">
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
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        color="blue-gray"
                                                        variant="text"
                                                        className="flex items-center gap-2"
                                                        disabled={deleteMutation.isPending}
                                                    >
                                                        <TrashIcon className="h-4 w-4" /> Delete
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete training job?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Delete “{selectedJob.name}” and its
                                                            logs? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            variant="destructive"
                                                            onClick={() =>
                                                                deleteMutation.mutate(
                                                                    selectedJob.id
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                    {selectedJob.stages.map((stage) => (
                                        <div
                                            key={stage.key}
                                            className="rounded-lg bg-muted px-3 py-2 text-xs"
                                        >
                                            <p className="font-medium text-foreground">
                                                {stage.key.replaceAll('_', ' ')}
                                            </p>
                                            <p className="mt-0.5 capitalize text-muted-foreground">
                                                {stage.status}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                {selectedJob.error ? (
                                    <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                                        {selectedJob.error}
                                    </p>
                                ) : null}
                            </CardBody>
                        </Card>
                    ) : null}

                    <Card className="overflow-hidden border border-border shadow-sm">
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
