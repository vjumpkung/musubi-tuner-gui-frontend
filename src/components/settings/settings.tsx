import useAccelerationSettings from '../../hooks/useAccelerationSettings'
import {
    ArrowPathIcon,
    BoltIcon,
    CpuChipIcon,
    InformationCircleIcon,
    ServerStackIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardBody, Input, Option, Select, Typography } from '@material-tailwind/react'

const inputContainerProps = { className: '!min-w-0 w-full' }

const Settings = () => {
    const settings = useAccelerationSettings((state) => state.settings)
    const setSetting = useAccelerationSettings((state) => state.setSetting)
    const resetSettings = useAccelerationSettings((state) => state.resetSettings)

    const cpuThreads = settings.numCpuThreadsPerProcess || 'trainer default'

    return (
        <main className="mx-auto w-full max-w-6xl p-3 pb-12 sm:p-5 sm:pb-12">
            <header className="mb-6 rounded-xl border border-blue-gray-100 bg-white p-5 shadow-sm sm:p-7">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-3xl">
                        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                            <BoltIcon className="h-4 w-4" />
                            Launch configuration
                        </div>
                        <Typography variant="h1" color="blue-gray">
                            Acceleration settings
                        </Typography>
                        <p className="mt-2 max-w-2xl text-base leading-7 text-blue-gray-600">
                            Set the shared Accelerate launch options used by every training page.
                            Changes are saved automatically in this browser and appear in generated
                            commands immediately.
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
                        Restore defaults
                    </Button>
                </div>
            </header>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
                <div className="space-y-5">
                    <Card className="border border-blue-gray-100 shadow-sm">
                        <CardBody className="p-5 sm:p-6">
                            <div className="mb-6 flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                                    <CpuChipIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <Typography variant="h5" color="blue-gray">
                                        Torch compilation
                                    </Typography>
                                    <p className="mt-1 text-sm leading-6 text-blue-gray-600">
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
                                    <p className="mt-2 text-xs leading-5 text-blue-gray-600">
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
                                    <p className="mt-2 text-xs leading-5 text-blue-gray-600">
                                        Used only when a Dynamo backend is enabled.
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border border-blue-gray-100 shadow-sm">
                        <CardBody className="p-5 sm:p-6">
                            <div className="mb-6 flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                                    <ServerStackIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <Typography variant="h5" color="blue-gray">
                                        Process topology
                                    </Typography>
                                    <p className="mt-1 text-sm leading-6 text-blue-gray-600">
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
                                    <p className="mt-2 text-xs leading-5 text-blue-gray-600">
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
                                    <p className="mt-2 text-xs leading-5 text-blue-gray-600">
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
                                    <p className="mt-2 text-xs leading-5 text-blue-gray-600">
                                        Leave blank to use each trainer’s recommended value.
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <aside className="lg:sticky lg:top-5">
                    <Card className="border border-blue-gray-100 shadow-sm">
                        <CardBody className="p-5">
                            <div className="flex items-center gap-3">
                                <InformationCircleIcon className="h-6 w-6 text-blue-700" />
                                <Typography variant="h5" color="blue-gray">
                                    Current launch
                                </Typography>
                            </div>
                            <dl className="mt-5 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <dt className="text-blue-gray-600">Dynamo</dt>
                                    <dd className="font-mono font-medium text-blue-gray-900">
                                        {settings.dynamoBackend}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-blue-gray-600">Processes</dt>
                                    <dd className="font-mono font-medium text-blue-gray-900">
                                        {settings.numProcesses || '1'}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <dt className="text-blue-gray-600">Machines</dt>
                                    <dd className="font-mono font-medium text-blue-gray-900">
                                        {settings.numMachines || '1'}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-4 border-t border-blue-gray-100 pt-3">
                                    <dt className="text-blue-gray-600">CPU threads</dt>
                                    <dd className="text-right font-mono font-medium text-blue-gray-900">
                                        {cpuThreads}
                                    </dd>
                                </div>
                            </dl>
                            <p className="mt-5 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                                Mixed precision stays model-specific and is selected on each
                                training page.
                            </p>
                        </CardBody>
                    </Card>
                </aside>
            </div>
        </main>
    )
}

export default Settings
