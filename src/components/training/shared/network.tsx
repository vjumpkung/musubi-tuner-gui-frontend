import { Card, CardBody, Input, Typography } from '@material-tailwind/react'

const LoRANetwork = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Network Settings</Typography>
            <div className="flex flex-row gap-3">
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Network Dimension
                    </Typography>
                    <Input
                        type="number"
                        defaultValue={4}
                        min={1}
                        max={512}
                        label="Network Dimension aka. Rank / DIM"
                    />
                </div>
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Network Alpha
                    </Typography>
                    <Input type="number" defaultValue={1} min={1} max={10000} label="Alpha" />
                </div>
            </div>
            <div className="flex-1">
                <Typography className="mt-1 mb-1" variant="lead">
                    Network Args (Optional)
                </Typography>
                <Input label="Additional network args" />
            </div>
        </CardBody>
    </Card>
)

export default LoRANetwork
