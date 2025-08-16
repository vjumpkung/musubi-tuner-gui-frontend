import { Card, CardBody, Checkbox, Input, Typography } from '@material-tailwind/react'

const QwenAdditional = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Additional QWEN Image settings</Typography>
            <div className="flex flex-row gap-3 w-full">
                <Checkbox label={<Typography className="font-normal">{'fp8_vl'}</Typography>} />
                <Checkbox label={<Typography className="font-normal">{'split_attn'}</Typography>} />
            </div>
        </CardBody>
    </Card>
)

export default QwenAdditional
