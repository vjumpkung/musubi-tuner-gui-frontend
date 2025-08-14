import { Button, Card, CardBody, Typography } from '@material-tailwind/react'

const TrainingButton = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <div className="flex-1">
                <Button color="blue" className="w-full" size="lg">
                    Print Training Command
                </Button>
            </div>
            <div className="flex-1">
                <Button color="indigo" className="w-full" size="lg">
                    Start Training
                </Button>
            </div>
        </CardBody>
    </Card>
)

export default TrainingButton
