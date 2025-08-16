import { Card, CardBody, Checkbox, Input, Typography } from '@material-tailwind/react'

const WanAdditional = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Additional WAN settings</Typography>
            <div className="flex flex-row gap-3 w-full">
                <Checkbox label={<Typography className="font-normal">{'fp8_t5'}</Typography>} />
                <Checkbox
                    label={<Typography className="font-normal">{'vae_cache_cpu'}</Typography>}
                />
            </div>
            <Typography className="" variant="lead">
                Timestep Boundary
            </Typography>
            <Input label="timestep_boundary" />
        </CardBody>
    </Card>
)

export default WanAdditional
