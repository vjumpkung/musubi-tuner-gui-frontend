import { Card, CardBody, Input, Option, Select, Typography } from '@material-tailwind/react'

const optimizer_list = [
    {
        name: 'AdamW8bit',
        value: 'adamw8bit'
    },
    {
        name: 'AdamW',
        value: 'adamw'
    },
    {
        name: 'Adafactor',
        value: 'torch.optim.Adafactor'
    },
    {
        name: 'Lion',
        value: 'pytorch-optimizer.Lion'
    },
    {
        name: 'CAME',
        value: 'pytorch-optimizer.CAME'
    },
    {
        name: 'Prodigy',
        value: 'pytorch-optimizer.Prodigy'
    }
]

const Optimizer = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Optimizer</Typography>
            <div className="flex flex-row gap-3">
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Optimizer
                    </Typography>
                    <div>
                        <Select label="Select Optimizer">
                            {optimizer_list.map((item) => (
                                <Option key={item.value} value={item.value}>
                                    {item.name}
                                </Option>
                            ))}
                        </Select>
                    </div>
                </div>
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Optimizer args (Optional)
                    </Typography>
                    <Input label="Additional optimizer args" />
                </div>
            </div>
        </CardBody>
    </Card>
)

export default Optimizer
