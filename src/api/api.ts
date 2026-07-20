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
    additionalOptions: string
    files: File[]
    captions: string[]
    captionFiles?: File[]
    controlFiles?: File[]
    existingFiles?: Array<{ path: string; caption: string }>
    existingControlFiles?: string[]
}

export type ManagedUploadProgress = {
    phase: 'uploading' | 'finalizing'
    completedFiles: number
    totalFiles: number
    currentFile?: string
    uploadedBytes: number
    totalBytes: number
    percent: number
}

export type CreateManagedDatasetInput = {
    name: string
    description?: string
    batchSize: number
    enableBucket: boolean
    bucketNoUpscale: boolean
    datasets: ManagedDatasetInput[]
    onProgress?: (progress: ManagedUploadProgress) => void
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

type StagedFileKind = 'file_tokens' | 'caption_file_tokens' | 'control_file_tokens'

const managedDatasetSpecs = (input: CreateManagedDatasetInput) =>
    input.datasets.map((dataset) => ({
        media_type: dataset.mediaType,
        resolution: dataset.resolution,
        num_repeats: dataset.numRepeats,
        ...(dataset.targetFrames ? { target_frames: dataset.targetFrames } : {}),
        additional_options: dataset.additionalOptions,
        captions: dataset.captions,
        existing_files: dataset.existingFiles ?? [],
        existing_control_files: dataset.existingControlFiles ?? [],
        file_count: dataset.files.length,
        caption_file_count: dataset.captionFiles?.length ?? 0,
        control_file_count: dataset.controlFiles?.length ?? 0
    }))

const managedFiles = (input: CreateManagedDatasetInput) =>
    input.datasets.flatMap((dataset) => [
        ...dataset.files.map((file) => ({ file, kind: 'file_tokens' as const })),
        ...(dataset.captionFiles ?? []).map((file) => ({
            file,
            kind: 'caption_file_tokens' as const
        })),
        ...(dataset.controlFiles ?? []).map((file) => ({
            file,
            kind: 'control_file_tokens' as const
        }))
    ])

const uploadManagedSequentially = async (
    input: CreateManagedDatasetInput,
    finalize: (sessionId: string, payload: Record<string, unknown>) => Promise<DatasetConfig>
) => {
    const session = (await apiClient.post<{ id: string }>('/api/datasets/managed/upload-sessions'))
        .data
    const uploads = managedFiles(input)
    const totalBytes = uploads.reduce((total, upload) => total + upload.file.size, 0)
    const tokens: Record<StagedFileKind, string[]> = {
        file_tokens: [],
        caption_file_tokens: [],
        control_file_tokens: []
    }
    let completedBytes = 0
    let finalized = false

    try {
        for (const [index, upload] of uploads.entries()) {
            const form = new FormData()
            form.append('file', upload.file)
            input.onProgress?.({
                phase: 'uploading',
                completedFiles: index,
                totalFiles: uploads.length,
                currentFile: upload.file.name,
                uploadedBytes: completedBytes,
                totalBytes,
                percent: totalBytes ? (completedBytes / totalBytes) * 100 : 0
            })
            const staged = (
                await apiClient.post<{ token: string }>(
                    `/api/datasets/managed/upload-sessions/${session.id}/files`,
                    form,
                    {
                        timeout: 0,
                        onUploadProgress: (event) => {
                            const ratio = event.total ? Math.min(1, event.loaded / event.total) : 0
                            const currentBytes = Math.round(upload.file.size * ratio)
                            const uploadedBytes = completedBytes + currentBytes
                            input.onProgress?.({
                                phase: 'uploading',
                                completedFiles: index,
                                totalFiles: uploads.length,
                                currentFile: upload.file.name,
                                uploadedBytes,
                                totalBytes,
                                percent: totalBytes ? (uploadedBytes / totalBytes) * 100 : 0
                            })
                        }
                    }
                )
            ).data
            tokens[upload.kind].push(staged.token)
            completedBytes += upload.file.size
            input.onProgress?.({
                phase: 'uploading',
                completedFiles: index + 1,
                totalFiles: uploads.length,
                currentFile: upload.file.name,
                uploadedBytes: completedBytes,
                totalBytes,
                percent: totalBytes ? (completedBytes / totalBytes) * 100 : 100
            })
        }

        input.onProgress?.({
            phase: 'finalizing',
            completedFiles: uploads.length,
            totalFiles: uploads.length,
            uploadedBytes: completedBytes,
            totalBytes,
            percent: 100
        })
        const dataset = await finalize(session.id, {
            name: input.name,
            description: input.description,
            batch_size: input.batchSize,
            enable_bucket: input.enableBucket,
            bucket_no_upscale: input.bucketNoUpscale,
            dataset_specs: managedDatasetSpecs(input),
            ...tokens
        })
        finalized = true
        return dataset
    } finally {
        if (!finalized) {
            await apiClient
                .delete(`/api/datasets/managed/upload-sessions/${session.id}`)
                .catch(() => undefined)
        }
    }
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
    createManaged: async (input: CreateManagedDatasetInput) =>
        uploadManagedSequentially(
            input,
            async (sessionId, payload) =>
                (
                    await apiClient.post<DatasetConfig>(
                        `/api/datasets/managed/upload-sessions/${sessionId}/finalize`,
                        payload,
                        { timeout: 0 }
                    )
                ).data
        ),
    updateManaged: async (input: UpdateManagedDatasetInput) =>
        uploadManagedSequentially(
            input,
            async (sessionId, payload) =>
                (
                    await apiClient.put<DatasetConfig>(
                        `/api/datasets/managed/upload-sessions/${sessionId}/datasets/${input.configId}/finalize`,
                        payload,
                        { timeout: 0 }
                    )
                ).data
        ),
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
