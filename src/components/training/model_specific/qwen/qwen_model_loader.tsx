import { Card, CardBody, Input, Typography } from '@material-tailwind/react'

const QwenModelLoader = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Load Pretrained Model</Typography>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    DiT
                </Typography>
                <Input label="Put QWEN DiT path" />
            </div>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Text Encoder
                </Typography>
                <Input label="Put QWEN 2.5 VL path" />
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

export default QwenModelLoader
