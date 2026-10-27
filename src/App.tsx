import About from './about/about'
import Datasets from './components/datasets/datasets'
import Downloads from './components/downloads/downloads'
import LogViewer from './components/logs/logs'
import Settings from './components/settings/settings'
import SideBar from './components/sidebar'
import { type TrainingProfile, trainingProfiles } from './components/training/profiles'
import TrainingWorkspace from './components/training/shared/training_workspace'
import useMenuBar, { Menu } from './hooks/useMenubar'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

const trainingProfileByMenu: Partial<Record<Menu, TrainingProfile['id']>> = {
    [Menu.HV_TRAINER]: 'hunyuan-video',
    [Menu.HV_15_TRAINER]: 'hunyuan-video-1-5',
    [Menu.FRAMEPACK_TRAINER]: 'framepack',
    [Menu.FRAMEPACK_ONE_FRAME_TRAINER]: 'framepack-one-frame',
    [Menu.WAN_TRAINER]: 'wan-22',
    [Menu.WAN_ONE_FRAME_TRAINER]: 'wan-one-frame',
    [Menu.KONTEXT_TRAINER]: 'flux-kontext',
    [Menu.FLUX_2_TRAINER]: 'flux-2',
    [Menu.QWEN_TRAINER]: 'qwen-image',
    [Menu.Z_IMAGE_TRAINER]: 'z-image-turbo',
    [Menu.HIDREAM_TRAINER]: 'hidream-o1',
    [Menu.IDEOGRAM_TRAINER]: 'ideogram-4',
    [Menu.KANDINSKY_TRAINER]: 'kandinsky-5',
    [Menu.KREA_TRAINER]: 'krea-2',
    [Menu.MINIMAX_H3_TRAINER]: 'minimax-h3'
}

export default function App() {
    const menu = useMenuBar((state) => state.menu)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const mainContentRef = useRef<HTMLDivElement>(null)
    const previousMenuRef = useRef(menu)
    const navigationDeferredRef = useRef(false)
    const trainingProfileId = trainingProfileByMenu[menu]
    const trainingProfile = trainingProfileId ? trainingProfiles[trainingProfileId] : null

    useEffect(() => {
        if (previousMenuRef.current === menu) return

        previousMenuRef.current = menu
        if (!navigationDeferredRef.current) mainContentRef.current?.focus()
    }, [menu])

    return (
        <div className="min-h-screen">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-foreground focus:ring-2 focus:ring-ring"
            >
                Skip to main content
            </a>
            <SideBar
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
                onNavigationStart={() => {
                    navigationDeferredRef.current = true
                }}
                onNavigationComplete={() => {
                    navigationDeferredRef.current = false
                    mainContentRef.current?.focus()
                }}
            />
            <div
                id="main-content"
                tabIndex={-1}
                ref={mainContentRef}
                className={cn(
                    'transition-[margin] duration-200 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none',
                    !sidebarCollapsed && 'lg:ml-80'
                )}
            >
                {trainingProfile ? (
                    <TrainingWorkspace key={trainingProfile.id} profile={trainingProfile} />
                ) : null}
                {menu === Menu.DOWNLOADS ? <Downloads /> : null}
                {menu === Menu.DATASETS ? <Datasets /> : null}
                {menu === Menu.LOGS ? <LogViewer /> : null}
                {menu === Menu.SETTINGS ? <Settings /> : null}
                {menu === Menu.ABOUT ? <About /> : null}
            </div>
        </div>
    )
}
