import { type DownloadJob, type DownloadStatus, downloadsApi, queryKeys } from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
import useDownloadSettings from '../../hooks/useDownloadSettings'
import { downloadFamilies, downloadModels, type DownloadModel } from './catalog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Button, Card, CardBody, Input, Option, Select, Typography } from '@/components/ui/legacy'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    DownloadIcon as ArrowDownTrayIcon,
    RefreshCwIcon as ArrowPathIcon,
    CircleCheckIcon as CheckCircleIcon,
    CircleAlertIcon as ExclamationCircleIcon,
    FolderIcon,
    SearchIcon as MagnifyingGlassIcon,
    SquareIcon as StopIcon
} from 'lucide-react'
import { useMemo, useState } from 'react'

const activeStatuses: DownloadStatus[] = ['queued', 'running']
const MAX_DOWNLOAD_STATUS_LENGTH = 120

const isActive = (job?: DownloadJob) => job && activeStatuses.includes(job.status)

const updateJobList = (jobs: DownloadJob[] | undefined, updatedJob: DownloadJob) => {
    const currentJobs = jobs ?? []
    const existingIndex = currentJobs.findIndex((job) => job.id === updatedJob.id)

    if (existingIndex === -1) {
        return [updatedJob, ...currentJobs]
    }

    return currentJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
}

const truncateDownloadStatus = (status: string) =>
    status.length > MAX_DOWNLOAD_STATUS_LENGTH
        ? `${status.slice(0, MAX_DOWNLOAD_STATUS_LENGTH - 1).trimEnd()}…`
        : status

const jobStyles: Record<DownloadStatus, string> = {
    queued: 'bg-warning-muted text-warning-foreground ring-warning-border',
    running: 'bg-accent text-accent-foreground ring-primary/20',
    completed: 'bg-success-muted text-success-foreground ring-success-border',
    failed: 'bg-destructive/10 text-destructive ring-destructive/20',
    cancelled: 'bg-muted text-muted-foreground ring-border'
}

type DownloadRowProps = {
    model: DownloadModel
    job?: DownloadJob
    starting: boolean
    cancelling: boolean
    cancelDisabled: boolean
    destination: string
    onStart: (model: DownloadModel) => void
    onCancel: (model: DownloadModel, job: DownloadJob) => void
}

