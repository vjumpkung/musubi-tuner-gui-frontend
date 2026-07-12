import {
    type CreateManagedDatasetInput,
    type DatasetConfig,
    type DatasetSummary,
    datasetsApi,
    queryKeys
} from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
import { cn } from '../../utils/cn'
import {
    ArrowDownTrayIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    CircleStackIcon,
    ExclamationCircleIcon,
    FilmIcon,
    PhotoIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardBody, Input, Textarea, Typography } from '@material-tailwind/react'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { type ChangeEvent, type FormEvent, useMemo, useRef, useState } from 'react'

type MediaType = CreateManagedDatasetInput['mediaType']

type SelectedMedia = {
    id: string
    file: File
    caption: string
    captionSource?: string
}

type DatasetSource = {
    type: MediaType
    path: string
    label: 'Target' | 'Control'
}

const mediaExtensions: Record<MediaType, string[]> = {
    image: ['.png', '.jpg', '.jpeg', '.webp', '.bmp'],
    video: ['.mp4', '.webm', '.avi', '.mov', '.mkv']
}

const inputContainerProps = { className: '!min-w-0 w-full' }

const fileSignature = (file: File) => `${file.name}:${file.size}:${file.lastModified}`

const fileStem = (file: File) => file.name.replace(/\.[^.]+$/, '').toLowerCase()

const isCaptionFile = (file: File) => file.name.toLowerCase().endsWith('.txt')

const isAcceptedFile = (file: File, mediaType: MediaType) => {
    const name = file.name.toLowerCase()
    return mediaExtensions[mediaType].some((extension) => name.endsWith(extension))
}

const getControlPairingError = (media: SelectedMedia[], controls: File[]) => {
    if (!controls.length) return undefined

    const mediaByStem = new Map<string, SelectedMedia[]>()
    media.forEach((item) => {
        const stem = fileStem(item.file)
        mediaByStem.set(stem, [...(mediaByStem.get(stem) ?? []), item])
    })
    const matchedMedia = new Map<string, string[]>()
    const seenControls = new Set<string>()

    for (const control of controls) {
        const stem = fileStem(control)
        if (seenControls.has(stem)) return `Duplicate control image stem: ${stem}`
        seenControls.add(stem)

        let targetStem = stem
        let suffix = ''
        let matches = mediaByStem.get(targetStem) ?? []
        if (!matches.length) {
            const numbered = stem.match(/^(.+)(_\d+)$/)
            if (numbered) {
                targetStem = numbered[1]
                suffix = numbered[2]
                matches = mediaByStem.get(targetStem) ?? []
            }
        }
        if (!matches.length) return `Control image ${control.name} has no matching target image.`
        if (matches.length > 1) {
            return `Control image ${control.name} matches more than one target image.`
        }
        matchedMedia.set(targetStem, [...(matchedMedia.get(targetStem) ?? []), suffix])
    }

    for (const [stem, matches] of mediaByStem) {
        if (matches.length > 1 && matchedMedia.has(stem)) {
            return `Control images are ambiguous because multiple targets use the stem ${stem}.`
        }
        const suffixes = matchedMedia.get(stem)
        if (!suffixes) return `Target image ${matches[0].file.name} needs a control image.`
        if (suffixes.includes('') && suffixes.length > 1) {
            return `Controls for ${matches[0].file.name} must use either the exact stem or numbered stems.`
        }
    }
    return undefined
}

const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const parseTargetFrames = (value: string) => {
    const parts = value
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
    if (!parts.length || parts.some((part) => !/^\d+$/.test(part))) return null

    const frames = parts.map(Number)
    return frames.every((frame) => Number.isSafeInteger(frame) && frame > 0) ? frames : null
}

