import useMenuBar, { Menu } from '../hooks/useMenubar'
import { cn } from '../utils/cn'
import {
    Bars3Icon,
    ChevronDoubleLeftIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    CommandLineIcon,
    CircleStackIcon,
    CloudArrowDownIcon,
    InformationCircleIcon,
    SparklesIcon,
    XMarkIcon
} from '@heroicons/react/24/solid'
import {
    Accordion,
    AccordionBody,
    AccordionHeader,
    Card,
    IconButton,
    List,
    ListItem,
    ListItemPrefix,
    Typography
} from '@material-tailwind/react'
import { type KeyboardEvent, useEffect, useState } from 'react'

const trainingItems = [
    { menu: Menu.HV_TRAINER, label: 'Hunyuan Video' },
    { menu: Menu.HV_15_TRAINER, label: 'HunyuanVideo 1.5' },
    { menu: Menu.FRAMEPACK_TRAINER, label: 'FramePack' },
    { menu: Menu.FRAMEPACK_ONE_FRAME_TRAINER, label: 'FramePack One-Frame' },
    { menu: Menu.WAN_TRAINER, label: 'WAN 2.2' },
    { menu: Menu.WAN_ONE_FRAME_TRAINER, label: 'WAN One-Frame' },
    { menu: Menu.KONTEXT_TRAINER, label: 'FLUX.1 Kontext' },
    { menu: Menu.FLUX_2_TRAINER, label: 'FLUX.2' },
    { menu: Menu.QWEN_TRAINER, label: 'Qwen Image' },
    { menu: Menu.Z_IMAGE_TRAINER, label: 'Z-Image Turbo' },
    { menu: Menu.HIDREAM_TRAINER, label: 'HiDream O1' },
    { menu: Menu.IDEOGRAM_TRAINER, label: 'Ideogram 4' },
    { menu: Menu.KANDINSKY_TRAINER, label: 'Kandinsky 5' },
    { menu: Menu.KREA_TRAINER, label: 'Krea 2' }
]

type SideBarProps = {
    collapsed: boolean
    onToggleCollapsed: () => void
}

const SideBar = ({ collapsed, onToggleCollapsed }: SideBarProps) => {
    const [openTraining, setOpenTraining] = useState<boolean>(true)
    const [mobileOpen, setMobileOpen] = useState(false)

    const menu = useMenuBar((state) => state.menu)
    const setMenuBar = useMenuBar((state) => state.setMenuBar)

    useEffect(() => {
        if (!mobileOpen) return

        const closeOnEscape = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') setMobileOpen(false)
        }

        window.addEventListener('keydown', closeOnEscape)
        return () => window.removeEventListener('keydown', closeOnEscape)
    }, [mobileOpen])

    const selectMenu = (target: Menu) => {
        setMenuBar(target)
        setMobileOpen(false)
    }

    const menuItemProps = (target: Menu) => {
        const active = menu === target

        return {
            selected: active,
            'aria-current': active ? ('page' as const) : undefined,
            className: cn(
                active && 'bg-blue-50 font-medium text-blue-700 hover:bg-blue-50 focus:bg-blue-50'
            ),
            onClick: () => selectMenu(target),
            onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectMenu(target)
                }
            }
        }
    }

    return (
        <>
            <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-blue-gray-100 bg-white px-3 py-2 lg:hidden">
                <IconButton
                    variant="text"
                    color="blue-gray"
                    aria-label="Open navigation menu"
                    aria-expanded={mobileOpen}
                    onClick={() => setMobileOpen(true)}
                >
                    <Bars3Icon className="h-6 w-6" />
                </IconButton>
                <Typography variant="h6" color="blue-gray">
                    Musubi Tuner GUI
                </Typography>
            </div>
            {mobileOpen ? (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    aria-hidden="true"
                    onClick={() => setMobileOpen(false)}
                />
            ) : null}
            {collapsed ? (
                <div className="fixed left-3 top-3 z-30 hidden lg:block">
                    <IconButton
                        variant="text"
                        color="blue-gray"
                        className="border border-blue-gray-100 bg-white shadow-md"
                        aria-label="Show sidebar"
                        aria-expanded={false}
                        onClick={onToggleCollapsed}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </IconButton>
                </div>
            ) : null}
            <Card
                className={cn(
                    'fixed left-0 top-0 z-50 h-screen w-full max-w-[20rem] overflow-x-hidden overflow-y-auto rounded-none p-4 shadow-xl shadow-blue-gray-900/5',
                    mobileOpen ? 'flex' : 'hidden',
                    collapsed ? 'lg:hidden' : 'lg:flex'
                )}
            >
                <div className="mb-2 flex items-start justify-between p-4">
                    <div>
                        <Typography variant="h5" color="blue-gray">
                            Musubi Tuner GUI
                        </Typography>
                        <Typography className="text-sm text-blue-gray-600">
                            by PixelLatent
                        </Typography>
                    </div>
                    <IconButton
                        variant="text"
                        color="blue-gray"
                        size="sm"
                        className="hidden items-center justify-center lg:inline-flex"
                        aria-label="Hide sidebar"
                        aria-expanded={true}
                        onClick={onToggleCollapsed}
                    >
                        <ChevronDoubleLeftIcon className="h-5 w-5" />
                    </IconButton>
                    <IconButton
                        variant="text"
                        color="blue-gray"
                        size="sm"
                        className="lg:hidden"
                        aria-label="Close navigation menu"
                        onClick={() => setMobileOpen(false)}
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </IconButton>
                </div>
                <List aria-label="Main navigation">
                    <Accordion
                        open={openTraining}
                        icon={
                            <ChevronDownIcon
                                strokeWidth={2.5}
                                className={cn(
                                    'mx-auto h-4 w-4 transition-transform',
                                    openTraining && 'rotate-180'
                                )}
                            />
                        }
                    >
                        <ListItem className="p-0">
                            <AccordionHeader
                                onClick={() => setOpenTraining(!openTraining)}
                                className="border-b-0 p-3"
                            >
                                <ListItemPrefix>
                                    <SparklesIcon className="h-5 w-5" />
                                </ListItemPrefix>
                                <Typography className="mr-auto font-normal">Training</Typography>
                            </AccordionHeader>
                        </ListItem>
                        <AccordionBody className="py-1">
                            <List className="p-0">
                                {trainingItems.map((item) => (
                                    <ListItem key={item.menu} {...menuItemProps(item.menu)}>
                                        <ListItemPrefix>
                                            <ChevronRightIcon strokeWidth={3} className="h-3 w-5" />
                                        </ListItemPrefix>
                                        {item.label}
                                    </ListItem>
                                ))}
                            </List>
                        </AccordionBody>
                    </Accordion>
                    <ListItem {...menuItemProps(Menu.DOWNLOADS)}>
                        <ListItemPrefix>
                            <CloudArrowDownIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        Downloads
                    </ListItem>
                    <ListItem {...menuItemProps(Menu.DATASETS)}>
                        <ListItemPrefix>
                            <CircleStackIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        Datasets
                    </ListItem>
                    <ListItem {...menuItemProps(Menu.LOGS)}>
                        <ListItemPrefix>
                            <CommandLineIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        Logs
                    </ListItem>
                    <ListItem {...menuItemProps(Menu.SETTINGS)}>
                        <ListItemPrefix>
                            <Cog6ToothIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        Acceleration
                    </ListItem>
                    <ListItem {...menuItemProps(Menu.ABOUT)}>
                        <ListItemPrefix>
                            <InformationCircleIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        About
                    </ListItem>
                </List>
            </Card>
        </>
    )
}

export default SideBar
