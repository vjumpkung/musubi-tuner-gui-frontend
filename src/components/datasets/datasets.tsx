import {
    type CreateManagedDatasetInput,
    type DatasetConfig,
    type DatasetSummary,
    type ManagedDatasetInput,
    datasetsApi,
    queryKeys
} from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
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
import { Button, Card, CardBody, Input, Textarea, Typography } from '@/components/ui/legacy'
import { cn } from '@/lib/utils'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    DownloadIcon as ArrowDownTrayIcon,
    RefreshCwIcon as ArrowPathIcon,
    CircleCheckIcon as CheckCircleIcon,
    DatabaseIcon as CircleStackIcon,
    CircleAlertIcon as ExclamationCircleIcon,
    FilmIcon,
    ImageIcon as PhotoIcon,
    PlusIcon,
    TrashIcon,
    XIcon as XMarkIcon
} from 'lucide-react'
import { type ChangeEvent, type FormEvent, useState } from 'react'

type MediaType = ManagedDatasetInput['mediaType']

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
    datasetIndex: number
    numRepeats: number
}

type DatasetDraft = {
    id: string
    mediaType: MediaType
    width: string
    height: string
    targetFrames: string
    numRepeats: string
    selectedMedia: SelectedMedia[]
    selectedControls: File[]
    selectionError?: string
}

let nextDraftId = 0

