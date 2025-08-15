import { Card, CardBody, Input, Typography } from '@material-tailwind/react'

const FluxKontextModelLoader = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Load Pretrained Model</Typography>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    DiT
                </Typography>
                <Input label="Put Flux Kontext Dev DiT path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Text Encoder
                </Typography>
                <Input label="Put T5XXL path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Text Encoder 2
                </Typography>
                <Input label="Put CLIP-L path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    VAE
                </Typography>
                <Input label="Put ae path" />
            </div>
        </CardBody>
    </Card>
)
export default FluxKontextModelLoader
