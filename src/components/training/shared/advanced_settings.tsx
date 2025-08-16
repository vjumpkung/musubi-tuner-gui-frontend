import {
    Card,
    CardBody,
    Checkbox,
    Input,
    Option,
    Select,
    Slider,
    Typography
} from '@material-tailwind/react'

const timesteps_sampling_choice = [
    'sigma',
    'uniform',
    'sigmoid',
    'shift',
    'flux_shift',
    'qwen_shift',
    'logsnr',
    'qinglong_flux',
    'qinglong_qwen'
]

const AdvancedSettings = () => {
    return (
        <Card>
            <CardBody className="flex flex-col gap-3">
                <Typography variant="h3">Advanced Settings</Typography>
                <div className="flex flex-row gap-3 w-full">
                    <Checkbox label={<Typography className="font-normal">fp8</Typography>} />
                    <Checkbox label={<Typography className="font-normal">fp8-scaled</Typography>} />
                    <Checkbox
                        label={
                            <Typography className="font-normal">Gradient Checkpointing</Typography>
                        }
                    />
                    <Checkbox
                        label={
                            <Typography className="font-normal">
                                Persistent data loader workers
                            </Typography>
                        }
                    />
                </div>
                <div>
                    <Typography className="mt-1 mb-1" variant="lead">
                        Timestep Sampling
                    </Typography>
                    <Select label="timestep_sampling">
                        {timesteps_sampling_choice.map((k, v) => (
                            <Option key={k} value={k}>
                                {k}
                            </Option>
                        ))}
                    </Select>
                </div>
                <div className="flex flex-row gap-3 justify-between w-full">
                    <div className="flex-1">
                        <Typography className="mt-1 mb-1" variant="lead">
                            Discrete Flow Shift
                        </Typography>

                        <Input label="Value" defaultValue={1.0} />
                    </div>
                    <div className="flex-1">
                        <Typography className="mt-1 mb-1" variant="lead">
                            Max Data Loader n workers (for faster dataset loading)
                        </Typography>
                        <Input label="Value" defaultValue={1} />
                    </div>
                </div>
                <div>
                    <Typography className="mt-1 mb-1" variant="lead">
                        Cache Text Encoder Batch Size
                    </Typography>
                    <Input label="Value" defaultValue={16} />
                </div>
                <div>
                    <Typography className="mt-1 mb-1" variant="lead">
                        Attention Model
                    </Typography>
                    <Select label="Value">
                        <Option value={'sdpa'}>sdpa</Option>
                        <Option value={'xformers'}>xformers</Option>
                    </Select>
                </div>
                <div className="flex flex-row gap-3 justify-between w-full">
                    <div className="flex-1">
                        <Typography className="mt-1 mb-1" variant="lead">
                            Min Timestep
                        </Typography>
                        <Input label="Value" defaultValue={0} />
                    </div>
                    <div className="flex-1">
                        <Typography className="mt-1 mb-1" variant="lead">
                            Max Timestep
                        </Typography>
                        <Input label="Value" defaultValue={1000} />
                    </div>
                </div>
                <div className="flex-none">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Blocks to swap
                    </Typography>
                    <Input label="Value" defaultValue={0} />
                </div>
                <div>
                    <Typography className="mt-1 mb-1" variant="lead">
                        Extra Args
                    </Typography>
                    <Input label="extra args goes here" />
                </div>
            </CardBody>
        </Card>
    )
}

export default AdvancedSettings
