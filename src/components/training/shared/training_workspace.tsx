import { type TrainingJob, datasetsApi, queryKeys, trainingApi } from '../../../api/api'
import { getApiErrorMessage } from '../../../api/client'
import useAccelerationSettings, {
    type AccelerationSettings,
    defaultAccelerationSettings
} from '../../../hooks/useAccelerationSettings'
import useMenuBar, { Menu } from '../../../hooks/useMenubar'
import {
    type TrainingField,
    type TrainingProfile,
    type TrainingValue,
    type TrainingValues
} from '../profiles'
import {
    Accordion,
    AccordionBody,
    AccordionHeader,
    Button,
    Card,
    CardBody,
    Checkbox,
    Input,
    Option,
    Progress,
    Select,
    Typography
} from '@/components/ui/legacy'
import { cn } from '@/lib/utils'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    SlidersHorizontalIcon as AdjustmentsHorizontalIcon,
    DownloadIcon as ArrowDownTrayIcon,
    UploadIcon as ArrowUpTrayIcon,
    CircleCheckIcon as CheckCircleIcon,
    DatabaseIcon as CircleStackIcon,
    ClipboardIcon as ClipboardDocumentIcon,
    CloudUploadIcon as CloudArrowUpIcon,
    Code2Icon as CodeBracketIcon,
    CpuIcon as CpuChipIcon,
    BoxIcon as CubeTransparentIcon,
    FolderOpenIcon,
    InfoIcon as InformationCircleIcon,
    RocketIcon as RocketLaunchIcon
} from 'lucide-react'
import { type ChangeEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

const schedulerOptions = [
    'constant',
    'linear',
    'cosine',
    'cosine_with_restarts',
    'cosine_with_min_lr',
    'polynomial',
    'constant_with_warmup',
    'adafactor'
]

const optimizerOptions = [
    { label: 'AdamW 8-bit', value: 'adamw8bit' },
    { label: 'AdamW', value: 'adamw' },
    { label: 'Adafactor', value: 'torch.optim.Adafactor' },
    { label: 'Lion', value: 'pytorch-optimizer.Lion' },
    { label: 'Prodigy', value: 'pytorch-optimizer.Prodigy' }
]

const inputContainerProps = { className: '!min-w-0 w-full' }

const shellQuote = (value: string) => {
    if (/^[A-Za-z0-9_./:@+,-]+$/.test(value)) return value
    return `'${value.replace(/'/g, `'"'"'`)}'`
}

const joinCommand = (executable: string, args: string[]) => [executable, ...args].join(' \\\n    ')

const buildCommands = (
    profile: TrainingProfile,
    values: TrainingValues,
    accelerationSettings: AccelerationSettings
) => {
    const value = (key: string) => String(values[key] ?? '').trim()
    const enabled = (key: string) => values[key] === true
    const publishing = Boolean(value('huggingfaceRepoId'))
    const argument = (flag: string, key: string) =>
        value(key) ? [flag, shellQuote(value(key))] : []
    const script = (filename: string) =>
        `python ${shellQuote(`${value('musubiPath').replace(/\/$/, '')}/${filename}`)}`
    const matches = (when?: { key: string; value: TrainingValue }) =>
        !when || values[when.key] === when.value
    const commandOption = ({
        flag,
        key,
        value: fixedValue,
        enabledKey,
        when
    }: NonNullable<TrainingProfile['cacheCommands']>[number]['options'][number]) => {
        if (!matches(when)) return []
        if (enabledKey) return enabled(enabledKey) ? [flag] : []
        if (key) return argument(flag, key)
        if (fixedValue) return [flag, shellQuote(fixedValue)]
        return [flag]
    }

    let cacheCommands: string[] = []

    if (profile.id === 'hunyuan-video') {
        cacheCommands = [
            joinCommand(script('cache_latents.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--vae', 'vae'),
                ...argument('--vae_chunk_size', 'vaeChunkSize'),
                ...(enabled('vaeTiling') ? ['--vae_tiling'] : [])
            ]),
            joinCommand(script('cache_text_encoder_outputs.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--text_encoder1', 'textEncoder1'),
                ...argument('--text_encoder2', 'textEncoder2'),
                ...argument('--batch_size', 'cacheBatchSize'),
                ...(enabled('fp8Llm') ? ['--fp8_llm'] : [])
            ])
        ]
    }

    if (profile.id === 'framepack') {
        cacheCommands = [
            joinCommand(script('fpack_cache_latents.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--vae', 'vae'),
                ...argument('--image_encoder', 'imageEncoder'),
                ...argument('--vae_chunk_size', 'vaeChunkSize')
            ]),
            joinCommand(script('fpack_cache_text_encoder_outputs.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--text_encoder1', 'textEncoder1'),
                ...argument('--text_encoder2', 'textEncoder2'),
                ...argument('--batch_size', 'cacheBatchSize'),
                ...(enabled('fp8Llm') ? ['--fp8_llm'] : [])
            ])
        ]
    }

    if (profile.id === 'wan-22') {
        cacheCommands = [
            joinCommand(script('wan_cache_latents.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--vae', 'vae')
            ]),
            joinCommand(script('wan_cache_text_encoder_outputs.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--t5', 't5'),
                ...argument('--batch_size', 'cacheBatchSize')
            ])
        ]
    }

    if (profile.id === 'flux-kontext') {
        cacheCommands = [
            joinCommand(script('flux_kontext_cache_latents.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--vae', 'vae')
            ]),
            joinCommand(script('flux_kontext_cache_text_encoder_outputs.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--text_encoder1', 'textEncoder1'),
                ...argument('--text_encoder2', 'textEncoder2'),
                ...argument('--batch_size', 'cacheBatchSize')
            ])
        ]
    }

    if (profile.id === 'qwen-image') {
        cacheCommands = [
            joinCommand(script('qwen_image_cache_latents.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--vae', 'vae')
            ]),
            joinCommand(script('qwen_image_cache_text_encoder_outputs.py'), [
                ...argument('--dataset_config', 'datasetConfig'),
                ...argument('--text_encoder', 'textEncoder'),
                ...argument('--batch_size', 'cacheBatchSize')
            ])
        ]
    }

    if (profile.cacheCommands) {
        cacheCommands = profile.cacheCommands.map((command) =>
            joinCommand(script(command.script), command.options.flatMap(commandOption))
        )
    }

    const trainFields = [...profile.modelFields, ...(profile.advancedFields ?? [])]

    const trainArgs = [
        ...argument('--dataset_config', 'datasetConfig'),
        ...argument('--output_name', 'outputName'),
        ...argument('--output_dir', 'outputDir'),
        ...(profile.task ? argument('--task', 'task') : []),
        ...(profile.selectors ?? []).flatMap((field) =>
            field.trainFlag ? argument(field.trainFlag, field.key) : []
        ),
        ...trainFields.flatMap((field) =>
            field.trainFlag && matches(field.when) ? argument(field.trainFlag, field.key) : []
        ),
        '--network_module',
        profile.networkModule,
        ...argument('--optimizer_type', 'optimizer'),
        ...argument('--lr_scheduler', 'scheduler'),
        ...argument('--mixed_precision', 'mixedPrecision'),
        ...argument('--save_precision', 'savePrecision'),
        ...argument('--timestep_sampling', 'timestepSampling'),
        ...argument('--weighting_scheme', 'weightingScheme'),
        ...argument('--logging_dir', 'loggingDir'),
        ...argument('--max_train_epochs', 'epochs'),
        ...argument('--save_every_n_epochs', 'saveEvery'),
        ...argument('--network_dim', 'networkDim'),
        ...argument('--network_alpha', 'networkAlpha'),
        ...argument('--learning_rate', 'learningRate'),
        ...argument('--lr_warmup_steps', 'warmupSteps'),
        ...argument('--lr_scheduler_power', 'schedulerPower'),
        ...argument('--lr_scheduler_min_lr_ratio', 'schedulerMinRatio'),
        ...argument('--lr_scheduler_num_cycles', 'schedulerCycles'),
        ...argument('--blocks_to_swap', 'blocksToSwap'),
        ...argument('--discrete_flow_shift', 'flowShift'),
        ...argument('--seed', 'seed'),
        ...argument('--max_data_loader_n_workers', 'workers'),
        ...argument('--guidance_scale', 'guidanceScale'),
        ...argument('--timestep_boundary', 'timestepBoundary'),
        ...argument('--min_timestep', 'minTimestep'),
        ...argument('--max_timestep', 'maxTimestep'),
        ...(value('networkArgs')
            ? ['--network_args', ...value('networkArgs').split(/\s+/).map(shellQuote)]
            : []),
        ...(value('optimizerArgs')
            ? ['--optimizer_args', ...value('optimizerArgs').split(/\s+/).map(shellQuote)]
            : []),
        ...(enabled('gradientCheckpointing') ? ['--gradient_checkpointing'] : []),
        ...(enabled('persistentWorkers') ? ['--persistent_data_loader_workers'] : []),
        ...profile.memoryFlags.flatMap((flag) =>
            flag.train !== false && enabled(flag.key) ? [flag.flag] : []
        ),
        ...(profile.fixedTrainFlags ?? []),
        ...(value('attention') ? [`--${value('attention')}`] : []),
        ...(publishing ? argument('--huggingface_repo_id', 'huggingfaceRepoId') : []),
        ...(publishing ? argument('--huggingface_repo_type', 'huggingfaceRepoType') : []),
        ...(publishing ? argument('--huggingface_path_in_repo', 'huggingfacePath') : []),
        ...(publishing ? argument('--huggingface_token', 'huggingfaceToken') : []),
        ...(publishing ? argument('--huggingface_repo_visibility', 'huggingfaceVisibility') : []),
        ...(publishing && enabled('asyncUpload') ? ['--async_upload'] : []),
        ...(value('extraArgs') ? [value('extraArgs')] : [])
    ]

    const accelerate = joinCommand('accelerate launch', [
        `--dynamo_backend ${shellQuote(accelerationSettings.dynamoBackend || 'no')}`,
        `--dynamo_mode ${shellQuote(accelerationSettings.dynamoMode || 'default')}`,
        `--mixed_precision ${shellQuote(value('mixedPrecision'))}`,
        `--num_processes ${shellQuote(accelerationSettings.numProcesses || '1')}`,
        `--num_machines ${shellQuote(accelerationSettings.numMachines || '1')}`,
        `--num_cpu_threads_per_process ${shellQuote(
            accelerationSettings.numCpuThreadsPerProcess || String(profile.cpuThreads ?? 2)
        )}`,
        shellQuote(`${value('musubiPath').replace(/\/$/, '')}/${profile.trainer}`),
        ...trainArgs
    ])

    return [...cacheCommands, accelerate].join('\n\n')
}

