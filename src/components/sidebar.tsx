import { authApi, queryKeys } from '../api/api'
import useAuthStatus from '../hooks/useAuthStatus'
import useManagedUploadGuard from '../hooks/useManagedUploadGuard'
import useMenuBar, { Menu } from '../hooks/useMenubar'
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog'
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
} from '@/components/ui/legacy'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
    MenuIcon as Bars3Icon,
    PanelLeftCloseIcon as ChevronDoubleLeftIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    SettingsIcon as Cog6ToothIcon,
    SquareTerminalIcon as CommandLineIcon,
    DatabaseIcon as CircleStackIcon,
    CloudDownloadIcon as CloudArrowDownIcon,
    InfoIcon as InformationCircleIcon,
    LogOutIcon,
    SparklesIcon
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

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
    { menu: Menu.Z_IMAGE_TRAINER, label: 'Z-Image' },
    { menu: Menu.HIDREAM_TRAINER, label: 'HiDream O1' },
    { menu: Menu.IDEOGRAM_TRAINER, label: 'Ideogram 4' },
    { menu: Menu.KANDINSKY_TRAINER, label: 'Kandinsky 5' },
    { menu: Menu.KREA_TRAINER, label: 'Krea 2' },
    { menu: Menu.MINIMAX_H3_TRAINER, label: 'MiniMax H3' }
]

type SideBarProps = {
    collapsed: boolean
    onToggleCollapsed: () => void
    onNavigationStart: () => void
    onNavigationComplete: () => void
}

type NavigationBodyProps = {
    menu: Menu
    openTraining: boolean
    onToggleTraining: () => void
    onSelectMenu: (target: Menu) => void
}

type LogoutSectionProps = {
    pending: boolean
    disabled: boolean
    failed: boolean
    onLogout: () => void
}

const LogoutSection = ({ pending, disabled, failed, onLogout }: LogoutSectionProps) => (
    <div className="mt-2 border-t border-border pt-2">
        <List>
            <ListItem
                className="disabled:pointer-events-none disabled:opacity-50"
                disabled={disabled}
                title={disabled && !pending ? 'Wait for the dataset upload to finish' : undefined}
                onClick={onLogout}
            >
                <ListItemPrefix>
                    <LogOutIcon className="h-5 w-5" />
                </ListItemPrefix>
                {pending ? 'Logging out…' : 'Log out'}
            </ListItem>
        </List>
        {failed ? (
            <p role="alert" className="px-3 pt-1 text-xs text-destructive">
                Could not log out. Try again.
            </p>
        ) : null}
    </div>
)

const NavigationBody = ({
    menu,
    openTraining,
    onToggleTraining,
    onSelectMenu
}: NavigationBodyProps) => {
    const trainingPanelId = useId()
    const menuItemProps = (target: Menu) => {
        const active = menu === target

        return {
            selected: active,
            'aria-current': active ? ('page' as const) : undefined,
            className: cn(
                active &&
                    'bg-accent font-medium text-accent-foreground hover:bg-accent focus:bg-accent'
            ),
            onClick: () => onSelectMenu(target)
        }
    }

    return (
        <nav aria-label="Main navigation">
            <List>
                <Accordion
                    open={openTraining}
                    icon={
                        <ChevronDownIcon
                            strokeWidth={2.5}
                            className={cn(
                                'mx-auto h-4 w-4 transition-transform motion-reduce:transition-none',
                                openTraining && 'rotate-180'
                            )}
                        />
                    }
                >
                    <AccordionHeader
                        onClick={onToggleTraining}
                        aria-expanded={openTraining}
                        aria-controls={trainingPanelId}
                        className="min-h-9 gap-2 border-b-0 p-3 text-sm hover:bg-accent"
                    >
                        <ListItemPrefix>
                            <SparklesIcon className="h-5 w-5" />
                        </ListItemPrefix>
                        <Typography as="span" className="mr-auto font-normal">
                            Training
                        </Typography>
                    </AccordionHeader>
                    <AccordionBody id={trainingPanelId} className="py-1">
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
                    Jobs
                </ListItem>
                <ListItem {...menuItemProps(Menu.SETTINGS)}>
                    <ListItemPrefix>
                        <Cog6ToothIcon className="h-5 w-5" />
                    </ListItemPrefix>
                    Settings
                </ListItem>
                <ListItem {...menuItemProps(Menu.ABOUT)}>
                    <ListItemPrefix>
                        <InformationCircleIcon className="h-5 w-5" />
                    </ListItemPrefix>
                    About
                </ListItem>
            </List>
        </nav>
    )
}

