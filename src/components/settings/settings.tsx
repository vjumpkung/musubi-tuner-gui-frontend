import useAccelerationSettings from '../../hooks/useAccelerationSettings'
import useDownloadSettings from '../../hooks/useDownloadSettings'
import { Button, Card, CardBody, Input, Option, Select, Typography } from '@/components/ui/legacy'
import {
    RefreshCwIcon as ArrowPathIcon,
    ZapIcon as BoltIcon,
    CpuIcon as CpuChipIcon,
    InfoIcon as InformationCircleIcon,
    KeyRoundIcon as KeyIcon,
    ServerIcon as ServerStackIcon
} from 'lucide-react'

const inputContainerProps = { className: '!min-w-0 w-full' }

const Settings = () => {
    const settings = useAccelerationSettings((state) => state.settings)
    const setSetting = useAccelerationSettings((state) => state.setSetting)
    const resetSettings = useAccelerationSettings((state) => state.resetSettings)
    const hfToken = useDownloadSettings((state) => state.hfToken)
    const setHfToken = useDownloadSettings((state) => state.setHfToken)
    const clearHfToken = useDownloadSettings((state) => state.clearHfToken)

    const cpuThreads = settings.numCpuThreadsPerProcess || 'trainer default'

    return (
        <main className="mx-auto w-full max-w-6xl p-3 pb-12 sm:p-5 sm:pb-12">
            <header className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
                            <BoltIcon className="h-4 w-4" />
                            Application configuration
                        </div>
                        <Typography variant="h1" color="blue-gray">
                            Settings
                        </Typography>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                            Configure Hugging Face download authentication and the shared Accelerate
                            launch options used by every training page.
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outlined"
                        color="blue-gray"
                        className="flex min-h-11 items-center justify-center gap-2 px-5 py-3"
                        onClick={resetSettings}
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                        Restore acceleration defaults
                    </Button>
                </div>
            </header>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <div className="flex flex-col gap-5">
                    <Card className="border border-border shadow-sm">
                        <CardBody className="p-5 sm:p-6">
                            <div className="mb-6 flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                                    <KeyIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <Typography variant="h5" color="blue-gray">
                                        Hugging Face authentication
                                    </Typography>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Provide a token for gated or private model downloads.
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                <Input
                                    type="password"
                                    size="lg"
                                    maxLength={2048}
                                    label="Hugging Face token (HF_TOKEN)"
                                    value={hfToken}
                                    autoComplete="off"
                                    spellCheck={false}
                                    containerProps={inputContainerProps}
                                    onChange={(event) => setHfToken(event.target.value)}
                                />
                                <Button
                                    type="button"
                                    variant="outlined"
                                    color="blue-gray"
                                    className="min-h-11 shrink-0 px-5 py-3"
                                    disabled={!hfToken}
                                    onClick={clearHfToken}
                                >
                                    Clear token
                                </Button>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                Sent only when a download starts and kept only in this tab’s memory.
                                Reloading the page clears it.
                            </p>
                        </CardBody>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardBody className="p-5 sm:p-6">
                            <div className="mb-6 flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                                    <CpuChipIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <Typography variant="h5" color="blue-gray">
                                        Torch compilation
                                    </Typography>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Choose how Accelerate hands the training process to Torch
                                        Dynamo.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <Select
                                        size="lg"
                                        label="Dynamo backend"
                                        value={settings.dynamoBackend}
                                        onChange={(value) =>
                                            setSetting('dynamoBackend', value ?? 'no')
                                        }
                                    >
                                        <Option value="no">Disabled</Option>
                                        <Option value="eager">Eager</Option>
                                        <Option value="aot_eager">AOT eager</Option>
                                        <Option value="inductor">Inductor</Option>
                                    </Select>
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        Disabled is the safest default for model compatibility.
                                    </p>
                                </div>
                                <div>
                                    <Select
                                        size="lg"
                                        label="Dynamo mode"
                                        value={settings.dynamoMode}
                                        onChange={(value) =>
                                            setSetting('dynamoMode', value ?? 'default')
                                        }
                                    >
                                        <Option value="default">Default</Option>
                                        <Option value="reduce-overhead">Reduce overhead</Option>
                                        <Option value="max-autotune">Max autotune</Option>
                                    </Select>
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        Used only when a Dynamo backend is enabled.
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border border-border shadow-sm">
                        <CardBody className="p-5 sm:p-6">
                            <div className="mb-6 flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
                                    <ServerStackIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <Typography variant="h5" color="blue-gray">
                                        Process topology
                                    </Typography>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Control worker processes, machines, and CPU threads passed
                                        to Accelerate.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <Input
                                        type="number"
                                        min={1}
                                        size="lg"
                                        label="Processes"
                                        value={settings.numProcesses}
                                        containerProps={inputContainerProps}
                                        onChange={(event) =>
                                            setSetting('numProcesses', event.target.value)
                                        }
                                    />
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        Usually one process per GPU.
                                    </p>
                                </div>
                                <div>
                                    <Input
                                        type="number"
                                        min={1}
                                        size="lg"
                                        label="Machines"
                                        value={settings.numMachines}
                                        containerProps={inputContainerProps}
                                        onChange={(event) =>
                                            setSetting('numMachines', event.target.value)
                                        }
                                    />
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        Keep at one for a single workstation or pod.
                                    </p>
                                </div>
                                <div className="sm:col-span-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        size="lg"
                                        label="CPU threads per process (optional)"
                                        value={settings.numCpuThreadsPerProcess}
                                        containerProps={inputContainerProps}
                                        onChange={(event) =>
                                            setSetting(
                                                'numCpuThreadsPerProcess',
                                                event.target.value
                                            )
                                        }
                                    />
                                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                                        Leave blank to use each trainer’s recommended value.
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <aside className="lg:sticky lg:top-5">
                    <Card className="border border-border shadow-sm">
                        <CardBody className="p-5">
                            <div className="flex items-center gap-3">
                                <InformationCircleIcon className="h-6 w-6 text-primary" />
                                <Typography variant="h5" color="blue-gray">
                                    Current launch
                                </Typography>
                            </div>
                            <dl className="mt-5 flex flex-col gap-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Dynamo</dt>
                                    <dd className="font-mono font-medium text-foreground">
                                        {settings.dynamoBackend}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Processes</dt>
                                    <dd className="font-mono font-medium text-foreground">
                                        {settings.numProcesses || '1'}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-muted-foreground">Machines</dt>
                                    <dd className="font-mono font-medium text-foreground">
                                        {settings.numMachines || '1'}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-border pt-3">
                                    <dt className="text-muted-foreground">CPU threads</dt>
                                    <dd className="text-right font-mono font-medium text-foreground">
                                        {cpuThreads}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-border pt-3">
                                    <dt className="text-muted-foreground">HF downloads</dt>
                                    <dd className="text-right font-medium text-foreground">
                                        {hfToken ? 'Token ready' : 'Server/default auth'}
                                    </dd>
                                </div>
                            </dl>
                            <p className="mt-5 rounded-lg bg-accent p-3 text-xs leading-5 text-primary">
                                Acceleration changes are saved automatically in this browser. Model
                                and save precision stay on each training page.
                            </p>
                        </CardBody>
                    </Card>
                </aside>
            </div>
        </main>
    )
}

export default Settings
