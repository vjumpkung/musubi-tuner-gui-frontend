import { apiClient } from './client'

export type DownloadStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type DownloadJob = {
    id: string
    script_id: string
    status: DownloadStatus
    progress?: number
    current_file?: string
    message?: string
    error?: string
}

export type DatasetSummary = {
    id: string
    name: string
    description?: string | null
    created_at: string
    updated_at: string
}

export type DatasetConfig = DatasetSummary & {
    general: Record<string, unknown>
    datasets: Array<Record<string, unknown>>
    warnings?: string[]
    managed?: boolean
}

export type ManagedDatasetFile = {
    path: string
    name: string
    size_bytes: number
    caption: string
}

export type ManagedControlFile = Omit<ManagedDatasetFile, 'caption'>

export type ManagedDatasetManifest = {
    datasets: Array<{
        index: number
        media_type: 'image' | 'video'
        files: ManagedDatasetFile[]
        control_files: ManagedControlFile[]
    }>
}

export type ManagedDatasetInput = {
    mediaType: 'image' | 'video'
    resolution: [number, number]
    numRepeats: number
    targetFrames?: number[]
    files: File[]
    captions: string[]
    captionFiles?: File[]
    controlFiles?: File[]
    existingFiles?: Array<{ path: string; caption: string }>
    existingControlFiles?: string[]
}

export type CreateManagedDatasetInput = {
    name: string
    description?: string
    datasets: ManagedDatasetInput[]
}

export type UpdateManagedDatasetInput = CreateManagedDatasetInput & {
    configId: string
}

export type TrainingJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type TrainingStage = {
    key: 'cache_latents' | 'cache_text_encoder' | 'train'
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'skipped'
}

export type TrainingJob = {
    id: string
    name: string
    profile_id: string
    dataset_config_id?: string | null
    status: TrainingJobStatus
    queue_position?: number | null
    current_stage?: TrainingStage['key'] | null
    stages: TrainingStage[]
    progress: {
        epoch?: number | null
        total_epochs?: number | null
        step?: number | null
        total_steps?: number | null
        percent?: number | null
    }
    error?: string | null
    created_at: string
    started_at?: string | null
    finished_at?: string | null
}

export type QueueStatus = {
    state: 'running' | 'paused'
    queued: number
    running_job_id?: string | null
}

export type TrainingLogChunk = {
    offset: number
    next_offset: number
    content: string
    eof: boolean
}

export type TrainingArtifact = {
    name: string
    size_bytes: number
    epoch: number | null
    kind: 'epoch' | 'checkpoint' | 'final'
}

export type TrainingArtifacts = {
    files: TrainingArtifact[]
    total_size_bytes: number
}

export type GpuResourceUsage = {
    index: number
    name: string
    utilization_percent: number | null
    memory_used_bytes: number | null
    memory_total_bytes: number | null
    memory_percent: number | null
    temperature_c: number | null
}

export type SystemResourceSnapshot = {
    timestamp: string
    cpu: {
        percent: number
        logical_cores: number | null
        physical_cores: number | null
    }
    ram: {
        percent: number
        used_bytes: number
        available_bytes: number
        total_bytes: number
    }
    gpus: GpuResourceUsage[]
    gpu_error: string | null
}

export const queryKeys = {
    datasets: ['datasets'] as const,
    downloads: ['downloads'] as const,
    download: (jobId: string) => ['downloads', jobId] as const,
    queue: ['training', 'queue'] as const,
    jobs: ['training', 'jobs'] as const,
    job: (jobId: string) => ['training', 'jobs', jobId] as const,
    artifacts: (jobId: string) => ['training', 'artifacts', jobId] as const,
    logs: (jobId: string) => ['training', 'logs', jobId] as const,
    systemResources: ['system', 'resources'] as const
}

export const downloadsApi = {
    start: async (scriptId: string, destination: string, hfToken?: string) =>
        (
            await apiClient.post<DownloadJob>('/api/downloads', {
                script_id: scriptId,
                destination,
                hf_token: hfToken?.trim() || undefined
            })
        ).data,
    get: async (jobId: string) =>
        (await apiClient.get<DownloadJob>(`/api/downloads/${jobId}`)).data,
    cancel: async (jobId: string) =>
        (await apiClient.post<DownloadJob>(`/api/downloads/${jobId}/cancel`)).data
}

