import {
    Cog6ToothIcon,
    CommandLineIcon,
    InformationCircleIcon,
    PhotoIcon,
    SparklesIcon
} from '@heroicons/react/24/solid'
import { Card, List, ListItem, ListItemPrefix, Typography } from '@material-tailwind/react'

const SideBar = () => (
    <Card className="h-screen w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5 fixed z-1 overflow-x-hidden">
        <div className="mb-2 p-4">
            <Typography variant="h5" color="blue-gray">
                Musubi Tuner GUI
            </Typography>
            <Typography>by PixelLatent</Typography>
        </div>
        <List>
            <ListItem>
                <ListItemPrefix>
                    <SparklesIcon className="w-5 h-5" />
                </ListItemPrefix>
                Training
            </ListItem>
            <ListItem>
                <ListItemPrefix>
                    <PhotoIcon className="w-5 h-5" />
                </ListItemPrefix>
                Inference
            </ListItem>
            <ListItem>
                <ListItemPrefix>
                    <CommandLineIcon className="w-5 h-5" />
                </ListItemPrefix>
                Logs
            </ListItem>
            <ListItem>
                <ListItemPrefix>
                    <Cog6ToothIcon className="w-5 h-5" />
                </ListItemPrefix>
                Settings
            </ListItem>
            <ListItem>
                <ListItemPrefix>
                    <InformationCircleIcon className="h-5 w-5" />
                </ListItemPrefix>
                About
            </ListItem>
        </List>
    </Card>
)

export default SideBar
