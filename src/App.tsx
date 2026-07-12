import About from './about/about'
import Datasets from './components/datasets/datasets'
import Downloads from './components/downloads/downloads'
import LogViewer from './components/logs/logs'
import Settings from './components/settings/settings'
import SideBar from './components/sidebar'
import { type TrainingProfile, trainingProfiles } from './components/training/profiles'
import TrainingWorkspace from './components/training/shared/training_workspace'
import useMenuBar, { Menu } from './hooks/useMenubar'
import { cn } from './utils/cn'
import { useState } from 'react'

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
    [Menu.KREA_TRAINER]: 'krea-2'
}

export default function App() {
    const menu = useMenuBar((state) => state.menu)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const trainingProfileId = trainingProfileByMenu[menu]
    const trainingProfile = trainingProfileId ? trainingProfiles[trainingProfileId] : null

    return (
        <div className="min-h-screen">
            <SideBar
                collapsed={sidebarCollapsed}
                onToggleCollapsed={() => setSidebarCollapsed((current) => !current)}
            />
            <div
                className={cn('transition-[margin] duration-200', !sidebarCollapsed && 'lg:ml-80')}
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