export const datasetsApi = {
    list: async () => (await apiClient.get<DatasetSummary[]>('/api/datasets')).data,
    get: async (configId: string) =>
        (await apiClient.get<DatasetConfig>(`/api/datasets/${configId}`)).data,
    getManagedFiles: async (configId: string) =>
        (await apiClient.get<ManagedDatasetManifest>(`/api/datasets/${configId}/managed-files`))
            .data,
    import: async (file: File, name?: string) => {
        const form = new FormData()
        form.append('file', file)
        if (name) form.append('name', name)
        return (await apiClient.post<DatasetConfig>('/api/datasets/import', form)).data
    },
    createManaged: async (input: CreateManagedDatasetInput) => {
        const form = new FormData()
        form.append('name', input.name)
        if (input.description) form.append('description', input.description)
        form.append(
            'dataset_specs',
            JSON.stringify(
                input.datasets.map((dataset) => ({
                    media_type: dataset.mediaType,
                    resolution: dataset.resolution,
                    num_repeats: dataset.numRepeats,
                    ...(dataset.targetFrames ? { target_frames: dataset.targetFrames } : {}),
                    captions: dataset.captions,
                    file_count: dataset.files.length,
                    caption_file_count: dataset.captionFiles?.length ?? 0,
                    control_file_count: dataset.controlFiles?.length ?? 0
                }))
            )
        )
        input.datasets.forEach((dataset) => {
            dataset.files.forEach((file) => form.append('files', file))
            dataset.captionFiles?.forEach((file) => form.append('caption_files', file))
            dataset.controlFiles?.forEach((file) => form.append('control_files', file))
        })

        return (
            await apiClient.post<DatasetConfig>('/api/datasets/managed/batch', form, {
                // Large video datasets can legitimately take much longer than the shared API timeout.
                timeout: 0
            })
        ).data
    },
    updateManaged: async (input: UpdateManagedDatasetInput) => {
        const form = new FormData()
        form.append('name', input.name)
        form.append('description', input.description ?? '')
        form.append(
            'dataset_specs',
            JSON.stringify(
                input.datasets.map((dataset) => ({
                    media_type: dataset.mediaType,
                    resolution: dataset.resolution,
                    num_repeats: dataset.numRepeats,
                    ...(dataset.targetFrames ? { target_frames: dataset.targetFrames } : {}),
                    captions: dataset.captions,
                    existing_files: dataset.existingFiles ?? [],
                    existing_control_files: dataset.existingControlFiles ?? [],
                    file_count: dataset.files.length,
                    caption_file_count: dataset.captionFiles?.length ?? 0,
                    control_file_count: dataset.controlFiles?.length ?? 0
                }))
            )
        )
        input.datasets.forEach((dataset) => {
            dataset.files.forEach((file) => form.append('files', file))
            dataset.captionFiles?.forEach((file) => form.append('caption_files', file))
            dataset.controlFiles?.forEach((file) => form.append('control_files', file))
        })

        return (
            await apiClient.put<DatasetConfig>(`/api/datasets/${input.configId}/managed`, form, {
                timeout: 0
            })
        ).data
    },
    remove: async (configId: string) => {
        await apiClient.delete(`/api/datasets/${configId}`)
    },
    validate: async (configId: string) =>
        (await apiClient.post(`/api/datasets/${configId}/validate`)).data,
    exportUrl: (configId: string) =>
        `${String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}/api/datasets/${configId}/export`
}

export const trainingApi = {
    getQueue: async () => (await apiClient.get<QueueStatus>('/api/training/queue')).data,
    startQueue: async () => (await apiClient.post<QueueStatus>('/api/training/queue/start')).data,
    pauseQueue: async () => (await apiClient.post<QueueStatus>('/api/training/queue/pause')).data,
    listJobs: async () => (await apiClient.get<TrainingJob[]>('/api/training/jobs')).data,
    getJob: async (jobId: string) =>
        (await apiClient.get<TrainingJob>(`/api/training/jobs/${jobId}`)).data,
    createJob: async (payload: {
        name: string
        profile_id: string
        dataset_config_id: string
        skip_cache_stages: boolean
        values: Record<string, string | boolean>
    }) => (await apiClient.post<TrainingJob>('/api/training/jobs', payload)).data,
    getLogs: async (jobId: string, offset: number) =>
        (
            await apiClient.get<TrainingLogChunk>(`/api/training/jobs/${jobId}/logs`, {
                params: { offset }
            })
        ).data,
    getArtifacts: async (jobId: string) =>
        (await apiClient.get<TrainingArtifacts>(`/api/training/jobs/${jobId}/artifacts`)).data,
    artifactDownloadUrl: (jobId: string, artifactName: string) =>
        `${String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}/api/training/jobs/${encodeURIComponent(jobId)}/artifacts/${encodeURIComponent(artifactName)}/download`,
    artifactsDownloadUrl: (jobId: string) =>
        `${String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}/api/training/jobs/${encodeURIComponent(jobId)}/artifacts/download`,
    configDownloadUrl: (jobId: string) =>
        `${String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')}/api/training/jobs/${encodeURIComponent(jobId)}/config/download`,
    cancel: async (jobId: string) =>
        (await apiClient.post<TrainingJob>(`/api/training/jobs/${jobId}/cancel`)).data,
    retry: async (jobId: string) =>
        (await apiClient.post<TrainingJob>(`/api/training/jobs/${jobId}/retry`)).data,
    reorder: async (jobId: string, queuePosition: number) =>
        (
            await apiClient.patch<TrainingJob>(`/api/training/jobs/${jobId}`, {
                queue_position: queuePosition
            })
        ).data,
    remove: async (jobId: string) => {
        await apiClient.delete(`/api/training/jobs/${jobId}`)
    }
}

export const systemApi = {
    getResources: async () =>
        (await apiClient.get<SystemResourceSnapshot>('/api/system/resources')).data
}