const SideBar = ({
    collapsed,
    onToggleCollapsed,
    onNavigationStart,
    onNavigationComplete
}: SideBarProps) => {
    const [openTraining, setOpenTraining] = useState<boolean>(true)
    const [mobileOpen, setMobileOpen] = useState(false)
    const navigationPendingRef = useRef(false)
    const showSidebarRef = useRef<HTMLButtonElement>(null)
    const hideSidebarRef = useRef<HTMLButtonElement>(null)

    const menu = useMenuBar((state) => state.menu)
    const setMenuBar = useMenuBar((state) => state.setMenuBar)
    const uploading = useManagedUploadGuard()
    const [uploadBlockedOpen, setUploadBlockedOpen] = useState(false)
    const blockedFocusRef = useRef<HTMLElement | null>(null)
    const queryClient = useQueryClient()
    const authQuery = useAuthStatus()
    const logoutMutation = useMutation({
        mutationFn: authApi.logout,
        onSuccess: () => {
            // Drop everything cached for the old session but keep the auth query itself, so the
            // app gate (which observes it) switches to the login page.
            queryClient.removeQueries({
                predicate: (query) => query.queryKey[0] !== queryKeys.auth[0]
            })
            queryClient.setQueryData(queryKeys.auth, { enabled: true, authenticated: false })
        }
    })
    const logoutSection = authQuery.data?.enabled ? (
        <LogoutSection
            pending={logoutMutation.isPending}
            disabled={logoutMutation.isPending || uploading}
            failed={logoutMutation.isError}
            onLogout={() => logoutMutation.mutate()}
        />
    ) : null

    useEffect(() => {
        const desktopMedia = window.matchMedia('(min-width: 64rem)')
        const closeOnDesktop = () => {
            if (desktopMedia.matches) setMobileOpen(false)
        }

        desktopMedia.addEventListener('change', closeOnDesktop)
        return () => desktopMedia.removeEventListener('change', closeOnDesktop)
    }, [])

    const selectMenu = (target: Menu) => {
        if (uploading && target !== menu) {
            blockedFocusRef.current =
                document.activeElement instanceof HTMLElement ? document.activeElement : null
            setUploadBlockedOpen(true)
            return
        }
        if (mobileOpen && target !== menu) {
            navigationPendingRef.current = true
            onNavigationStart()
        }
        setMenuBar(target)
        setMobileOpen(false)
    }

    return (
        <>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card px-3 py-2 lg:hidden">
                    <SheetTrigger asChild>
                        <IconButton
                            variant="text"
                            color="blue-gray"
                            aria-label="Open navigation menu"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </IconButton>
                    </SheetTrigger>
                    <Typography as="p" variant="h6" color="blue-gray">
                        Musubi Tuner GUI
                    </Typography>
                </div>
                <SheetContent
                    side="left"
                    aria-modal="true"
                    className="max-w-[20rem] overflow-y-auto overscroll-contain p-4 data-[side=left]:w-full data-[side=left]:sm:max-w-[20rem]"
                    onCloseAutoFocus={(event) => {
                        if (navigationPendingRef.current) {
                            event.preventDefault()
                            navigationPendingRef.current = false
                            onNavigationComplete()
                        } else if (window.matchMedia('(min-width: 64rem)').matches) {
                            event.preventDefault()
                            const toggleRef = collapsed ? showSidebarRef : hideSidebarRef
                            toggleRef.current?.focus()
                        }
                    }}
                >
                    <SheetHeader className="mb-2">
                        <SheetTitle asChild>
                            <Typography as="p" variant="h5" color="blue-gray">
                                Musubi Tuner GUI
                            </Typography>
                        </SheetTitle>
                        <Typography as="p" className="text-sm text-muted-foreground">
                            by PixelLatent
                        </Typography>
                        <SheetDescription className="sr-only">
                            Choose a training model or application page.
                        </SheetDescription>
                    </SheetHeader>
                    <NavigationBody
                        menu={menu}
                        openTraining={openTraining}
                        onToggleTraining={() => setOpenTraining((current) => !current)}
                        onSelectMenu={selectMenu}
                    />
                    {logoutSection}
                </SheetContent>
            </Sheet>
            {collapsed ? (
                <div className="fixed left-3 top-3 z-30 hidden lg:block">
                    <IconButton
                        ref={showSidebarRef}
                        variant="text"
                        color="blue-gray"
                        className="border border-border bg-card shadow-md"
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
                    'fixed left-0 top-0 z-50 hidden h-screen w-full max-w-[20rem] overflow-x-hidden overflow-y-auto rounded-none p-4 [scrollbar-width:none] shadow-xl shadow-foreground/5 [&::-webkit-scrollbar]:hidden',
                    !collapsed && 'lg:flex'
                )}
            >
                <div className="mb-2 flex items-start justify-between p-4">
                    <div>
                        <Typography as="p" variant="h5" color="blue-gray">
                            Musubi Tuner GUI
                        </Typography>
                        <Typography as="p" className="text-sm text-muted-foreground">
                            by PixelLatent
                        </Typography>
                    </div>
                    <IconButton
                        ref={hideSidebarRef}
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
                </div>
                <NavigationBody
                    menu={menu}
                    openTraining={openTraining}
                    onToggleTraining={() => setOpenTraining((current) => !current)}
                    onSelectMenu={selectMenu}
                />
                {logoutSection}
            </Card>
            <AlertDialog open={uploadBlockedOpen} onOpenChange={setUploadBlockedOpen}>
                <AlertDialogContent
                    onCloseAutoFocus={(event) => {
                        event.preventDefault()
                        const previousFocus = blockedFocusRef.current
                        blockedFocusRef.current = null
                        if (previousFocus?.isConnected) previousFocus.focus()
                    }}
                >
                    <AlertDialogHeader>
                        <AlertDialogTitle>Upload in progress</AlertDialogTitle>
                        <AlertDialogDescription>
                            Wait for the dataset upload to finish before switching pages. Leaving
                            now would lose track of its progress and result.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel variant="default">Stay on this page</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export default SideBar
