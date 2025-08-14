import { Card, CardBody, Option, Select, Typography } from '@material-tailwind/react'

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

const WanTask = () => (
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
)

export default WanTask
