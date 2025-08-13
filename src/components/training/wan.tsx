import AdvancedSettings from './shared/advancesettings'
import LearningRate from './shared/learningrate'
import LoRANetwork from './shared/network'
import Optimizer from './shared/optimizer'
import TrainingOutput from './shared/output'
import { Card, CardBody, Input, Option, Select, Typography } from '@material-tailwind/react'

const wan_task = [
    { value: 't2v-1.3B', name: 'WAN 2.1 Text To Video 1.3B' },
    { value: 't2v-14B', name: 'WAN 2.1 Text To Video 14B' },
    { value: 'i2v-14B', name: 'WAN 2.1 Image To Video 14B' },
    { value: 't2i-14B', name: 'WAN 2.1 Text To Image 14B' },
    { value: 't2v-1.3B-FC', name: 'WAN 2.1 Text To Video 1.3B Fun Control' },
    { value: 't2v-14B-FC', name: 'WAN 2.1 Text To Video 14B Fun Control' },
    { value: 'i2v-14B-FC', name: 'WAN 2.1 Image To Video 14B Fun Control' },
    { value: 't2v-A14B', name: 'WAN 2.2 Text To Video 14B' },
    { value: 'i2v-A14B', name: 'WAN 2.2 Image To Video 14B' }
]

const WanTrainer = () => (
    <div className="flex flex-col gap-3 m-3">
        <Typography variant="h1">WAN Trainer</Typography>
        <div className="flex flex-col gap-3 mb-5">
            <Card>
                <CardBody className="flex flex-col gap-3">
                    <Typography variant="h3">Task</Typography>
                    <div>
                        <Select label="Select Task">
                            {wan_task.map((item) => (
                                <Option key={item.value} value={item.value}>
                                    {item.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </CardBody>
            </Card>
            <Card>
                <CardBody className="flex flex-col gap-3">
                    <Typography variant="h3">Load Pretrained Model</Typography>
                    <div>
                        <Typography className="mt-1 mb-1" variant="lead">
                            DiT
                        </Typography>
                        <Input label="Put WAN2.1 or WAN2.2 DiT path" />
                    </div>
                    <div>
                        <Typography className="mt-1 mb-1" variant="lead">
                            DiT High Noise (for WAN2.2)
                        </Typography>
                        <Input label="Put WAN2.2 DiT High Noise path" />
                    </div>
                    <div>
                        <Typography className="mt-1 mb-1" variant="lead">
                            T5
                        </Typography>
                        <Input label="Put T5 path" />
                    </div>
                    <div>
                        <Typography className="mt-1 mb-1" variant="lead">
                            VAE
                        </Typography>
                        <Input label="Put vae path" />
                    </div>
                </CardBody>
            </Card>
            <TrainingOutput />
            <LoRANetwork />
            <Optimizer />
            <LearningRate />
            <AdvancedSettings />
        </div>
    </div>
)

export default WanTrainer
