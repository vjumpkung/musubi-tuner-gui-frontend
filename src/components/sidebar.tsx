import {
    ChevronDownIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    CommandLineIcon,
    InformationCircleIcon,
    PhotoIcon,
    SparklesIcon
} from '@heroicons/react/24/solid'
import {
    Accordion,
    AccordionBody,
    AccordionHeader,
    Card,
    List,
    ListItem,
    ListItemPrefix,
    Typography
} from '@material-tailwind/react'
import { useState } from 'react'

const SideBar = () => {
    const [openTraining, setOpenTraining] = useState<boolean>(true)
    const [openInference, setOpenInference] = useState<boolean>(false)

    return (
        <Card className="h-screen w-full max-w-[20rem] p-4 shadow-xl shadow-blue-gray-900/5 fixed z-1 overflow-x-hidden">
            <div className="mb-2 p-4">
                <Typography variant="h5" color="blue-gray">
                    Musubi Tuner GUI
                </Typography>
                <Typography>by PixelLatent</Typography>
            </div>
            <List>
                <Accordion
                    open={openTraining}
                    icon={
                        <ChevronDownIcon
                            strokeWidth={2.5}
                            className={`mx-auto h-4 w-4 transition-transform ${openTraining ? 'rotate-180' : ''}`}
                        />
                    }
                >
                    <ListItem className="p-0">
                        <AccordionHeader
                            onClick={() => setOpenTraining(!openTraining)}
                            className="border-b-0 p-3"
                        >
                            <ListItemPrefix>
                                <SparklesIcon className="w-5 h-5" />
                            </ListItemPrefix>
                            <Typography className="mr-auto font-normal">Training</Typography>
                        </AccordionHeader>
                    </ListItem>
                    <AccordionBody className="py-1">
                        <List className="p-0">
                            <ListItem>
                                <ListItemPrefix>
                                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                                </ListItemPrefix>
                                WAN Network Trainer
                            </ListItem>
                            <ListItem>
                                <ListItemPrefix>
                                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                                </ListItemPrefix>
                                QWEN Image Network Trainer
                            </ListItem>
                            <ListItem>
                                <ListItemPrefix>
                                    <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                                </ListItemPrefix>
                                Flux Kontext Network Trainer
                            </ListItem>
                        </List>
                    </AccordionBody>
                </Accordion>
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
}

export default SideBar
