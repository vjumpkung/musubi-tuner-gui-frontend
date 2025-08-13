import {
    Accordion,
    AccordionBody,
    AccordionHeader,
    Card,
    CardBody,
    Input,
    Option,
    Select,
    Typography
} from '@material-tailwind/react'
import { useState } from 'react'

const learning_rate_list = [
    'constant',
    'linear',
    'cosine',
    'cosine_with_restarts',
    'cosine_with_min_lr',
    'polynomial',
    'constant_with_warmup',
    'adafactor'
]

const LearningRate = () => {
    const [openAdvance, setOpenAdvance] = useState<boolean>(false)
    return (
        <Card>
            <CardBody className="flex flex-col gap-3">
                <Typography variant="h3">Learning Rate</Typography>
                <div>
                    <Typography className="mt-1 mb-1" variant="lead">
                        Learning Rate
                    </Typography>
                    <Input defaultValue={'1e-4'} label="Learning Rate" />
                </div>
                <div>
                    <Typography className="mt-1 mb-1" variant="lead">
                        Learning Rate Scheduler
                    </Typography>
                    <div>
                        <Select label="Select Task">
                            {learning_rate_list.map((item, idx) => (
                                <Option key={idx + item} value={item}>
                                    {item}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
                <Accordion open={openAdvance}>
                    <AccordionHeader
                        onClick={() => {
                            setOpenAdvance(!openAdvance)
                        }}
                    >
                        <Typography variant="h4" className=" text-gray-600">
                            Advanced Learning Rate Settings
                        </Typography>
                    </AccordionHeader>
                    <AccordionBody>
                        <div>
                            <Typography className="mt-1 mb-1 font-normal" variant="small">
                                Learning Rate Warmup Steps (% of total steps)
                            </Typography>
                            <Input defaultValue={'0.05'} label="lr_warmup_steps" />
                        </div>
                        <div>
                            <Typography className="mt-1 mb-1 font-normal" variant="small">
                                Learning Rate Scheduler Power (using with polynomial scheduler)
                            </Typography>
                            <Input defaultValue={'1'} label="lr_scheduler_power" />
                        </div>
                        <div>
                            <Typography className="mt-1 mb-1 font-normal" variant="small">
                                Learning Rate Minimum Learning Rate Ratio (using with
                                cosine_with_min_lr scheduler)
                            </Typography>
                            <Input defaultValue={'0.25'} label="lr_scheduler_min_lr_ratio" />
                        </div>
                        <div>
                            <Typography className="mt-1 mb-1 font-normal" variant="small">
                                Learning Rate Scheduler Number of Cycles (using with
                                cosine_with_restarts scheduler)
                            </Typography>
                            <Input defaultValue={'3'} label="lr_scheduler_num_cycles" />
                        </div>
                    </AccordionBody>
                </Accordion>
            </CardBody>
        </Card>
    )
}

export default LearningRate