const getDatasetSources = (config?: DatasetConfig): DatasetSource[] => {
    if (!config) return []

    return config.datasets.flatMap<DatasetSource>((dataset) => {
        const sources: DatasetSource[] = []
        const imagePath = dataset.image_directory ?? dataset.image_jsonl_file
        if (typeof imagePath === 'string') {
            sources.push({ type: 'image', path: imagePath, label: 'Target' })
        }
        const videoPath = dataset.video_directory ?? dataset.video_jsonl_file
        if (typeof videoPath === 'string') {
            sources.push({ type: 'video', path: videoPath, label: 'Target' })
        }
        if (typeof dataset.control_directory === 'string') {
            sources.push({ type: 'image', path: dataset.control_directory, label: 'Control' })
        }
        return sources
    })
}

type StoredDatasetProps = {
    summary: DatasetSummary
    detail?: DatasetConfig
    loadingDetail: boolean
    deleting: boolean
    onDelete: (dataset: DatasetSummary) => void
}

const StoredDataset = ({
    summary,
    detail,
    loadingDetail,
    deleting,
    onDelete
}: StoredDatasetProps) => {
    const sources = getDatasetSources(detail)

    return (
        <article className="rounded-xl border border-blue-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold text-blue-gray-900">{summary.name}</h3>
                    {summary.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-blue-gray-600">
                            {summary.description}
                        </p>
                    ) : null}
                </div>
                {sources[0] ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                        {sources[0].type === 'image' ? (
                            <PhotoIcon className="h-3.5 w-3.5" />
                        ) : (
                            <FilmIcon className="h-3.5 w-3.5" />
                        )}
                        {sources[0].type}
                    </span>
                ) : null}
            </div>

            <div className="mt-3 min-h-10">
                {loadingDetail ? (
                    <p className="flex items-center gap-2 text-xs text-blue-gray-500">
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Loading configuration…
                    </p>
                ) : sources.length ? (
                    <ul className="space-y-1.5">
                        {sources.map((source, index) => (
                            <li
                                className="truncate font-mono text-xs text-blue-gray-600"
                                title={source.path}
                                key={`${source.type}:${source.path}:${index}`}
                            >
                                {source.label}: {source.path}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-blue-gray-500">Source details unavailable</p>
                )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-blue-gray-100 pt-3">
                <a
                    href={datasetsApi.exportUrl(summary.id)}
                    download
                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-blue-gray-200 px-3 py-2 text-xs font-semibold text-blue-gray-700 transition-colors hover:bg-blue-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Export TOML
                </a>
                <button
                    type="button"
                    disabled={deleting}
                    aria-label={`Delete ${summary.name}`}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-red-200 p-2 text-red-700 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                    onClick={() => onDelete(summary)}
                >
                    {deleting ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    ) : (
                        <TrashIcon className="h-4 w-4" />
                    )}
                </button>
            </div>
        </article>
    )
}

const Datasets = () => {
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const controlInputRef = useRef<HTMLInputElement>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [mediaType, setMediaType] = useState<MediaType>('image')
    const [width, setWidth] = useState('1024')
    const [height, setHeight] = useState('1024')
    const [targetFrames, setTargetFrames] = useState('1, 25, 49')
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia[]>([])
    const [selectedControls, setSelectedControls] = useState<File[]>([])
    const [selectionError, setSelectionError] = useState<string>()
    const [successMessage, setSuccessMessage] = useState<string>()
    const [successWarnings, setSuccessWarnings] = useState<string[]>([])
    const [attemptedSubmit, setAttemptedSubmit] = useState(false)

    const datasetQuery = useQuery({
        queryKey: queryKeys.datasets,
        queryFn: datasetsApi.list
    })
    const summaries = datasetQuery.data ?? []
    const detailQueries = useQueries({
        queries: summaries.map((dataset) => ({
            queryKey: [...queryKeys.datasets, dataset.id],
            queryFn: () => datasetsApi.get(dataset.id)
        }))
    })

    const numericWidth = Number(width)
    const numericHeight = Number(height)
    const parsedTargetFrames = useMemo(() => parseTargetFrames(targetFrames), [targetFrames])
    const hasValidResolution =
        Number.isSafeInteger(numericWidth) &&
        numericWidth > 0 &&
        Number.isSafeInteger(numericHeight) &&
        numericHeight > 0
    const missingCaption = selectedMedia.some((media) => !media.caption.trim())
    const controlPairingError = getControlPairingError(selectedMedia, selectedControls)
    const formIsValid =
        Boolean(name.trim()) &&
        hasValidResolution &&
        selectedMedia.length > 0 &&
        !missingCaption &&
        !controlPairingError &&
        (mediaType === 'image' || parsedTargetFrames !== null)
    const totalSize = selectedMedia.reduce((sum, media) => sum + media.file.size, 0)
    const controlSize = selectedControls.reduce((sum, file) => sum + file.size, 0)

    const createMutation = useMutation({
        mutationFn: datasetsApi.createManaged,
        onSuccess: async (dataset) => {
            setSuccessMessage(`Dataset “${dataset.name}” was created successfully.`)
            setSuccessWarnings(dataset.warnings ?? [])
            setName('')
            setDescription('')
            setSelectedMedia([])
            setSelectedControls([])
            setSelectionError(undefined)
            setAttemptedSubmit(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
            if (controlInputRef.current) controlInputRef.current.value = ''
            await queryClient.invalidateQueries({ queryKey: queryKeys.datasets })
        }
    })

    const clearCreationResult = () => {
        setSuccessMessage(undefined)
        setSuccessWarnings([])
    }

    const deleteMutation = useMutation({
        mutationFn: datasetsApi.remove,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queryKeys.datasets })
        }
    })

    const changeMediaType = (nextType: MediaType) => {
        if (nextType === mediaType) return
        setMediaType(nextType)
        setSelectedMedia([])
        setSelectedControls([])
        setSelectionError(undefined)
        clearCreationResult()
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (controlInputRef.current) controlInputRef.current.value = ''
    }

    const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        const sidecars = files.filter(isCaptionFile)
        const accepted = files.filter(
            (file) => !isCaptionFile(file) && isAcceptedFile(file, mediaType)
        )
        const rejectedCount = files.length - sidecars.length - accepted.length
        const existing = new Set(selectedMedia.map((media) => fileSignature(media.file)))
        const additions = accepted
            .filter((file) => !existing.has(fileSignature(file)))
            .map((file, index) => ({
                id: `${fileSignature(file)}:${Date.now()}:${index}`,
                file,
                caption: ''
            }))
        let nextMedia: SelectedMedia[] = [...selectedMedia, ...additions]
        const errors: string[] = []
        const seenSidecars = new Set<string>()

        for (const sidecar of sidecars) {
            const stem = fileStem(sidecar)
            if (seenSidecars.has(stem)) {
                errors.push(`More than one .txt caption was selected for ${stem}.`)
                continue
            }
            seenSidecars.add(stem)
            const matches = nextMedia.filter((media) => fileStem(media.file) === stem)
            if (!matches.length) {
                errors.push(`${sidecar.name} has no matching ${mediaType} file.`)
                continue
            }
            if (matches.length > 1) {
                errors.push(`${sidecar.name} matches more than one ${mediaType} file.`)
                continue
            }
            try {
                const caption = (await sidecar.text()).trim()
                if (!caption) {
                    errors.push(`${sidecar.name} is empty.`)
                    continue
                }
                nextMedia = nextMedia.map((media) =>
                    media.id === matches[0].id
                        ? { ...media, caption, captionSource: sidecar.name }
                        : media
                )
            } catch {
                errors.push(`${sidecar.name} could not be read as text.`)
            }
        }

        if (rejectedCount) {
            errors.push(
                `${rejectedCount} unsupported file${rejectedCount === 1 ? '' : 's'} were skipped.`
            )
        }
        setSelectedMedia(nextMedia)
        setSelectionError(errors.length ? errors.join(' ') : undefined)
        clearCreationResult()
        event.target.value = ''
    }

    const selectControls = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        const accepted = files.filter((file) => isAcceptedFile(file, 'image'))
        const rejectedCount = files.length - accepted.length
        setSelectedControls((current) => {
            const existing = new Set(current.map(fileSignature))
            return [...current, ...accepted.filter((file) => !existing.has(fileSignature(file)))]
        })
        setSelectionError(
            rejectedCount
                ? `${rejectedCount} unsupported control file${rejectedCount === 1 ? '' : 's'} were skipped.`
                : undefined
        )
        clearCreationResult()
        event.target.value = ''
    }

    const updateCaption = (id: string, caption: string) => {
        clearCreationResult()
        setSelectedMedia((current) =>
            current.map((media) =>
                media.id === id ? { ...media, caption, captionSource: undefined } : media
            )
        )
    }

    const removeFile = (id: string) => {
        clearCreationResult()
        setSelectedMedia((current) => current.filter((media) => media.id !== id))
    }

    const removeControl = (file: File) => {
        clearCreationResult()
        const signature = fileSignature(file)
        setSelectedControls((current) =>
            current.filter((control) => fileSignature(control) !== signature)
        )
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()
        setAttemptedSubmit(true)
        clearCreationResult()
        createMutation.reset()
        if (!formIsValid) return

        createMutation.mutate({
            name: name.trim(),
            description: description.trim() || undefined,
            mediaType,
            resolution: [numericWidth, numericHeight],
            targetFrames: mediaType === 'video' ? (parsedTargetFrames ?? undefined) : undefined,
            files: selectedMedia.map((media) => media.file),
            captions: selectedMedia.map((media) => media.caption.trim()),
            controlFiles: selectedControls.length ? selectedControls : undefined
        })
    }

    const deleteDataset = (dataset: DatasetSummary) => {
        if (
            !window.confirm(
                `Delete dataset “${dataset.name}”? Managed uploads that are not used by training jobs will also be removed.`
            )
        )
            return
        deleteMutation.reset()
        deleteMutation.mutate(dataset.id)
    }

    const createError = createMutation.error
        ? getApiErrorMessage(createMutation.error, 'The dataset could not be created.')
        : undefined
    const listError = datasetQuery.error
        ? getApiErrorMessage(datasetQuery.error, 'Stored datasets could not be loaded.')
        : deleteMutation.error
          ? getApiErrorMessage(deleteMutation.error, 'The dataset could not be deleted.')
          : undefined

    return (
        <main className="mx-auto w-full max-w-7xl p-3 pb-12 sm:p-5 sm:pb-12">
            <header className="mb-6 rounded-xl border border-blue-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-4">
                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:flex">
                        <CircleStackIcon className="h-7 w-7" />
                    </div>
                    <div>
                        <Typography variant="h1" color="blue-gray">
                            Datasets
                        </Typography>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-gray-600 sm:text-base">
                            Upload training media with captions. The backend stores the files,
                            writes caption sidecars, and creates a reusable Musubi dataset config.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)] xl:items-start">
                <Card className="border border-blue-gray-100 shadow-sm">
                    <CardBody className="p-5 sm:p-7">
                        <div className="mb-6">
                            <Typography variant="h4" color="blue-gray">
                                Create a managed dataset
                            </Typography>
                            <p className="mt-1 text-sm text-blue-gray-600">
                                Every selected file needs a caption before it can be uploaded.
                            </p>
                        </div>

                        {successMessage ? (
                            <div
                                role="status"
                                className="mb-5 flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                            >
                                <CheckCircleIcon className="h-5 w-5 shrink-0" />
                                {successMessage}
                            </div>
                        ) : null}
                        {successWarnings.length ? (
                            <div
                                role="status"
                                className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                            >
                                <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">
                                        Created with {successWarnings.length}{' '}
                                        {successWarnings.length === 1 ? 'warning' : 'warnings'}
                                    </p>
                                    <ul className="mt-1 list-disc space-y-1 pl-5">
                                        {successWarnings.map((warning, index) => (
                                            <li key={`${warning}:${index}`}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                        {createError ? (
                            <div
                                role="alert"
                                className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                            >
                                <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">Upload failed</p>
                                    <p className="mt-1">{createError}</p>
                                </div>
                            </div>
                        ) : null}

                        <form onSubmit={submit} noValidate>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Input
                                    required
                                    size="lg"
                                    label="Dataset name"
                                    value={name}
                                    error={attemptedSubmit && !name.trim()}
                                    containerProps={inputContainerProps}
                                    onChange={(event) => {
                                        clearCreationResult()
                                        setName(event.target.value)
                                    }}
                                />
                                <div className="sm:col-span-2">
                                    <Textarea
                                        label="Description (optional)"
                                        value={description}
                                        onChange={(event) => {
                                            clearCreationResult()
                                            setDescription(event.target.value)
                                        }}
                                    />
                                </div>
                            </div>

                            <fieldset className="mt-6">
                                <legend className="mb-2 text-sm font-semibold text-blue-gray-800">
                                    Media type
                                </legend>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['image', 'video'] as const).map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            aria-pressed={mediaType === type}
                                            className={cn(
                                                'flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                                                mediaType === type
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-blue-gray-200 text-blue-gray-700 hover:bg-blue-gray-50'
                                            )}
                                            onClick={() => changeMediaType(type)}
                                        >
                                            {type === 'image' ? (
                                                <PhotoIcon className="h-5 w-5" />
                                            ) : (
                                                <FilmIcon className="h-5 w-5" />
                                            )}
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="mt-6 grid gap-5 sm:grid-cols-2">
                                <div>
                                    <Input
                                        required
                                        type="number"
                                        min={1}
                                        step={1}
                                        size="lg"
                                        label="Width"
                                        value={width}
                                        error={attemptedSubmit && !hasValidResolution}
                                        containerProps={inputContainerProps}
                                        onChange={(event) => {
                                            clearCreationResult()
                                            setWidth(event.target.value)
                                        }}
                                    />
                                </div>
                                <div>
                                    <Input
                                        required
                                        type="number"
                                        min={1}
                                        step={1}
                                        size="lg"
                                        label="Height"
                                        value={height}
                                        error={attemptedSubmit && !hasValidResolution}
                                        containerProps={inputContainerProps}
                                        onChange={(event) => {
                                            clearCreationResult()
                                            setHeight(event.target.value)
                                        }}
                                    />
                                </div>
                                {mediaType === 'video' ? (
                                    <div className="sm:col-span-2">
                                        <Input
                                            required
                                            size="lg"
                                            label="Target frames"
                                            value={targetFrames}
                                            error={attemptedSubmit && parsedTargetFrames === null}
                                            containerProps={inputContainerProps}
                                            onChange={(event) => {
                                                clearCreationResult()
                                                setTargetFrames(event.target.value)
                                            }}
                                        />
                                        <p className="mt-2 text-xs leading-5 text-blue-gray-600">
                                            Enter positive frame counts separated by commas, for
                                            example 1, 25, 49.
                                        </p>
                                    </div>
                                ) : null}
                            </div>

                            <div className="mt-6">
                                <label
                                    htmlFor="dataset-media-files"
                                    className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-blue-gray-200 bg-blue-gray-50/50 px-5 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
                                >
                                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm">
                                        <PlusIcon className="h-6 w-6" />
                                    </span>
                                    <span className="mt-3 font-semibold text-blue-gray-900">
                                        Add {mediaType} files and captions
                                    </span>
                                    <span className="mt-1 text-xs text-blue-gray-600">
                                        Select media with matching .txt files, such as a.png + a.txt
                                        · {mediaExtensions[mediaType].join(', ')}
                                    </span>
                                    <input
                                        ref={fileInputRef}
                                        id="dataset-media-files"
                                        className="sr-only"
                                        type="file"
                                        multiple
                                        accept={[
                                            ...mediaExtensions[mediaType],
                                            '.txt',
                                            'text/plain'
                                        ].join(',')}
                                        onChange={selectFiles}
                                    />
                                </label>
                                {selectionError ? (
                                    <p className="mt-2 text-sm text-amber-800">{selectionError}</p>
                                ) : null}
                                {attemptedSubmit && !selectedMedia.length ? (
                                    <p className="mt-2 text-sm text-red-700">
                                        Select at least one {mediaType} file.
                                    </p>
                                ) : null}
                            </div>

                            {mediaType === 'image' ? (
                                <section className="mt-6" aria-labelledby="control-images-heading">
                                    <div className="mb-3">
                                        <h3
                                            id="control-images-heading"
                                            className="font-semibold text-blue-gray-900"
                                        >
                                            Control images (optional)
                                        </h3>
                                        <p className="mt-1 text-xs leading-5 text-blue-gray-600">
                                            Match each target stem, for example a.jpg + a.png. For
                                            multiple controls use a_0.png, a_1.png, or four-digit
                                            numbers.
                                        </p>
                                    </div>
                                    <label
                                        htmlFor="dataset-control-files"
                                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-blue-gray-300 bg-blue-gray-50/50 px-4 py-4 text-sm font-semibold text-blue-gray-700 transition-colors hover:border-blue-400 hover:bg-blue-50 focus-within:ring-2 focus-within:ring-blue-500"
                                    >
                                        <PhotoIcon className="h-5 w-5 text-blue-700" />
                                        Add control images
                                        <input
                                            ref={controlInputRef}
                                            id="dataset-control-files"
                                            className="sr-only"
                                            type="file"
                                            multiple
                                            accept={mediaExtensions.image.join(',')}
                                            onChange={selectControls}
                                        />
                                    </label>
                                    {selectedControls.length ? (
                                        <div className="mt-3 space-y-2 rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-3">
                                            <p className="text-xs font-medium text-blue-gray-600">
                                                {selectedControls.length} control image
                                                {selectedControls.length === 1 ? '' : 's'} ·{' '}
                                                {formatFileSize(controlSize)}
                                            </p>
                                            {selectedControls.map((control) => (
                                                <div
                                                    key={fileSignature(control)}
                                                    className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm"
                                                >
                                                    <PhotoIcon className="h-4 w-4 shrink-0 text-blue-gray-500" />
                                                    <span
                                                        className="min-w-0 flex-1 truncate"
                                                        title={control.name}
                                                    >
                                                        {control.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        aria-label={`Remove ${control.name}`}
                                                        className="rounded p-1 text-blue-gray-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onClick={() => removeControl(control)}
                                                    >
                                                        <XMarkIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                    {controlPairingError ? (
                                        <p className="mt-2 text-sm text-amber-800">
                                            {controlPairingError}
                                        </p>
                                    ) : null}
                                </section>
                            ) : null}

                            {selectedMedia.length ? (
                                <section className="mt-6" aria-labelledby="selected-media-heading">
                                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                                        <div>
                                            <h3
                                                id="selected-media-heading"
                                                className="font-semibold text-blue-gray-900"
                                            >
                                                Captions
                                            </h3>
                                            <p className="text-xs text-blue-gray-600">
                                                {selectedMedia.length} files ·{' '}
                                                {formatFileSize(totalSize)} total
                                            </p>
                                        </div>
                                        {attemptedSubmit && missingCaption ? (
                                            <p className="text-xs font-medium text-red-700">
                                                Add every missing caption.
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                                        {selectedMedia.map((media, index) => (
                                            <div
                                                key={media.id}
                                                className="rounded-lg border border-blue-gray-100 bg-blue-gray-50/40 p-3"
                                            >
                                                <div className="mb-3 flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-gray-600 shadow-sm">
                                                        {mediaType === 'image' ? (
                                                            <PhotoIcon className="h-5 w-5" />
                                                        ) : (
                                                            <FilmIcon className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p
                                                            className="truncate text-sm font-medium text-blue-gray-900"
                                                            title={media.file.name}
                                                        >
                                                            {media.file.name}
                                                        </p>
                                                        <p className="text-xs text-blue-gray-500">
                                                            {formatFileSize(media.file.size)}
                                                            {media.captionSource
                                                                ? ` · caption from ${media.captionSource}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        aria-label={`Remove ${media.file.name}`}
                                                        className="rounded-lg p-2 text-blue-gray-500 hover:bg-white hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        onClick={() => removeFile(media.id)}
                                                    >
                                                        <XMarkIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                                <Textarea
                                                    required
                                                    label={`Caption ${index + 1}`}
                                                    value={media.caption}
                                                    error={attemptedSubmit && !media.caption.trim()}
                                                    onChange={(event) =>
                                                        updateCaption(media.id, event.target.value)
                                                    }
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ) : null}

                            <Button
                                type="submit"
                                color="blue"
                                size="lg"
                                disabled={createMutation.isPending}
                                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2"
                            >
                                {createMutation.isPending ? (
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : (
                                    <CircleStackIcon className="h-5 w-5" />
                                )}
                                {createMutation.isPending
                                    ? `Uploading ${selectedMedia.length} files…`
                                    : 'Create dataset'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>

                <aside className="xl:sticky xl:top-5">
                    <div className="mb-4 flex items-center justify-between gap-3 px-1">
                        <div>
                            <Typography variant="h5" color="blue-gray">
                                Stored configs
                            </Typography>
                            <p className="mt-1 text-xs text-blue-gray-600">
                                {summaries.length} dataset{summaries.length === 1 ? '' : 's'}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Refresh stored datasets"
                            disabled={datasetQuery.isFetching}
                            className="rounded-lg border border-blue-gray-200 bg-white p-2 text-blue-gray-600 shadow-sm hover:bg-blue-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            onClick={() => datasetQuery.refetch()}
                        >
                            <ArrowPathIcon
                                className={cn('h-5 w-5', datasetQuery.isFetching && 'animate-spin')}
                            />
                        </button>
                    </div>

                    {listError ? (
                        <div
                            role="alert"
                            className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                        >
                            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                            {listError}
                        </div>
                    ) : null}

                    <div className="space-y-3">
                        {summaries.map((summary, index) => (
                            <StoredDataset
                                key={summary.id}
                                summary={summary}
                                detail={detailQueries[index]?.data}
                                loadingDetail={detailQueries[index]?.isLoading ?? false}
                                deleting={
                                    deleteMutation.isPending &&
                                    deleteMutation.variables === summary.id
                                }
                                onDelete={deleteDataset}
                            />
                        ))}
                    </div>

                    {datasetQuery.isLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-blue-gray-100 bg-white py-12 text-sm text-blue-gray-600 shadow-sm">
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            Loading datasets…
                        </div>
                    ) : !summaries.length && !datasetQuery.isError ? (
                        <div className="rounded-xl border border-dashed border-blue-gray-200 bg-white px-5 py-12 text-center">
                            <CircleStackIcon className="mx-auto h-8 w-8 text-blue-gray-300" />
                            <p className="mt-3 text-sm font-medium text-blue-gray-700">
                                No stored datasets yet
                            </p>
                            <p className="mt-1 text-xs text-blue-gray-500">
                                Your first config will appear here after upload.
                            </p>
                        </div>
                    ) : null}
                </aside>
            </div>
        </main>
    )
}

export default Datasets