type SectionCardProps = {
    number: number
    title: string
    description: string
    icon: ReactNode
    children: ReactNode
}

const SectionCard = ({ number, title, description, icon, children }: SectionCardProps) => (
    <Card className="border border-border shadow-sm">
        <CardBody className="p-5 sm:p-6">
            <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Section {number}
                    </p>
                    <Typography variant="h5" color="blue-gray">
                        {title}
                    </Typography>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </CardBody>
    </Card>
)

type TextFieldProps = {
    field: TrainingField
    value: string
    type?: 'text' | 'password'
    onChange: (value: string) => void
}

const TextField = ({ field, value, type = 'text', onChange }: TextFieldProps) => {
    const [touched, setTouched] = useState(false)
    const showError = Boolean(field.required && touched && !value.trim())

    return (
        <div className="min-w-0">
            <Input
                size="lg"
                type={type}
                containerProps={inputContainerProps}
                label={`${field.label}${field.required ? ' *' : ''}`}
                value={value}
                error={showError}
                onBlur={() => setTouched(true)}
                onChange={(event) => onChange(event.target.value)}
            />
            <p
                className={cn(
                    'mt-2 text-xs leading-5',
                    showError ? 'text-destructive' : 'text-muted-foreground'
                )}
            >
                {showError ? `${field.label} is required.` : field.helper}
            </p>
        </div>
    )
}

