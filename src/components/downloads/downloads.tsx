import { cn } from '../../utils/cn'
import { downloadFamilies, downloadModels, type DownloadModel } from './catalog'
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    FolderIcon,
    MagnifyingGlassIcon,
    StopIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardBody, Input, Option, Select, Typography } from '@material-tailwind/react'
import { useEffect, useMemo, useState } from 'react'

type DownloadStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

type DownloadJob = {
    id: string
    script_id: string
    status: DownloadStatus
    progress?: number
    current_file?: string
    message?: string
    error?: string
}

type ApiError = {
    detail?: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
const activeStatuses: DownloadStatus[] = ['queued', 'running']

const isActive = (job?: DownloadJob) => job && activeStatuses.includes(job.status)

const readResponse = async <T,>(response: Response): Promise<T> => {
    const data = (await response.json().catch(() => null)) as T | ApiError | null

    if (!response.ok) {
        const detail =
            data && typeof data === 'object' && 'detail' in data
                ? (data as ApiError).detail
                : undefined
        throw new Error(detail || `Request failed with status ${response.status}`)
    }

    return data as T
}

const jobStyles: Record<DownloadStatus, string> = {
    queued: 'bg-amber-50 text-amber-800 ring-amber-200',
    running: 'bg-blue-50 text-blue-800 ring-blue-200',
    completed: 'bg-green-50 text-green-800 ring-green-200',
    failed: 'bg-red-50 text-red-800 ring-red-200',
    cancelled: 'bg-gray-100 text-gray-700 ring-gray-200'
}

type DownloadRowProps = {
    model: DownloadModel
    job?: DownloadJob
    starting: boolean
    destination: string
    onStart: (model: DownloadModel) => void
    onCancel: (model: DownloadModel, job: DownloadJob) => void
}

const DownloadRow = ({
    model,
    job,
    starting,
    destination,
    onStart,
    onCancel
}: DownloadRowProps) => {
    const active = isActive(job)
    const progress = Math.min(100, Math.max(0, job?.progress ?? 0))

    return (
        <article className="[content-visibility:auto]">
            <Card className="border border-blue-gray-100 shadow-sm">
                <CardBody className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <Typography variant="h5" color="blue-gray">
                                {model.name}
                            </Typography>
                            <span className="rounded bg-blue-gray-50 px-2 py-1 text-xs font-semibold text-blue-gray-700">
                                {model.task}
                            </span>
                            <span className="rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
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
                        <p className="mt-2 text-sm text-blue-gray-700">{model.description}</p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-blue-gray-600">
                            <span className="font-mono">{model.script}</span>
                            <span>{model.files.length} output files</span>
                            {model.trainingScripts ? (
                                <span>Used by {model.trainingScripts.join(', ')}</span>
                            ) : null}
                        </div>
                        <details className="mt-3 text-sm text-blue-gray-700">
                            <summary className="cursor-pointer select-none font-medium text-blue-gray-800">
                                Files and paths
                            </summary>
                            <ul className="mt-2 space-y-1 border-l-2 border-blue-gray-100 pl-3 font-mono text-xs">
                                {model.files.map((file) => (
                                    <li className="break-all" key={file}>
                                        {file}
                                    </li>
                                ))}
                            </ul>
                        </details>
                        {model.note ? (
                            <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                {model.note}
                            </p>
                        ) : null}
                        {job?.message || job?.current_file ? (
                            <p className="mt-3 truncate text-xs text-blue-gray-600">
                                {job.message || job.current_file}
                            </p>
                        ) : null}
                        {job?.error ? (
                            <p className="mt-3 flex items-start gap-2 text-sm text-red-700">
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
                                className="mt-3 h-2 overflow-hidden rounded bg-blue-gray-100"
                            >
                                <div
                                    className="h-full bg-blue-600 transition-[width]"
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
                                title={`Cancel ${model.name} download`}
                                className="flex min-h-11 flex-1 items-center justify-center gap-2 px-5 py-3 text-sm xl:w-full"
                                onClick={() => onCancel(model, job)}
                            >
                                <StopIcon className="h-5 w-5" />
                                Cancel
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                color="blue"
                                size="sm"
                                disabled={starting || !destination.trim()}
                                title={`Download ${model.name}`}
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
                                {starting
                                    ? 'Starting'
                                    : job?.status === 'completed'
                                      ? 'Download again'
                                      : job?.status === 'failed' || job?.status === 'cancelled'
                                        ? 'Retry'
                                        : 'Download'}
                            </Button>
                        )}
                    </div>
                </CardBody>
            </Card>
        </article>
    )
}

const Downloads = () => {
    const [destination, setDestination] = useState('.')
    const [query, setQuery] = useState('')
    const [family, setFamily] = useState(downloadFamilies[0])
    const [jobs, setJobs] = useState<Record<string, DownloadJob>>({})
    const [startingId, setStartingId] = useState<string>()
    const [requestError, setRequestError] = useState<string>()

    const visibleModels = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return downloadModels.filter((model) => {
            const matchesFamily = family === downloadFamilies[0] || model.family === family
            const matchesQuery =
                !normalizedQuery ||
                [model.name, model.family, model.task, model.precision, model.script].some(
                    (value) => value.toLowerCase().includes(normalizedQuery)
                )

            return matchesFamily && matchesQuery
        })
    }, [family, query])

    const activeJobIds = Object.values(jobs)
        .filter((job) => isActive(job))
        .map((job) => job.id)
        .sort()
        .join(',')

    useEffect(() => {
        if (!activeJobIds) return

        const pollJobs = async () => {
            const ids = activeJobIds.split(',')
            const results = await Promise.allSettled(
                ids.map(async (id) => {
                    const response = await fetch(`${API_BASE_URL}/api/downloads/${id}`)
                    return readResponse<DownloadJob>(response)
                })
            )

            setJobs((current) => {
                const next = { ...current }
                results.forEach((result) => {
                    if (result.status === 'fulfilled') {
                        next[result.value.script_id] = result.value
                    }
                })
                return next
            })
        }

        const interval = window.setInterval(pollJobs, 1500)
        return () => window.clearInterval(interval)
    }, [activeJobIds])

    const startDownload = async (model: DownloadModel) => {
        setRequestError(undefined)
        setStartingId(model.id)

        try {
            const response = await fetch(`${API_BASE_URL}/api/downloads`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script_id: model.id,
                    destination: destination.trim()
                })
            })
            const job = await readResponse<DownloadJob>(response)
            setJobs((current) => ({ ...current, [model.id]: job }))
        } catch (error) {
            setRequestError(
                error instanceof Error
                    ? error.message
                    : 'The download service could not be reached.'
            )
        } finally {
            setStartingId(undefined)
        }
    }

    const cancelDownload = async (model: DownloadModel, job: DownloadJob) => {
        setRequestError(undefined)

        try {
            const response = await fetch(`${API_BASE_URL}/api/downloads/${job.id}/cancel`, {
                method: 'POST'
            })
            const cancelledJob = await readResponse<DownloadJob>(response)
            setJobs((current) => ({ ...current, [model.id]: cancelledJob }))
        } catch (error) {
            setRequestError(
                error instanceof Error ? error.message : 'The download could not be cancelled.'
            )
        }
    }

    const completedCount = Object.values(jobs).filter((job) => job.status === 'completed').length

    return (
        <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 p-3 pb-10 sm:p-5 sm:pb-10">
            <header className="px-1 py-3 sm:px-2">
                <Typography variant="h1" color="blue-gray">
                    Model downloads
                </Typography>
                <p className="mt-1 text-sm text-blue-gray-600">
                    Download complete model bundles used by the training scripts.
                </p>
            </header>

            <Card className="border border-blue-gray-100 shadow-sm">
                <CardBody className="p-5 sm:p-6">
                    <div className="grid gap-5 lg:grid-cols-[minmax(18rem,1fr)_minmax(14rem,0.6fr)]">
                        <Input
                            type="text"
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
                                label="Search model bundles"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                icon={<MagnifyingGlassIcon className="h-5 w-5" />}
                                placeholder="Model, task, precision, or script name"
                            />
                        </div>
                        <div className="flex shrink-0 items-center gap-4 text-sm text-blue-gray-600">
                            <span>{visibleModels.length} bundles</span>
                            {completedCount ? (
                                <span className="flex items-center gap-1.5 text-green-700">
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
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                    <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Download service error</p>
                        <p className="mt-1">{requestError}</p>
                    </div>
                </div>
            ) : null}

            <section className="grid gap-3" aria-label="Available model downloads">
                {visibleModels.map((model) => (
                    <DownloadRow
                        key={model.id}
                        model={model}
                        job={jobs[model.id]}
                        starting={startingId === model.id}
                        destination={destination}
                        onStart={startDownload}
                        onCancel={cancelDownload}
                    />
                ))}
            </section>

            {visibleModels.length === 0 ? (
                <div className="rounded-lg border border-dashed border-blue-gray-200 py-16 text-center text-sm text-blue-gray-600">
                    No download bundles match the current filters.
                </div>
            ) : null}
        </main>
    )
}

export default Downloads
