import TerminalComponent from './terminal'
import { Card, CardBody, Textarea, Typography } from '@material-tailwind/react'

const LogViewer = () => (
    <div className="flex flex-col gap-3 m-3">
        <Typography variant="h1" className="ml-5">
            Logs
        </Typography>
        <Card>
            <CardBody className="flex flex-col gap-3">
                <TerminalComponent />
            </CardBody>
        </Card>
    </div>
)

export default LogViewer
