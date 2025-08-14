import {
    Card,
    CardBody,
    Checkbox,
    Input,
    Option,
    Select,
    Typography
} from '@material-tailwind/react'

const HuggingfaceUpload = () => (
    <Card>
        <CardBody className="flex flex-col gap-3">
            <Typography variant="h3">Upload to Huggingface</Typography>
            <div>
                <Typography className="mt-1 mb-1" variant="lead">
                    Huggingface Token
                </Typography>
                <Input label="put huggingface token" type="password" />
            </div>
            <div className="flex flex-row flex-wrap gap-3 w-full">
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Repository ID
                    </Typography>
                    <Input label="huggingface repo id" placeholder="example pixellatent/model_1" />
                </div>
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Repository Type
                    </Typography>
                    <Select label="Huggingface Repo Type">
                        {['model', 'dataset', 'space'].map((k, v) => (
                            <Option key={k} value={k}>
                                {k}
                            </Option>
                        ))}
                    </Select>
                </div>
            </div>
            <div className="flex flex-row flex-wrap gap-3 w-full">
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Huggingface path in repository
                    </Typography>
                    <Input label="put relative path in repo" />
                </div>
                <div className="flex-1">
                    <Typography className="mt-1 mb-1" variant="lead">
                        Huggingface repository visibility
                    </Typography>
                    <Select label="Huggingface Repo Type">
                        {['private', 'public'].map((k, v) => (
                            <Option key={k} value={k}>
                                {k}
                            </Option>
                        ))}
                    </Select>
                </div>
            </div>
            <Checkbox label={<Typography className="font-normal">async upload</Typography>} />
        </CardBody>
    </Card>
)

export default HuggingfaceUpload
