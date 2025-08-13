import { Card, CardBody, Checkbox, Option, Select, Typography } from '@material-tailwind/react'

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
                <div className="flex flex-row gap-3 justify-between w-full">
                    <Checkbox label={<Typography className="font-normal">fp8-base</Typography>} />
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
            </CardBody>
        </Card>
    )
}

export default AdvancedSettings