const createDatasetDraft = (): DatasetDraft => ({
    id: `dataset-draft-${++nextDraftId}`,
    mediaType: 'image',
    width: '1024',
    height: '1024',
    targetFrames: '1, 25, 49',
    numRepeats: '1',
    selectedMedia: [],
    selectedControls: []
})

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

    return config.datasets.flatMap<DatasetSource>((dataset, datasetIndex) => {
        const sources: DatasetSource[] = []
        const numRepeats = typeof dataset.num_repeats === 'number' ? dataset.num_repeats : 1
        const imagePath = dataset.image_directory ?? dataset.image_jsonl_file
        if (typeof imagePath === 'string') {
            sources.push({
                type: 'image',
                path: imagePath,
                label: 'Target',
                datasetIndex,
                numRepeats
            })
        }
        const videoPath = dataset.video_directory ?? dataset.video_jsonl_file
        if (typeof videoPath === 'string') {
            sources.push({
                type: 'video',
                path: videoPath,
                label: 'Target',
                datasetIndex,
                numRepeats
            })
        }
        if (typeof dataset.control_directory === 'string') {
            sources.push({
                type: 'image',
                path: dataset.control_directory,
                label: 'Control',
                datasetIndex,
                numRepeats
            })
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
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{summary.name}</h3>
                    {summary.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                            {summary.description}
                        </p>
                    ) : null}
                </div>
                {sources[0] ? (
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold capitalize text-primary">
                        {sources[0].type === 'image' ? (
                            <PhotoIcon className="h-3.5 w-3.5" />
                        ) : (
                            <FilmIcon className="h-3.5 w-3.5" />
                        )}
                        {detail && detail.datasets.length > 1
                            ? `${detail.datasets.length} datasets`
                            : sources[0].type}
                    </span>
                ) : null}
            </div>

            <div className="mt-3 min-h-10">
                {loadingDetail ? (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Loading configuration…
                    </p>
                ) : sources.length ? (
                    <ul className="flex flex-col gap-1.5">
                        {sources.map((source, index) => (
                            <li
                                className="truncate font-mono text-xs text-muted-foreground"
                                title={source.path}
                                key={`${source.type}:${source.path}:${index}`}
                            >
                                Dataset {source.datasetIndex + 1} {source.label}
                                {source.label === 'Target'
                                    ? ` · repeat ${source.numRepeats}`
                                    : ''}: {source.path}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-muted-foreground">Source details unavailable</p>
                )}
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                <a
                    href={datasetsApi.exportUrl(summary.id)}
                    download
                    className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Export TOML
                </a>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button
                            type="button"
                            disabled={deleting}
                            aria-label={`Delete ${summary.name}`}
                            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-destructive/20 p-2 text-destructive transition-colors hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive focus:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
                        >
                            {deleting ? (
                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                            ) : (
                                <TrashIcon className="h-4 w-4" />
                            )}
                        </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete dataset config?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Delete “{summary.name}”? Managed uploads that are not used by
                                training jobs will also be removed.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                variant="destructive"
                                onClick={() => onDelete(summary)}
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </article>
    )
}

const getDraftValues = (draft: DatasetDraft) => {
    const numericWidth = Number(draft.width)
    const numericHeight = Number(draft.height)
    const numericRepeats = Number(draft.numRepeats)
    const parsedTargetFrames = parseTargetFrames(draft.targetFrames)
    const hasValidResolution =
        Number.isSafeInteger(numericWidth) &&
        numericWidth > 0 &&
        Number.isSafeInteger(numericHeight) &&
        numericHeight > 0
    const hasValidRepeats = Number.isSafeInteger(numericRepeats) && numericRepeats > 0
    const missingCaption = draft.selectedMedia.some((media) => !media.caption.trim())
    const controlPairingError = getControlPairingError(draft.selectedMedia, draft.selectedControls)

    return {
        numericWidth,
        numericHeight,
        numericRepeats,
        parsedTargetFrames,
        hasValidResolution,
        hasValidRepeats,
        missingCaption,
        controlPairingError,
        isValid:
            hasValidResolution &&
            hasValidRepeats &&
            draft.selectedMedia.length > 0 &&
            !missingCaption &&
            !controlPairingError &&
            (draft.mediaType === 'image' || parsedTargetFrames !== null)
    }
}

type DatasetEditorProps = {
    draft: DatasetDraft
    index: number
    canRemove: boolean
    attemptedSubmit: boolean
    onChange: (update: (current: DatasetDraft) => DatasetDraft) => void
    onRemove: () => void
    onTouched: () => void
}

const DatasetEditor = ({
    draft,
    index,
    canRemove,
    attemptedSubmit,
    onChange,
    onRemove,
    onTouched
}: DatasetEditorProps) => {
    const values = getDraftValues(draft)
    const totalSize = draft.selectedMedia.reduce((sum, media) => sum + media.file.size, 0)
    const controlSize = draft.selectedControls.reduce((sum, file) => sum + file.size, 0)
    const mediaInputId = `${draft.id}-media-files`
    const controlInputId = `${draft.id}-control-files`
    const captionsHeadingId = `${draft.id}-captions-heading`

    const change = (update: (current: DatasetDraft) => DatasetDraft) => {
        onTouched()
        onChange(update)
    }

    const changeMediaType = (mediaType: MediaType) => {
        if (mediaType === draft.mediaType) return
        change((current) => ({
            ...current,
            mediaType,
            selectedMedia: [],
            selectedControls: [],
            selectionError: undefined
        }))
    }

    const selectFiles = async (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        event.target.value = ''
        const sidecars = files.filter(isCaptionFile)
        const accepted = files.filter(
            (file) => !isCaptionFile(file) && isAcceptedFile(file, draft.mediaType)
        )
        const rejectedCount = files.length - sidecars.length - accepted.length
        const existing = new Set(draft.selectedMedia.map((media) => fileSignature(media.file)))
        const additions = accepted
            .filter((file) => !existing.has(fileSignature(file)))
            .map((file, fileIndex) => ({
                id: `${fileSignature(file)}:${Date.now()}:${fileIndex}`,
                file,
                caption: ''
            }))
        let nextMedia: SelectedMedia[] = [...draft.selectedMedia, ...additions]
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
                errors.push(`${sidecar.name} has no matching ${draft.mediaType} file.`)
                continue
            }
            if (matches.length > 1) {
                errors.push(`${sidecar.name} matches more than one ${draft.mediaType} file.`)
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
        change((current) => ({
            ...current,
            selectedMedia: nextMedia,
            selectionError: errors.length ? errors.join(' ') : undefined
        }))
    }

    const selectControls = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])
        event.target.value = ''
        const accepted = files.filter((file) => isAcceptedFile(file, 'image'))
        const rejectedCount = files.length - accepted.length
        change((current) => {
            const existing = new Set(current.selectedControls.map(fileSignature))
            return {
                ...current,
                selectedControls: [
                    ...current.selectedControls,
                    ...accepted.filter((file) => !existing.has(fileSignature(file)))
                ],
                selectionError: rejectedCount
                    ? `${rejectedCount} unsupported control file${rejectedCount === 1 ? '' : 's'} were skipped.`
                    : undefined
            }
        })
    }

    return (
        <section
            className="rounded-xl border border-border bg-muted/30 p-4 sm:p-5"
            aria-labelledby={`${draft.id}-heading`}
        >
            <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                    <h2 id={`${draft.id}-heading`} className="font-semibold text-foreground">
                        Dataset {index + 1}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        This section becomes one [[datasets]] table in the TOML file.
                    </p>
                </div>
                {canRemove ? (
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/20 bg-card px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 focus:outline-none focus:ring-2 focus:ring-destructive"
                        onClick={onRemove}
                    >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                    </button>
                ) : null}
            </div>

            <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Media type</p>
                <div className="grid grid-cols-2 gap-3">
                    {(['image', 'video'] as const).map((type) => (
                        <button
                            key={type}
                            type="button"
                            aria-pressed={draft.mediaType === type}
                            className={cn(
                                'flex min-h-12 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                draft.mediaType === type
                                    ? 'border-primary bg-accent text-primary'
                                    : 'border-border bg-card text-muted-foreground hover:bg-muted'
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
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <Input
                    required
                    type="number"
                    min={1}
                    step={1}
                    size="lg"
                    label="Width"
                    value={draft.width}
                    error={attemptedSubmit && !values.hasValidResolution}
                    containerProps={inputContainerProps}
                    onChange={(event) =>
                        change((current) => ({ ...current, width: event.target.value }))
                    }
                />
                <Input
                    required
                    type="number"
                    min={1}
                    step={1}
                    size="lg"
                    label="Height"
                    value={draft.height}
                    error={attemptedSubmit && !values.hasValidResolution}
                    containerProps={inputContainerProps}
                    onChange={(event) =>
                        change((current) => ({ ...current, height: event.target.value }))
                    }
                />
                <div>
                    <Input
                        required
                        type="number"
                        min={1}
                        step={1}
                        size="lg"
                        label="Repeat"
                        value={draft.numRepeats}
                        error={attemptedSubmit && !values.hasValidRepeats}
                        containerProps={inputContainerProps}
                        onChange={(event) =>
                            change((current) => ({
                                ...current,
                                numRepeats: event.target.value
                            }))
                        }
                    />
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                        Written as num_repeats. Use it to balance datasets of different sizes.
                    </p>
                </div>
                {draft.mediaType === 'video' ? (
                    <div className="sm:col-span-3">
                        <Input
                            required
                            size="lg"
                            label="Target frames"
                            value={draft.targetFrames}
                            error={attemptedSubmit && values.parsedTargetFrames === null}
                            containerProps={inputContainerProps}
                            onChange={(event) =>
                                change((current) => ({
                                    ...current,
                                    targetFrames: event.target.value
                                }))
                            }
                        />
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Enter positive frame counts separated by commas, for example 1, 25, 49.
                        </p>
                    </div>
                ) : null}
            </div>

            <div className="mt-5">
                <label
                    htmlFor={mediaInputId}
                    className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border bg-card px-5 py-8 text-center transition-colors hover:border-primary/60 hover:bg-accent focus-within:border-primary focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-primary shadow-sm">
                        <PlusIcon className="h-6 w-6" />
                    </span>
                    <span className="mt-3 font-semibold text-foreground">
                        Add {draft.mediaType} files and captions
                    </span>
                    <span className="mt-1 text-xs text-muted-foreground">
                        Select media with matching .txt files, such as a.png + a.txt ·{' '}
                        {mediaExtensions[draft.mediaType].join(', ')}
                    </span>
                    <input
                        id={mediaInputId}
                        className="sr-only"
                        type="file"
                        multiple
                        accept={[...mediaExtensions[draft.mediaType], '.txt', 'text/plain'].join(
                            ','
                        )}
                        onChange={selectFiles}
                    />
                </label>
                {draft.selectionError ? (
                    <p className="mt-2 text-sm text-warning-foreground">{draft.selectionError}</p>
                ) : null}
                {attemptedSubmit && !draft.selectedMedia.length ? (
                    <p className="mt-2 text-sm text-destructive">
                        Select at least one {draft.mediaType} file.
                    </p>
                ) : null}
            </div>

            {draft.mediaType === 'image' ? (
                <section className="mt-5" aria-labelledby={`${draft.id}-controls-heading`}>
                    <div className="mb-3">
                        <h3
                            id={`${draft.id}-controls-heading`}
                            className="font-semibold text-foreground"
                        >
                            Control images (optional)
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Match each target stem, for example a.jpg + a.png. For multiple controls
                            use a_0.png, a_1.png, or four-digit numbers.
                        </p>
                    </div>
                    <label
                        htmlFor={controlInputId}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card px-4 py-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/60 hover:bg-accent focus-within:ring-2 focus-within:ring-ring"
                    >
                        <PhotoIcon className="h-5 w-5 text-primary" />
                        Add control images
                        <input
                            id={controlInputId}
                            className="sr-only"
                            type="file"
                            multiple
                            accept={mediaExtensions.image.join(',')}
                            onChange={selectControls}
                        />
                    </label>
                    {draft.selectedControls.length ? (
                        <div className="mt-3 flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                {draft.selectedControls.length} control image
                                {draft.selectedControls.length === 1 ? '' : 's'} ·{' '}
                                {formatFileSize(controlSize)}
                            </p>
                            {draft.selectedControls.map((control) => (
                                <div
                                    key={fileSignature(control)}
                                    className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm"
                                >
                                    <PhotoIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="min-w-0 flex-1 truncate" title={control.name}>
                                        {control.name}
                                    </span>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${control.name}`}
                                        className="rounded p-1 text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                                        onClick={() =>
                                            change((current) => ({
                                                ...current,
                                                selectedControls: current.selectedControls.filter(
                                                    (item) =>
                                                        fileSignature(item) !==
                                                        fileSignature(control)
                                                )
                                            }))
                                        }
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                    {values.controlPairingError ? (
                        <p className="mt-2 text-sm text-warning-foreground">
                            {values.controlPairingError}
                        </p>
                    ) : null}
                </section>
            ) : null}

            {draft.selectedMedia.length ? (
                <section className="mt-5" aria-labelledby={captionsHeadingId}>
                    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h3 id={captionsHeadingId} className="font-semibold text-foreground">
                                Captions
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                {draft.selectedMedia.length} files · {formatFileSize(totalSize)}{' '}
                                total
                            </p>
                        </div>
                        {attemptedSubmit && values.missingCaption ? (
                            <p className="text-xs font-medium text-destructive">
                                Add every missing caption.
                            </p>
                        ) : null}
                    </div>
                    <div className="flex max-h-[32rem] flex-col gap-3 overflow-y-auto pr-1">
                        {draft.selectedMedia.map((media, mediaIndex) => (
                            <div
                                key={media.id}
                                className="rounded-lg border border-border bg-card p-3"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground shadow-sm">
                                        {draft.mediaType === 'image' ? (
                                            <PhotoIcon className="h-5 w-5" />
                                        ) : (
                                            <FilmIcon className="h-5 w-5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p
                                            className="truncate text-sm font-medium text-foreground"
                                            title={media.file.name}
                                        >
                                            {media.file.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatFileSize(media.file.size)}
                                            {media.captionSource
                                                ? ` · caption from ${media.captionSource}`
                                                : ''}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${media.file.name}`}
                                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-destructive focus:outline-none focus:ring-2 focus:ring-ring"
                                        onClick={() =>
                                            change((current) => ({
                                                ...current,
                                                selectedMedia: current.selectedMedia.filter(
                                                    (item) => item.id !== media.id
                                                )
                                            }))
                                        }
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <Textarea
                                    required
                                    label={`Caption ${mediaIndex + 1}`}
                                    value={media.caption}
                                    error={attemptedSubmit && !media.caption.trim()}
                                    onChange={(event) =>
                                        change((current) => ({
                                            ...current,
                                            selectedMedia: current.selectedMedia.map((item) =>
                                                item.id === media.id
                                                    ? {
                                                          ...item,
                                                          caption: event.target.value,
                                                          captionSource: undefined
                                                      }
                                                    : item
                                            )
                                        }))
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}
        </section>
    )
}

const Datasets = () => {
    const queryClient = useQueryClient()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [drafts, setDrafts] = useState<DatasetDraft[]>(() => [createDatasetDraft()])
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

    const formIsValid =
        Boolean(name.trim()) && drafts.every((draft) => getDraftValues(draft).isValid)
    const uploadFileCount = drafts.reduce(
        (total, draft) => total + draft.selectedMedia.length + draft.selectedControls.length,
        0
    )

    const createMutation = useMutation({
        mutationFn: datasetsApi.createManaged,
        onSuccess: async (dataset) => {
            setSuccessMessage(`Dataset “${dataset.name}” was created successfully.`)
            setSuccessWarnings(dataset.warnings ?? [])
            setName('')
            setDescription('')
            setDrafts([createDatasetDraft()])
            setAttemptedSubmit(false)
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

    const submit = (event: FormEvent) => {
        event.preventDefault()
        setAttemptedSubmit(true)
        clearCreationResult()
        createMutation.reset()
        if (!formIsValid) return

        const input: CreateManagedDatasetInput = {
            name: name.trim(),
            description: description.trim() || undefined,
            datasets: drafts.map((draft) => {
                const values = getDraftValues(draft)
                return {
                    mediaType: draft.mediaType,
                    resolution: [values.numericWidth, values.numericHeight],
                    numRepeats: values.numericRepeats,
                    targetFrames:
                        draft.mediaType === 'video'
                            ? (values.parsedTargetFrames ?? undefined)
                            : undefined,
                    files: draft.selectedMedia.map((media) => media.file),
                    captions: draft.selectedMedia.map((media) => media.caption.trim()),
                    controlFiles: draft.selectedControls.length ? draft.selectedControls : undefined
                }
            })
        }
        createMutation.mutate(input)
    }

    const deleteDataset = (dataset: DatasetSummary) => {
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
            <header className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex items-start gap-4">
                    <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary sm:flex">
                        <CircleStackIcon className="h-7 w-7" />
                    </div>
                    <div>
                        <Typography variant="h1" color="blue-gray">
                            Datasets
                        </Typography>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                            Upload one or more training datasets with captions and export them
                            together in a reusable Musubi TOML config.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)] xl:items-start">
                <Card className="border border-border shadow-sm">
                    <CardBody className="p-5 sm:p-7">
                        <div className="mb-6">
                            <Typography variant="h4" color="blue-gray">
                                Create a managed dataset config
                            </Typography>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add a section for each [[datasets]] entry. Every media file needs a
                                caption before upload.
                            </p>
                        </div>

                        {successMessage ? (
                            <div
                                role="status"
                                className="mb-5 flex items-start gap-3 rounded-lg border border-success-border bg-success-muted p-4 text-sm text-success-foreground"
                            >
                                <CheckCircleIcon className="h-5 w-5 shrink-0" />
                                {successMessage}
                            </div>
                        ) : null}
                        {successWarnings.length ? (
                            <div
                                role="status"
                                className="mb-5 flex items-start gap-3 rounded-lg border border-warning-border bg-warning-muted p-4 text-sm text-warning-foreground"
                            >
                                <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                                <div>
                                    <p className="font-semibold">
                                        Created with {successWarnings.length}{' '}
                                        {successWarnings.length === 1 ? 'warning' : 'warnings'}
                                    </p>
                                    <ul className="mt-1 flex list-disc flex-col gap-1 pl-5">
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
                                className="mb-5 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive"
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

                            <div className="mt-6 flex flex-col gap-5">
                                {drafts.map((draft, index) => (
                                    <DatasetEditor
                                        key={draft.id}
                                        draft={draft}
                                        index={index}
                                        canRemove={drafts.length > 1}
                                        attemptedSubmit={attemptedSubmit}
                                        onTouched={clearCreationResult}
                                        onChange={(update) =>
                                            setDrafts((current) =>
                                                current.map((item) =>
                                                    item.id === draft.id ? update(item) : item
                                                )
                                            )
                                        }
                                        onRemove={() => {
                                            clearCreationResult()
                                            setDrafts((current) =>
                                                current.filter((item) => item.id !== draft.id)
                                            )
                                        }}
                                    />
                                ))}
                            </div>

                            <button
                                type="button"
                                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 bg-accent/50 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:border-primary hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onClick={() => {
                                    clearCreationResult()
                                    setDrafts((current) => [...current, createDatasetDraft()])
                                }}
                            >
                                <PlusIcon className="h-5 w-5" />
                                Add another dataset to this TOML
                            </button>

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
                                    ? `Uploading ${uploadFileCount} files…`
                                    : `Create TOML with ${drafts.length} dataset${drafts.length === 1 ? '' : 's'}`}
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
                            <p className="mt-1 text-xs text-muted-foreground">
                                {summaries.length} dataset{summaries.length === 1 ? '' : 's'}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Refresh stored datasets"
                            disabled={datasetQuery.isFetching}
                            className="rounded-lg border border-border bg-card p-2 text-muted-foreground shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
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
                            className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
                        >
                            <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                            {listError}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3">
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
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-12 text-sm text-muted-foreground shadow-sm">
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            Loading datasets…
                        </div>
                    ) : !summaries.length && !datasetQuery.isError ? (
                        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-12 text-center">
                            <CircleStackIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
                            <p className="mt-3 text-sm font-medium text-muted-foreground">
                                No stored datasets yet
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
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
