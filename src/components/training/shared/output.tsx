import { Card, CardBody, Input, Typography } from '@material-tailwind/react'

const TrainingOutput = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">LoRA Project Configuration</Typography>
            <div className="flex flex-row gap-3 justify-between w-full">
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Output name
                    </Typography>
                    <Input label="Trained Model output name" />
                </div>
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Output directory
                    </Typography>
                    <Input label="Output directory for trained model" />
                </div>
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Dataset config file
                </Typography>
                <Input label="Dataset Configuration (.toml)" />
            </div>
        </CardBody>
    </Card>
)

export default TrainingOutput