type NumberFieldProps = {
    label: string
    value: string
    helper?: string
    min?: number
    step?: string
    onChange: (value: string) => void
}

const NumberField = ({ label, value, helper, min, step, onChange }: NumberFieldProps) => (
    <div className="min-w-0">
        <Input
            type="number"
            size="lg"
            containerProps={inputContainerProps}
            label={label}
            value={value}
            min={min}
            step={step}
            onChange={(event) => onChange(event.target.value)}
        />
        {helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
    </div>
)

type TrainingWorkspaceProps = {
    profile: TrainingProfile
}

const trainingConfigSchema = 'musubi-tuner-gui.training-config'
const trainingDraftVersion = 1

type TrainingConfigFile = {
    schema: typeof trainingConfigSchema
    version: 1
    profileId: TrainingProfile['id']
    profileName: string
    exportedAt: string
    datasetConfigId?: string | null
    skipCacheStages?: boolean
    values: TrainingValues
    acceleration: AccelerationSettings
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)

const hasValidTrainingValues = (value: unknown): value is TrainingValues =>
    isRecord(value) &&
    Object.values(value).every((item) => typeof item === 'string' || typeof item === 'boolean')

const hasValidAccelerationSettings = (value: unknown): value is AccelerationSettings =>
    isRecord(value) &&
    Object.keys(defaultAccelerationSettings).every((key) => typeof value[key] === 'string')

type TrainingDraft = {
    version: typeof trainingDraftVersion
    values: TrainingValues
    selectedDatasetId: string
    skipCacheStages: boolean
    openAdvanced: boolean
    openPublishing: boolean
}

const trainingDraftStorageKey = (profileId: TrainingProfile['id']) =>
    `musubi-tuner-training-draft:${profileId}`

const defaultTrainingDraft = (profile: TrainingProfile): TrainingDraft => ({
    version: trainingDraftVersion,
    values: { ...profile.defaults },
    selectedDatasetId: '',
    skipCacheStages: false,
    openAdvanced: false,
    openPublishing: false
})

const readTrainingDraft = (profile: TrainingProfile): TrainingDraft => {
    const fallback = defaultTrainingDraft(profile)

    try {
        const serialized = window.sessionStorage.getItem(trainingDraftStorageKey(profile.id))
        if (!serialized) return fallback

        const parsed: unknown = JSON.parse(serialized)
        if (
            !isRecord(parsed) ||
            parsed.version !== trainingDraftVersion ||
            !hasValidTrainingValues(parsed.values)
        ) {
            return fallback
        }

        const allowedKeys = new Set(Object.keys(profile.defaults))
        const storedValues = Object.fromEntries(
            Object.entries(parsed.values).filter(([key]) => allowedKeys.has(key))
        ) as TrainingValues

        return {
            version: trainingDraftVersion,
            values: { ...profile.defaults, ...storedValues },
            selectedDatasetId:
                typeof parsed.selectedDatasetId === 'string' ? parsed.selectedDatasetId : '',
            skipCacheStages:
                typeof parsed.skipCacheStages === 'boolean' ? parsed.skipCacheStages : false,
            openAdvanced: typeof parsed.openAdvanced === 'boolean' ? parsed.openAdvanced : false,
            openPublishing:
                typeof parsed.openPublishing === 'boolean' ? parsed.openPublishing : false
        }
    } catch {
        return fallback
    }
}

const TrainingWorkspace = ({ profile }: TrainingWorkspaceProps) => {
    const queryClient = useQueryClient()
    const setMenuBar = useMenuBar((state) => state.setMenuBar)
    const initialDraft = useMemo(() => readTrainingDraft(profile), [profile])
    const [values, setValues] = useState<TrainingValues>(() => initialDraft.values)
    const [openAdvanced, setOpenAdvanced] = useState(initialDraft.openAdvanced)
    const [openPublishing, setOpenPublishing] = useState(initialDraft.openPublishing)
    const [copyStatus, setCopyStatus] = useState('')
    const [configStatus, setConfigStatus] = useState('')
    const [selectedDatasetId, setSelectedDatasetId] = useState(initialDraft.selectedDatasetId)
    const [skipCacheStages, setSkipCacheStages] = useState(initialDraft.skipCacheStages)
    const importInputRef = useRef<HTMLInputElement>(null)
    const datasetImportInputRef = useRef<HTMLInputElement>(null)
    const accelerationSettings = useAccelerationSettings((state) => state.settings)
    const setAccelerationSettings = useAccelerationSettings((state) => state.setSettings)
    const datasetsQuery = useQuery({
        queryKey: queryKeys.datasets,
        queryFn: datasetsApi.list
    })
    const queueQuery = useQuery({
        queryKey: queryKeys.queue,
        queryFn: trainingApi.getQueue,
        refetchInterval: 1_500
    })
    const datasets = datasetsQuery.data ?? []
    const effectiveDatasetId =
        datasets.find((dataset) => dataset.id === selectedDatasetId)?.id ?? datasets[0]?.id ?? ''

    useEffect(() => {
        const draft: TrainingDraft = {
            version: trainingDraftVersion,
            values,
            selectedDatasetId,
            skipCacheStages,
            openAdvanced,
            openPublishing
        }

        try {
            window.sessionStorage.setItem(
                trainingDraftStorageKey(profile.id),
                JSON.stringify(draft)
            )
        } catch {
            // Storage may be unavailable in hardened browser contexts; the live form still works.
        }
    }, [openAdvanced, openPublishing, profile.id, selectedDatasetId, skipCacheStages, values])

    const importDatasetMutation = useMutation({
        mutationFn: (file: File) => datasetsApi.import(file),
        onSuccess: async (dataset) => {
            setSelectedDatasetId(dataset.id)
            setValue('datasetConfig', `${dataset.name}.toml`)
            await queryClient.invalidateQueries({ queryKey: queryKeys.datasets })
            setConfigStatus(`Dataset config “${dataset.name}” imported.`)
        }
    })

    const createJobMutation = useMutation({
        mutationFn: () =>
            trainingApi.createJob({
                name: value('outputName').trim(),
                profile_id: profile.id,
                dataset_config_id: effectiveDatasetId,
                skip_cache_stages: skipCacheStages,
                values: { ...values, ...accelerationSettings }
            }),
        onSuccess: (job) => {
            queryClient.setQueryData<TrainingJob[]>(queryKeys.jobs, (current) => [
                job,
                ...(current ?? []).filter((item) => item.id !== job.id)
            ])
            queryClient.setQueryData(queryKeys.job(job.id), job)
            setCopyStatus(`Job “${job.name}” added to the queue.`)
            setMenuBar(Menu.LOGS)
            void Promise.all([
                queryClient.invalidateQueries({ queryKey: queryKeys.jobs }),
                queryClient.invalidateQueries({ queryKey: queryKeys.queue })
            ])
        }
    })

    const queueMutation = useMutation({
        mutationFn: () =>
            queueQuery.data?.state === 'running'
                ? trainingApi.pauseQueue()
                : trainingApi.startQueue(),
        onSuccess: (queue) => queryClient.setQueryData(queryKeys.queue, queue)
    })

    const setValue = (key: string, value: TrainingValue) => {
        setValues((current) => ({ ...current, [key]: value }))
    }

    const value = (key: string) => String(values[key] ?? '')
    const enabled = (key: string) => values[key] === true
    const hasDefault = (key: string) => Boolean(profile.defaults[key])
    const fieldIsVisible = (field: TrainingField) =>
        !field.when || values[field.when.key] === field.when.value
    const requiredFields = [
        { key: 'musubiPath', label: 'Musubi Tuner directory' },
        { key: 'outputName', label: 'Output name' },
        { key: 'outputDir', label: 'Output directory' },
        ...profile.modelFields
            .filter((field) => field.required && fieldIsVisible(field))
            .map((field) => ({ key: field.key, label: field.label }))
    ]
    const missingFields = [
        ...requiredFields.filter((field) => !value(field.key).trim()),
        ...(!effectiveDatasetId ? [{ key: 'datasetConfig', label: 'Dataset config' }] : [])
    ]
    const completion = Math.round(
        ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    )
    const command = useMemo(
        () => buildCommands(profile, values, accelerationSettings),
        [accelerationSettings, profile, values]
    )

    const copyCommand = async () => {
        try {
            await navigator.clipboard.writeText(command)
            setCopyStatus('Command copied')
        } catch {
            setCopyStatus('Copy unavailable—select the command manually')
        }
    }

    const resetDefaults = () => {
        setValues({ ...profile.defaults })
        setCopyStatus('Defaults restored')
        setConfigStatus('')
    }

    const exportConfig = () => {
        const portableValues = Object.fromEntries(
            Object.entries(values).filter(([key]) => key !== 'huggingfaceToken')
        ) as TrainingValues
        const config: TrainingConfigFile = {
            schema: trainingConfigSchema,
            version: 1,
            profileId: profile.id,
            profileName: profile.name,
            exportedAt: new Date().toISOString(),
            datasetConfigId: effectiveDatasetId || null,
            skipCacheStages,
            values: portableValues,
            acceleration: accelerationSettings
        }
        const blob = new Blob([JSON.stringify(config, null, 4)], {
            type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')

        link.href = url
        link.download = `${profile.id}-training-config.json`
        link.click()
        window.setTimeout(() => URL.revokeObjectURL(url), 0)
        setConfigStatus('Config exported. The Hugging Face access token was left out.')
    }

    const importConfig = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]

        if (!file) return

        try {
            if (file.size > 1_000_000) {
                throw new Error('The selected file is larger than 1 MB.')
            }

            const parsed: unknown = JSON.parse(await file.text())

            if (!isRecord(parsed) || parsed.schema !== trainingConfigSchema) {
                throw new Error('This is not a Musubi Tuner GUI training config.')
            }
            if (parsed.version !== 1) {
                throw new Error('This config version is not supported.')
            }
            if (parsed.profileId !== profile.id) {
                throw new Error(
                    `This config belongs to ${String(parsed.profileName || parsed.profileId)}.`
                )
            }
            if (!hasValidTrainingValues(parsed.values)) {
                throw new Error('The training values are missing or invalid.')
            }
            if (!hasValidAccelerationSettings(parsed.acceleration)) {
                throw new Error('The acceleration settings are missing or invalid.')
            }

            const allowedKeys = new Set(Object.keys(profile.defaults))
            const importedValues = Object.fromEntries(
                Object.entries(parsed.values).filter(([key]) => allowedKeys.has(key))
            ) as TrainingValues

            setValues({ ...profile.defaults, ...importedValues })
            if (
                typeof parsed.datasetConfigId === 'string' &&
                datasets.some((dataset) => dataset.id === parsed.datasetConfigId)
            ) {
                setSelectedDatasetId(parsed.datasetConfigId)
            }
            if (typeof parsed.skipCacheStages === 'boolean') {
                setSkipCacheStages(parsed.skipCacheStages)
            }
            setAccelerationSettings({
                dynamoBackend: parsed.acceleration.dynamoBackend,
                dynamoMode: parsed.acceleration.dynamoMode,
                numProcesses: parsed.acceleration.numProcesses,
                numMachines: parsed.acceleration.numMachines,
                numCpuThreadsPerProcess: parsed.acceleration.numCpuThreadsPerProcess
            })
            setCopyStatus('')
            setConfigStatus(
                `${profile.name} config imported, including shared acceleration settings.`
            )
        } catch (error) {
            const message = error instanceof Error ? error.message : 'The file could not be read.'
            setConfigStatus(`Import failed: ${message}`)
        } finally {
            event.target.value = ''
        }
    }

    const importDatasetConfig = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) importDatasetMutation.mutate(file)
        event.target.value = ''
    }

    const integrationError = importDatasetMutation.error
        ? getApiErrorMessage(
              importDatasetMutation.error,
              'The dataset config could not be imported.'
          )
        : createJobMutation.error
          ? getApiErrorMessage(createJobMutation.error, 'The training job could not be created.')
          : queueMutation.error
            ? getApiErrorMessage(queueMutation.error, 'The queue state could not be changed.')
            : datasetsQuery.error
              ? getApiErrorMessage(datasetsQuery.error, 'Dataset configs could not be loaded.')
              : queueQuery.error
                ? getApiErrorMessage(queueQuery.error, 'The training queue could not be loaded.')
                : undefined

    return (
        <main className="mx-auto w-full max-w-7xl p-3 pb-12 sm:p-5 sm:pb-12">
            <header className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-accent px-3 py-1.5 text-primary">
                                LoRA training
                            </span>
                            <span className="rounded-full bg-muted px-3 py-1.5 font-mono text-muted-foreground">
                                {profile.script}
                            </span>
                            <span className="rounded-full bg-accent px-3 py-1.5 uppercase text-primary">
                                {value('mixedPrecision')}
                            </span>
                        </div>
                        <Typography variant="h1" color="blue-gray">
                            {profile.name}
                        </Typography>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                            {profile.description}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <input
                            ref={importInputRef}
                            type="file"
                            accept="application/json,.json"
                            className="hidden"
                            onChange={importConfig}
                        />
                        <Button
                            type="button"
                            variant="outlined"
                            color="blue-gray"
                            className="flex min-h-11 items-center justify-center gap-2 px-4 py-3"
                            onClick={() => importInputRef.current?.click()}
                        >
                            <ArrowUpTrayIcon className="h-5 w-5" />
                            Import config
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            color="blue-gray"
                            className="flex min-h-11 items-center justify-center gap-2 px-4 py-3"
                            onClick={exportConfig}
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Export config
                        </Button>
                        <Button
                            type="button"
                            variant="outlined"
                            color="blue-gray"
                            className="flex min-h-11 items-center justify-center gap-2 px-4 py-3"
                            onClick={resetDefaults}
                        >
                            <AdjustmentsHorizontalIcon className="h-5 w-5" />
                            Restore defaults
                        </Button>
                    </div>
                </div>
                <p
                    className={cn(
                        'mt-4 min-h-5 text-sm font-medium',
                        configStatus.startsWith('Import failed:')
                            ? 'text-destructive'
                            : 'text-primary'
                    )}
                    aria-live="polite"
                >
                    {configStatus}
                </p>
            </header>

            {integrationError ? (
                <div
                    role="alert"
                    className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
                >
                    <p className="font-semibold">Backend integration error</p>
                    <p className="mt-1">{integrationError}</p>
                </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
                <div className="flex min-w-0 flex-col gap-5">
                    <SectionCard
                        number={1}
                        title="Project and dataset"
                        description="Set the trainer location, dataset TOML, and where this LoRA will be saved."
                        icon={<FolderOpenIcon className="h-6 w-6" />}
                    >
                        <div className="grid gap-5 md:grid-cols-2">
                            <TextField
                                field={{
                                    key: 'musubiPath',
                                    label: 'Musubi Tuner directory',
                                    helper: 'Directory containing the Python training entry points.',
                                    required: true
                                }}
                                value={value('musubiPath')}
                                onChange={(next) => setValue('musubiPath', next)}
                            />
                            <div className="min-w-0">
                                <input
                                    ref={datasetImportInputRef}
                                    type="file"
                                    accept="application/toml,.toml"
                                    className="hidden"
                                    onChange={importDatasetConfig}
                                />
                                <Select
                                    size="lg"
                                    label="Stored dataset config *"
                                    value={effectiveDatasetId}
                                    onChange={(next) => setSelectedDatasetId(next ?? '')}
                                    disabled={datasetsQuery.isPending || datasets.length === 0}
                                >
                                    {datasets.map((dataset) => (
                                        <Option key={dataset.id} value={dataset.id}>
                                            {dataset.name}
                                        </Option>
                                    ))}
                                </Select>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <p className="text-xs leading-5 text-muted-foreground">
                                        {datasets.length
                                            ? `${datasets.length} config${datasets.length === 1 ? '' : 's'} available on the server.`
                                            : 'Import a TOML dataset config to continue.'}
                                    </p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="text"
                                        color="blue"
                                        disabled={importDatasetMutation.isPending}
                                        className="shrink-0 px-2 py-1"
                                        onClick={() => datasetImportInputRef.current?.click()}
                                    >
                                        {importDatasetMutation.isPending
                                            ? 'Importing…'
                                            : 'Import TOML'}
                                    </Button>
                                </div>
                            </div>
                            <TextField
                                field={{
                                    key: 'outputName',
                                    label: 'Output name',
                                    helper: 'Filename prefix for checkpoints and the final LoRA.',
                                    required: true
                                }}
                                value={value('outputName')}
                                onChange={(next) => setValue('outputName', next)}
                            />
                            <TextField
                                field={{
                                    key: 'outputDir',
                                    label: 'Output directory',
                                    helper: 'Directory where checkpoints will be written.',
                                    required: true
                                }}
                                value={value('outputDir')}
                                onChange={(next) => setValue('outputDir', next)}
                            />
                            {hasDefault('loggingDir') ? (
                                <TextField
                                    field={{
                                        key: 'loggingDir',
                                        label: 'Logging directory',
                                        helper: 'TensorBoard and trainer logs.',
                                        required: true
                                    }}
                                    value={value('loggingDir')}
                                    onChange={(next) => setValue('loggingDir', next)}
                                />
                            ) : null}
                        </div>
                    </SectionCard>

                    <SectionCard
                        number={2}
                        title="Model files"
                        description="These paths mirror the model variables at the top of the reference script."
                        icon={<CubeTransparentIcon className="h-6 w-6" />}
                    >
                        {profile.task ? (
                            <div className="mb-5">
                                <Select
                                    size="lg"
                                    label={profile.task.label}
                                    value={value('task')}
                                    onChange={(next) => setValue('task', next ?? '')}
                                >
                                    {profile.task.options.map((option) => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    {profile.task.helper}
                                </p>
                            </div>
                        ) : null}
                        {profile.selectors?.map((field) => (
                            <div key={field.key} className="mb-5">
                                <Select
                                    size="lg"
                                    label={field.label}
                                    value={value(field.key)}
                                    onChange={(next) => setValue(field.key, next ?? '')}
                                >
                                    {field.options.map((option) => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    {field.helper}
                                </p>
                            </div>
                        ))}
                        <div className="grid gap-5 md:grid-cols-2">
                            {profile.modelFields.map((field) =>
                                fieldIsVisible(field) ? (
                                    <TextField
                                        key={field.key}
                                        field={field}
                                        value={value(field.key)}
                                        onChange={(next) => setValue(field.key, next)}
                                    />
                                ) : null
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        number={3}
                        title="Training recipe"
                        description="Tune duration, LoRA capacity, optimizer, and learning-rate behavior."
                        icon={<RocketLaunchIcon className="h-6 w-6" />}
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <NumberField
                                label="Epochs"
                                value={value('epochs')}
                                min={1}
                                onChange={(next) => setValue('epochs', next)}
                            />
                            <NumberField
                                label="Save every N epochs"
                                value={value('saveEvery')}
                                min={1}
                                onChange={(next) => setValue('saveEvery', next)}
                            />
                            <NumberField
                                label="Network dimension"
                                value={value('networkDim')}
                                min={1}
                                onChange={(next) => setValue('networkDim', next)}
                            />
                            <NumberField
                                label="Network alpha"
                                value={value('networkAlpha')}
                                min={1}
                                onChange={(next) => setValue('networkAlpha', next)}
                            />
                        </div>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <div>
                                <Select
                                    size="lg"
                                    label="Optimizer"
                                    value={value('optimizer')}
                                    onChange={(next) => setValue('optimizer', next ?? '')}
                                >
                                    {optimizerOptions.map((option) => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    The reference script default is selected.
                                </p>
                            </div>
                            <TextField
                                field={{
                                    key: 'optimizerArgs',
                                    label: 'Optimizer arguments',
                                    helper: 'Optional space-separated optimizer settings.'
                                }}
                                value={value('optimizerArgs')}
                                onChange={(next) => setValue('optimizerArgs', next)}
                            />
                            <TextField
                                field={{
                                    key: 'learningRate',
                                    label: 'Learning rate',
                                    helper: 'Scientific notation is supported, for example 1e-4.',
                                    required: true
                                }}
                                value={value('learningRate')}
                                onChange={(next) => setValue('learningRate', next)}
                            />
                            <div>
                                <Select
                                    size="lg"
                                    label="Learning-rate scheduler"
                                    value={value('scheduler')}
                                    onChange={(next) => setValue('scheduler', next ?? '')}
                                >
                                    {schedulerOptions.map((option) => (
                                        <Option key={option} value={option}>
                                            {option}
                                        </Option>
                                    ))}
                                </Select>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    Controls how the learning rate changes over training.
                                </p>
                            </div>
                            <NumberField
                                label="Warmup steps / ratio"
                                value={value('warmupSteps')}
                                min={0}
                                step="any"
                                helper="Values from 0–1 are treated as a ratio by the launcher."
                                onChange={(next) => setValue('warmupSteps', next)}
                            />
                            <TextField
                                field={{
                                    key: 'networkArgs',
                                    label: 'Network arguments',
                                    helper: 'Optional LoRA module settings, such as LoRA+ values.'
                                }}
                                value={value('networkArgs')}
                                onChange={(next) => setValue('networkArgs', next)}
                            />
                        </div>
                    </SectionCard>

                    <SectionCard
                        number={4}
                        title="Performance and memory"
                        description="Start with the script defaults, then adjust only when GPU memory requires it."
                        icon={<CpuChipIcon className="h-6 w-6" />}
                    >
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <Input
                                    size="lg"
                                    label="Mixed precision"
                                    value={value('mixedPrecision')}
                                    containerProps={inputContainerProps}
                                    readOnly
                                    className="cursor-default"
                                />
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    Fixed by the reference script.
                                </p>
                            </div>
                            <div>
                                <Select
                                    size="lg"
                                    label="Save precision"
                                    value={value('savePrecision')}
                                    onChange={(next) => setValue('savePrecision', next ?? 'bf16')}
                                >
                                    <Option value="bf16">bf16</Option>
                                    <Option value="fp16">fp16</Option>
                                    <Option value="fp32">fp32</Option>
                                </Select>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    Precision used when writing LoRA checkpoints.
                                </p>
                            </div>
                            <NumberField
                                label="Blocks to swap"
                                value={value('blocksToSwap')}
                                min={0}
                                helper="Leave empty to omit this option."
                                onChange={(next) => setValue('blocksToSwap', next)}
                            />
                            <NumberField
                                label="Data-loader workers"
                                value={value('workers')}
                                min={0}
                                onChange={(next) => setValue('workers', next)}
                            />
                            <NumberField
                                label="Text-cache batch size"
                                value={value('cacheBatchSize')}
                                min={1}
                                onChange={(next) => setValue('cacheBatchSize', next)}
                            />
                            {hasDefault('cachePixelBatchSize') ? (
                                <NumberField
                                    label="Pixel-cache batch size"
                                    value={value('cachePixelBatchSize')}
                                    min={1}
                                    onChange={(next) => setValue('cachePixelBatchSize', next)}
                                />
                            ) : null}
                        </div>
                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                            <div>
                                <Select
                                    size="lg"
                                    label="Attention implementation"
                                    value={value('attention')}
                                    onChange={(next) => setValue('attention', next ?? '')}
                                >
                                    {profile.attentionOptions.map((option) => (
                                        <Option key={option.value} value={option.value}>
                                            {option.label}
                                        </Option>
                                    ))}
                                </Select>
                                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                    Install optional libraries before choosing non-SDPA modes.
                                </p>
                            </div>
                            {hasDefault('vaeChunkSize') ? (
                                <NumberField
                                    label="VAE chunk size"
                                    value={value('vaeChunkSize')}
                                    min={1}
                                    helper="Lower values reduce latent-cache VRAM use."
                                    onChange={(next) => setValue('vaeChunkSize', next)}
                                />
                            ) : null}
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                            <Checkbox
                                checked={enabled('gradientCheckpointing')}
                                onChange={(event) =>
                                    setValue('gradientCheckpointing', event.target.checked)
                                }
                                label="Gradient checkpointing"
                            />
                            <Checkbox
                                checked={enabled('persistentWorkers')}
                                onChange={(event) =>
                                    setValue('persistentWorkers', event.target.checked)
                                }
                                label="Persistent data-loader workers"
                            />
                            {profile.memoryFlags.map((flag) => (
                                <div key={flag.key}>
                                    <Checkbox
                                        checked={enabled(flag.key)}
                                        onChange={(event) =>
                                            setValue(flag.key, event.target.checked)
                                        }
                                        label={flag.label}
                                    />
                                    <p className="ml-12 text-xs leading-5 text-muted-foreground">
                                        {flag.helper}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <Card className="border border-border shadow-sm">
                        <Accordion open={openAdvanced}>
                            <AccordionHeader
                                onClick={() => setOpenAdvanced((current) => !current)}
                                className="border-b-0 px-5 py-5 sm:px-6"
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <CodeBracketIcon className="h-6 w-6 text-muted-foreground" />
                                    <div>
                                        <Typography variant="h5" color="blue-gray">
                                            Advanced scheduling
                                        </Typography>
                                        <p className="mt-1 text-sm font-normal text-muted-foreground">
                                            Noise schedule, seed, scheduler internals, and raw
                                            arguments.
                                        </p>
                                    </div>
                                </div>
                            </AccordionHeader>
                            <AccordionBody className="px-5 pb-6 pt-4 sm:px-6">
                                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    <TextField
                                        field={{
                                            key: 'timestepSampling',
                                            label: 'Timestep sampling',
                                            helper: 'Keep the model-specific script default unless required.'
                                        }}
                                        value={value('timestepSampling')}
                                        onChange={(next) => setValue('timestepSampling', next)}
                                    />
                                    <NumberField
                                        label="Discrete flow shift"
                                        value={value('flowShift')}
                                        step="any"
                                        helper="Leave empty when the script does not use it."
                                        onChange={(next) => setValue('flowShift', next)}
                                    />
                                    <TextField
                                        field={{
                                            key: 'weightingScheme',
                                            label: 'Weighting scheme',
                                            helper: 'Leave empty to omit the argument.'
                                        }}
                                        value={value('weightingScheme')}
                                        onChange={(next) => setValue('weightingScheme', next)}
                                    />
                                    <NumberField
                                        label="Seed"
                                        value={value('seed')}
                                        min={0}
                                        onChange={(next) => setValue('seed', next)}
                                    />
                                    <NumberField
                                        label="Scheduler power"
                                        value={value('schedulerPower')}
                                        step="any"
                                        onChange={(next) => setValue('schedulerPower', next)}
                                    />
                                    <NumberField
                                        label="Minimum LR ratio"
                                        value={value('schedulerMinRatio')}
                                        step="any"
                                        onChange={(next) => setValue('schedulerMinRatio', next)}
                                    />
                                    <NumberField
                                        label="Scheduler cycles"
                                        value={value('schedulerCycles')}
                                        min={0}
                                        onChange={(next) => setValue('schedulerCycles', next)}
                                    />
                                    {hasDefault('guidanceScale') ? (
                                        <NumberField
                                            label="Guidance scale"
                                            value={value('guidanceScale')}
                                            step="any"
                                            onChange={(next) => setValue('guidanceScale', next)}
                                        />
                                    ) : null}
                                    {hasDefault('timestepBoundary') ? (
                                        <NumberField
                                            label="Timestep boundary"
                                            value={value('timestepBoundary')}
                                            min={0}
                                            onChange={(next) => setValue('timestepBoundary', next)}
                                        />
                                    ) : null}
                                    {hasDefault('minTimestep') ? (
                                        <NumberField
                                            label="Minimum timestep"
                                            value={value('minTimestep')}
                                            min={0}
                                            onChange={(next) => setValue('minTimestep', next)}
                                        />
                                    ) : null}
                                    {hasDefault('maxTimestep') ? (
                                        <NumberField
                                            label="Maximum timestep"
                                            value={value('maxTimestep')}
                                            min={0}
                                            onChange={(next) => setValue('maxTimestep', next)}
                                        />
                                    ) : null}
                                    {profile.advancedFields?.map((field) => (
                                        <TextField
                                            key={field.key}
                                            field={field}
                                            value={value(field.key)}
                                            onChange={(next) => setValue(field.key, next)}
                                        />
                                    ))}
                                </div>
                                <div className="mt-5">
                                    <TextField
                                        field={{
                                            key: 'extraArgs',
                                            label: 'Extra command arguments',
                                            helper: 'Appended verbatim. Use only for flags not represented above.'
                                        }}
                                        value={value('extraArgs')}
                                        onChange={(next) => setValue('extraArgs', next)}
                                    />
                                </div>
                            </AccordionBody>
                        </Accordion>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <Accordion open={openPublishing}>
                            <AccordionHeader
                                onClick={() => setOpenPublishing((current) => !current)}
                                className="border-b-0 px-5 py-5 sm:px-6"
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <CloudArrowUpIcon className="h-6 w-6 text-muted-foreground" />
                                    <div>
                                        <Typography variant="h5" color="blue-gray">
                                            Optional Hugging Face upload
                                        </Typography>
                                        <p className="mt-1 text-sm font-normal text-muted-foreground">
                                            Keep collapsed when training locally only.
                                        </p>
                                    </div>
                                </div>
                            </AccordionHeader>
                            <AccordionBody className="px-5 pb-6 pt-4 sm:px-6">
                                <div className="grid gap-5 md:grid-cols-2">
                                    <TextField
                                        field={{
                                            key: 'huggingfaceRepoId',
                                            label: 'Repository ID',
                                            helper: 'Example: username/my-lora.'
                                        }}
                                        value={value('huggingfaceRepoId')}
                                        onChange={(next) => setValue('huggingfaceRepoId', next)}
                                    />
                                    <div>
                                        <Select
                                            size="lg"
                                            label="Repository type"
                                            value={value('huggingfaceRepoType')}
                                            onChange={(next) =>
                                                setValue('huggingfaceRepoType', next ?? 'model')
                                            }
                                        >
                                            <Option value="model">Model</Option>
                                            <Option value="dataset">Dataset</Option>
                                            <Option value="space">Space</Option>
                                        </Select>
                                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                            Model is the normal choice for LoRA checkpoints.
                                        </p>
                                    </div>
                                    <TextField
                                        field={{
                                            key: 'huggingfacePath',
                                            label: 'Path inside repository',
                                            helper: 'Optional relative destination path.'
                                        }}
                                        value={value('huggingfacePath')}
                                        onChange={(next) => setValue('huggingfacePath', next)}
                                    />
                                    <TextField
                                        field={{
                                            key: 'huggingfaceToken',
                                            label: 'Access token',
                                            helper: 'The token is only included in the generated command.'
                                        }}
                                        value={value('huggingfaceToken')}
                                        type="password"
                                        onChange={(next) => setValue('huggingfaceToken', next)}
                                    />
                                    <div>
                                        <Select
                                            size="lg"
                                            label="Visibility"
                                            value={value('huggingfaceVisibility')}
                                            onChange={(next) =>
                                                setValue('huggingfaceVisibility', next ?? 'private')
                                            }
                                        >
                                            <Option value="private">Private</Option>
                                            <Option value="public">Public</Option>
                                        </Select>
                                    </div>
                                    <Checkbox
                                        checked={enabled('asyncUpload')}
                                        onChange={(event) =>
                                            setValue('asyncUpload', event.target.checked)
                                        }
                                        label="Upload asynchronously"
                                    />
                                </div>
                            </AccordionBody>
                        </Accordion>
                    </Card>
                </div>

                <aside className="min-w-0 xl:sticky xl:top-5">
                    <Card className="border border-border shadow-sm">
                        <CardBody className="p-5">
                            <div className="flex items-center gap-3">
                                <CircleStackIcon className="h-6 w-6 text-primary" />
                                <Typography variant="h5" color="blue-gray">
                                    Training readiness
                                </Typography>
                            </div>
                            <div className="mt-5 flex items-center justify-between text-sm">
                                <span className="font-medium text-foreground">Required setup</span>
                                <span className="font-semibold text-primary">{completion}%</span>
                            </div>
                            <Progress value={completion} color="blue" className="mt-2" />

                            {missingFields.length ? (
                                <div className="mt-4 rounded-lg border border-warning-border bg-warning-muted p-3 text-sm text-warning-foreground">
                                    <div className="flex items-start gap-2">
                                        <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="font-semibold">
                                                Complete required fields
                                            </p>
                                            <p className="mt-1 leading-5">
                                                {missingFields
                                                    .map((field) => field.label)
                                                    .join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-4 flex items-center gap-2 rounded-lg bg-success-muted p-3 text-sm font-medium text-success-foreground">
                                    <CheckCircleIcon className="h-5 w-5" />
                                    Ready to add to the training queue
                                </div>
                            )}

                            <div className="mt-5 rounded-lg border border-border p-3">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span className="font-medium text-foreground">
                                        Queue {queueQuery.data?.state ?? 'loading'}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {queueQuery.data?.queued ?? 0} waiting
                                    </span>
                                </div>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outlined"
                                    color="blue-gray"
                                    disabled={queueMutation.isPending || !queueQuery.data}
                                    className="mt-3 w-full"
                                    onClick={() => queueMutation.mutate()}
                                >
                                    {queueQuery.data?.state === 'running'
                                        ? 'Pause queue'
                                        : 'Start queue'}
                                </Button>
                            </div>

                            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-sm">
                                <div className="flex gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                        1
                                    </span>
                                    <span className="text-muted-foreground">
                                        Cache training latents
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                        2
                                    </span>
                                    <span className="text-muted-foreground">
                                        Cache text encoders
                                    </span>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                        3
                                    </span>
                                    <span className="text-muted-foreground">
                                        Launch LoRA training
                                    </span>
                                </div>
                            </div>

                            <details className="mt-5 rounded-lg border border-border bg-muted">
                                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-foreground">
                                    Preview generated command
                                </summary>
                                <pre className="max-h-80 overflow-auto border-t border-border p-4 font-mono text-xs leading-5 text-foreground">
                                    {command}
                                </pre>
                            </details>

                            <Checkbox
                                checked={skipCacheStages}
                                onChange={(event) => setSkipCacheStages(event.target.checked)}
                                label="Skip cache stages"
                                containerProps={{ className: 'mt-3' }}
                            />

                            <Button
                                type="button"
                                color="blue"
                                size="lg"
                                disabled={missingFields.length > 0 || createJobMutation.isPending}
                                className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 px-5 py-3"
                                onClick={() => createJobMutation.mutate()}
                            >
                                <RocketLaunchIcon className="h-5 w-5" />
                                {createJobMutation.isPending
                                    ? 'Adding job…'
                                    : 'Add to training queue'}
                            </Button>
                            <Button
                                type="button"
                                color="blue-gray"
                                variant="outlined"
                                size="sm"
                                disabled={missingFields.length > 0}
                                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 px-4 py-2"
                                onClick={copyCommand}
                            >
                                <ClipboardDocumentIcon className="h-5 w-5" />
                                Copy command instead
                            </Button>
                            <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                                Jobs use the selected server-side dataset snapshot and the shared
                                acceleration settings.
                            </p>
                            <p
                                className="mt-2 min-h-5 text-center text-xs font-medium text-primary"
                                aria-live="polite"
                            >
                                {copyStatus}
                            </p>
                        </CardBody>
                    </Card>
                </aside>
            </div>
        </main>
    )
}

export default TrainingWorkspace
