import TerminalComponent from './terminal'
import { CommandLineIcon } from '@heroicons/react/24/outline'
import { Card, Typography } from '@material-tailwind/react'

const LogViewer = () => (
    <main className="mx-auto w-full max-w-7xl p-3 pb-12 sm:p-5 sm:pb-12">
        <header className="mb-6 rounded-xl border border-blue-gray-100 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                <CommandLineIcon className="h-4 w-4" />
                Live output
            </div>
            <Typography variant="h1" color="blue-gray">
                Logs
            </Typography>
            <p className="mt-2 max-w-2xl text-base leading-7 text-blue-gray-600">
                Follow trainer and download output as it streams from your environment.
            </p>
        </header>
        <Card className="overflow-hidden border border-blue-gray-100 shadow-sm">
            <TerminalComponent />
        </Card>
    </main>
)

export default LogViewer