const DownloadRow = ({
    model,
    job,
    starting,
    cancelling,
    cancelDisabled,
    destination,
    onStart,
    onCancel
}: DownloadRowProps) => {
    const active = isActive(job)
    const progress = Math.min(100, Math.max(0, job?.progress ?? 0))
    const downloadStatus = job?.message || job?.current_file
    const startLabel = starting
        ? 'Starting…'
        : job?.status === 'completed'
          ? 'Download again'
          : job?.status === 'failed' || job?.status === 'cancelled'
            ? 'Retry'
            : 'Download'
    const cancelLabel = cancelling ? 'Cancelling…' : 'Cancel'

    return (
        <article>
            <Card className="border border-border shadow-sm">
                <CardBody className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Typography as="h2" variant="h5" color="blue-gray" translate="no">
                                {model.name}
                            </Typography>
                            <span className="rounded bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                                {model.task}
                            </span>
                            <span className="rounded bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground">
                                {model.precision}
                            </span>
                            {job ? (
                                <span
                                    className={cn(
                                        'rounded px-2 py-1 text-xs font-semibold capitalize ring-1 ring-inset',
                                        jobStyles[job.status]
                                    )}
                                >
                                    {job.status}
                                </span>
                            ) : null}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{model.description}</p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                            <span>{model.files.length} output files</span>
                            {model.trainingScripts ? (
                                <span>
                                    Used by{' '}
                                    <span translate="no">{model.trainingScripts.join(', ')}</span>
                                </span>
                            ) : null}
                        </div>
                        <details className="mt-3 text-sm text-muted-foreground">
                            <summary className="cursor-pointer select-none font-medium text-foreground">
                                Files and paths
                            </summary>
                            <ul className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-3 font-mono text-xs">
                                {model.files.map((file) => (
                                    <li className="break-all" key={file} translate="no">
                                        {file}
                                    </li>
                                ))}
                            </ul>
                        </details>
                        {model.note ? (
                            <p className="mt-3 rounded bg-warning-muted px-3 py-2 text-xs text-warning-foreground">
                                {model.note}
                            </p>
                        ) : null}
                        {downloadStatus ? (
                            <p
                                className="mt-3 w-full min-w-0 max-w-full truncate text-xs text-muted-foreground"
                                title={downloadStatus}
                                aria-label={downloadStatus}
                                translate={job?.message ? undefined : 'no'}
                            >
                                {truncateDownloadStatus(downloadStatus)}
                            </p>
                        ) : null}
                        {job?.error ? (
                            <p
                                role="alert"
                                className="mt-3 flex items-start gap-2 text-sm text-destructive"
                            >
                                <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{job.error}</span>
                            </p>
                        ) : null}
                        {job?.status === 'running' && job.progress !== undefined ? (
                            <div
                                role="progressbar"
                                aria-label={`${model.name} download progress`}
                                aria-valuenow={Math.round(progress)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                className="mt-3 h-2 overflow-hidden rounded bg-muted"
                            >
                                <div
                                    className="h-full bg-primary transition-[width] motion-reduce:transition-none"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        ) : null}
                    </div>
                    <div className="flex w-full shrink-0 gap-3 sm:w-auto xl:w-44 xl:flex-col">
                        {active && job ? (
                            <Button
                                type="button"
                                color="red"
                                variant="outlined"
                                size="sm"
                                title={`${cancelLabel} ${model.name}`}
                                aria-label={`${cancelLabel} ${model.name}`}
                                disabled={cancelDisabled}
                                loading={cancelling}
                                className="flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-3 text-sm xl:w-full"
                                onClick={() => onCancel(model, job)}
                            >
                                {cancelling ? null : <StopIcon className="h-5 w-5" />}
                                {cancelLabel}
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                color="blue"
                                size="sm"
                                disabled={starting || !destination.trim()}
                                title={`${startLabel} ${model.name}`}
                                aria-label={`${startLabel} ${model.name}`}
                                className="flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-3 text-sm xl:w-full"
                                onClick={() => onStart(model)}
                            >
                                {starting ? (
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : job?.status === 'completed' ? (
                                    <ArrowPathIcon className="h-5 w-5" />
                                ) : (
                                    <ArrowDownTrayIcon className="h-5 w-5" />
                                )}
                                {startLabel}
                            </Button>
                        )}
                    </div>
                </CardBody>
            </Card>
        </article>
    )
}

const Downloads = () => {
    const queryClient = useQueryClient()
    const hfToken = useDownloadSettings((state) => state.hfToken)
    const [destination, setDestination] = useState('.')
    const [query, setQuery] = useState('')
    const [family, setFamily] = useState(downloadFamilies[0])
    const [cancelTarget, setCancelTarget] = useState<{
        model: DownloadModel
        job: DownloadJob
    } | null>(null)

    const visibleModels = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return downloadModels.filter((model) => {
            const matchesFamily = family === downloadFamilies[0] || model.family === family
            const matchesQuery =
                !normalizedQuery ||
                [model.name, model.family, model.task, model.precision].some((value) =>
                    value.toLowerCase().includes(normalizedQuery)
                )

            return matchesFamily && matchesQuery
        })
    }, [family, query])

    const downloadsQuery = useQuery({
        queryKey: queryKeys.downloads,
        queryFn: downloadsApi.list,
        refetchOnMount: 'always',
        refetchInterval: (downloadQuery) =>
            downloadQuery.state.data?.some((job) => isActive(job)) ? 1_500 : false
    })
    const jobs = (downloadsQuery.data ?? []).reduce<Record<string, DownloadJob>>(
        (jobsByModel, job) => {
            if (!jobsByModel[job.script_id]) {
                jobsByModel[job.script_id] = job
            }
            return jobsByModel
        },
        {}
    )

    const startMutation = useMutation({
        mutationFn: ({ model }: { model: DownloadModel }) =>
            downloadsApi.start(model.id, destination.trim(), hfToken),
        onSuccess: (job) =>
            queryClient.setQueryData<DownloadJob[]>(queryKeys.downloads, (jobs) =>
                updateJobList(jobs, job)
            )
    })

    const cancelMutation = useMutation({
        mutationFn: ({ job }: { model: DownloadModel; job: DownloadJob }) =>
            downloadsApi.cancel(job.id),
        onSuccess: (job) =>
            queryClient.setQueryData<DownloadJob[]>(queryKeys.downloads, (jobs) =>
                updateJobList(jobs, job)
            )
    })

    const startDownload = (model: DownloadModel) => startMutation.mutate({ model })
    const cancelDownload = (model: DownloadModel, job: DownloadJob) => {
        if (cancelMutation.isPending) return
        setCancelTarget({ model, job })
    }

    const requestError = downloadsQuery.error
        ? getApiErrorMessage(downloadsQuery.error, 'The download list could not be loaded.')
        : startMutation.error
          ? getApiErrorMessage(startMutation.error, 'The download could not be started.')
          : cancelMutation.error
            ? getApiErrorMessage(cancelMutation.error, 'The download could not be cancelled.')
            : undefined
    const startingId = startMutation.isPending ? startMutation.variables.model.id : undefined

    const completedCount = Object.values(jobs).filter((job) => job.status === 'completed').length

    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-3 pb-10 sm:p-5 sm:pb-10">
            <header className="px-1 py-3 sm:px-2">
                <Typography variant="h1" color="blue-gray">
                    Model downloads
                </Typography>
                <p className="mt-1 text-sm text-muted-foreground">
                    Download complete model bundles used by the training scripts.
                </p>
            </header>

            <Card className="border border-border shadow-sm">
                <CardBody className="p-5 sm:p-6">
                    <div className="grid gap-5 lg:grid-cols-[minmax(18rem,1fr)_minmax(14rem,0.6fr)]">
                        <Input
                            type="text"
                            name="destination"
                            autoComplete="off"
                            spellCheck={false}
                            translate="no"
                            size="lg"
                            label="Destination root"
                            value={destination}
                            onChange={(event) => setDestination(event.target.value)}
                            icon={<FolderIcon className="h-5 w-5" />}
                            placeholder="/workspace"
                            containerProps={{ className: 'min-w-0' }}
                        />
                        <Select
                            size="lg"
                            label="Model family"
                            value={family}
                            onChange={(value) => setFamily(value ?? downloadFamilies[0])}
                        >
                            {downloadFamilies.map((option) => (
                                <Option key={option} value={option}>
                                    {option}
                                </Option>
                            ))}
                        </Select>
                    </div>
                    <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="w-full max-w-xl">
                            <Input
                                type="search"
                                name="search"
                                autoComplete="off"
                                label="Search model bundles"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                placeholder="Model, task, precision, or script name…"
                            />
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
                            <span>{visibleModels.length} bundles</span>
                            {completedCount ? (
                                <span className="flex items-center gap-1.5 text-success-foreground">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    {completedCount} completed
                                </span>
                            ) : null}
                        </div>
                    </div>
                </CardBody>
            </Card>

            {requestError ? (
                <div
                    role="alert"
                    className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
                >
                    <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Download service error</p>
                        <p className="mt-1">{requestError}</p>
                    </div>
                </div>
            ) : null}

            <section className="grid gap-3" aria-label="Available model downloads">
                {visibleModels.map((model) => {
                    const job = jobs[model.id]
                    return (
                        <DownloadRow
                            key={model.id}
                            model={model}
                            job={job}
                            starting={startingId === model.id}
                            cancelling={
                                cancelMutation.isPending &&
                                cancelMutation.variables?.job.id === job?.id
                            }
                            cancelDisabled={cancelMutation.isPending}
                            destination={destination}
                            onStart={startDownload}
                            onCancel={cancelDownload}
                        />
                    )
                })}
            </section>

            {visibleModels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
                    No download bundles match the current filters.
                </div>
            ) : null}

            <AlertDialog
                open={cancelTarget !== null}
                onOpenChange={(open) => {
                    if (!open) setCancelTarget(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel download?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cancel the download for “
                            <span translate="no">{cancelTarget?.model.name}</span>”?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep downloading</AlertDialogCancel>
                        <AlertDialogAction
                            variant="destructive"
                            disabled={cancelMutation.isPending}
                            onClick={() => {
                                if (!cancelTarget || cancelMutation.isPending) return
                                cancelMutation.mutate(cancelTarget)
                            }}
                        >
                            Cancel download
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </main>
    )
}

export default Downloads
