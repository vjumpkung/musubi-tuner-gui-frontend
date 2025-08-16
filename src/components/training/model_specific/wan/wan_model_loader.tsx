import { Card, CardBody, Input, Typography } from '@material-tailwind/react'

const WanModelLoader = () => (
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
                    CLIP (for i2v)
                </Typography>
                <Input label="Put clip path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    VAE
                </Typography>
                <Input label="Put vae path" />
            </div>
        </CardBody>
    </Card>
)

export default WanModelLoader
