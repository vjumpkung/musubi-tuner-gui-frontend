import { ChevronDownIcon } from '@heroicons/react/24/solid'
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
    const [openAdvanced, setOpenAdvanced] = useState<boolean>(false)
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
                        <Select label="Select Scheduler">
                            {learning_rate_list.map((item, idx) => (
                                <Option key={idx + item} value={item}>
                                    {item}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
                <Accordion
                    open={openAdvanced}
                    icon={
                        <ChevronDownIcon
                            strokeWidth={2.5}
                            className={`mx-auto h-4 w-4 transition-transform ${openAdvanced ? 'rotate-180' : ''}`}
                        />
                    }
                >
                    <AccordionHeader
                        onClick={() => {
                            setOpenAdvanced(!openAdvanced)
                        }}
                    >
                        <Typography variant="h4" className=" text-gray-600">
                            Additional Learning Rate Settings
                        </Typography>
                    </AccordionHeader>
                    <AccordionBody>
                        <div className="flex flex-row gap-3">
                            <div className="flex-1">
                                <Typography className="mt-3 mb-3 font-normal" variant="small">
                                    Learning Rate Warmup Steps (% of total steps)
                                </Typography>
                                <Input label="lr_warmup_steps" type="number" />
                            </div>
                        </div>
                        <div className="flex flex-row gap-3">
                            <div className="flex-1">
                                <Typography className="mt-3 mb-3 font-normal" variant="small">
                                    Learning Rate Scheduler Power
                                </Typography>
                                <Input label="lr_scheduler_power" type="number" />
                            </div>
                            <div className="flex-1">
                                <Typography className="mt-3 mb-3 font-normal" variant="small">
                                    Learning Rate Minimum Learning Rate Ratio
                                </Typography>
                                <Input label="lr_scheduler_min_lr_ratio" type="number" />
                            </div>
                            <div className="flex-1">
                                <Typography className="mt-3 mb-3 font-normal" variant="small">
                                    Learning Rate Scheduler Number of Cycles
                                </Typography>
                                <Input label="lr_scheduler_num_cycles" type="number" />
                            </div>
                        </div>
                    </AccordionBody>
                </Accordion>
            </CardBody>
        </Card>
    )
}

export default LearningRate
