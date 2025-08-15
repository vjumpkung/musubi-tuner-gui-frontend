import { Card, CardBody, Input, Typography } from '@material-tailwind/react'

const FramepackModelLoader = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Load Pretrained Model</Typography>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    DiT
                </Typography>
                <Input label="Put Framepack DiT path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Text Encoder
                </Typography>
                <Input label="Put llava llama3 path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Text Encoder 2
                </Typography>
                <Input label="Put CLIP-L path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Image Encoder
                </Typography>
                <Input label="Put SigLIP path" />
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
export default FramepackModelLoader
