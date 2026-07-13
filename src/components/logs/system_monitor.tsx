import { queryKeys, systemApi } from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
import { Card, CardBody, Progress, Typography } from '@/components/ui/legacy'
import { useQuery } from '@tanstack/react-query'
import { CpuIcon, GpuIcon, MemoryStickIcon, RefreshCwIcon } from 'lucide-react'
import { type ReactNode } from 'react'

const MONITOR_INTERVAL_MS = 5_000

const formatBytes = (bytes: number | null) => {
    if (bytes === null) return 'Unavailable'
    if (bytes < 1024) return `${bytes} B`
    const units = ['KB', 'MB', 'GB', 'TB']
    let value = bytes / 1024
    let unit = units[0]
    for (const nextUnit of units.slice(1)) {
        if (value < 1024) break
        value /= 1024
        unit = nextUnit
    }
    return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`
}

const clampPercent = (value: number | null) => Math.min(100, Math.max(0, value ?? 0))

type ResourceMeterProps = {
    label: string
    icon: ReactNode
    percent: number | null
    detail: string
    note: string
}

const ResourceMeter = ({ label, icon, percent, detail, note }: ResourceMeterProps) => (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
                <span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
                <p className="truncate text-sm font-semibold text-foreground">{label}</p>
            </div>
            <span className="text-2xl font-semibold tracking-tight text-foreground">
                {percent === null ? '—' : `${percent.toFixed(1)}%`}
            </span>
        </div>
        <Progress
            value={clampPercent(percent)}
            className="mt-4"
            aria-label={`${label} utilization`}
        />
        <div className="mt-3 flex items-end justify-between gap-3 text-xs">
            <span className="font-medium text-foreground">{detail}</span>
            <span className="text-right text-muted-foreground">{note}</span>
        </div>
    </div>
)

const SystemMonitor = () => {
    const resourcesQuery = useQuery({
        queryKey: queryKeys.systemResources,
        queryFn: systemApi.getResources,
        refetchInterval: MONITOR_INTERVAL_MS,
        refetchOnWindowFocus: false
    })
    const resources = resourcesQuery.data
    const updatedAt = resources ? new Date(resources.timestamp) : null
    const errorMessage = resourcesQuery.error
        ? getApiErrorMessage(resourcesQuery.error, 'System resource metrics could not be loaded.')
        : null

    return (
        <Card className="mb-5 border border-border shadow-sm">
            <CardBody className="p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Typography variant="h5" color="blue-gray">
                            System resources
                        </Typography>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Live host utilization while training jobs run.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <RefreshCwIcon
                            className={`h-4 w-4 ${resourcesQuery.isFetching ? 'animate-spin' : ''}`}
                        />
                        {updatedAt && !Number.isNaN(updatedAt.getTime())
                            ? `Updated ${updatedAt.toLocaleTimeString()} · every 5 seconds`
                            : 'Updates every 5 seconds'}
                    </div>
                </div>

                {errorMessage ? (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                        {errorMessage}
                    </p>
                ) : resources ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <ResourceMeter
                            label="CPU"
                            icon={<CpuIcon />}
                            percent={resources.cpu.percent}
                            detail={`${resources.cpu.logical_cores ?? '—'} logical cores`}
                            note={`${resources.cpu.physical_cores ?? '—'} physical cores`}
                        />
                        <ResourceMeter
                            label="RAM"
                            icon={<MemoryStickIcon />}
                            percent={resources.ram.percent}
                            detail={`${formatBytes(resources.ram.used_bytes)} used`}
                            note={`${formatBytes(resources.ram.total_bytes)} total`}
                        />
                        {resources.gpus.flatMap((gpu) => [
                            <ResourceMeter
                                key={`gpu-${gpu.index}`}
                                label={`GPU ${gpu.index} · ${gpu.name}`}
                                icon={<GpuIcon />}
                                percent={gpu.utilization_percent}
                                detail={
                                    gpu.temperature_c === null
                                        ? 'Temperature unavailable'
                                        : `${gpu.temperature_c.toFixed(0)} °C`
                                }
                                note="Compute utilization"
                            />,
                            <ResourceMeter
                                key={`vram-${gpu.index}`}
                                label={`VRAM ${gpu.index}`}
                                icon={<MemoryStickIcon />}
                                percent={gpu.memory_percent}
                                detail={`${formatBytes(gpu.memory_used_bytes)} used`}
                                note={`${formatBytes(gpu.memory_total_bytes)} total`}
                            />
                        ])}
                        {resources.gpus.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 sm:col-span-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <GpuIcon className="h-5 w-5 text-muted-foreground" />
                                    GPU and VRAM unavailable
                                </div>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    {resources.gpu_error ??
                                        'No supported GPU metrics were returned.'}
                                </p>
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                        Loading CPU, RAM, GPU, and VRAM metrics…
                    </p>
                )}
            </CardBody>
        </Card>
    )
}

export default SystemMonitor
