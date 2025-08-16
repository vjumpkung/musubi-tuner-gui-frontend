import About from './about/about'
import FluxKontextInference from './components/inference/flux_kontext'
import FramepackInference from './components/inference/framepack'
import HunyuanVideoInference from './components/inference/hunyuan_video'
import QwenInference from './components/inference/qwen'
import WANInference from './components/inference/wan'
import LogViewer from './components/logs/logs'
import Settings from './components/settings/settings'
import SideBar from './components/sidebar'
import FluxKontextTrainer from './components/training/flux_kontext'
import FramepackTrainer from './components/training/framepack'
import HunyuanVideoTrainer from './components/training/hunyuan_video'
import QwenTrainer from './components/training/qwen'
import WanTrainer from './components/training/wan'
import useMenuBar, { Menu } from './hooks/useMenubar'

export default function App() {
    const menu = useMenuBar((state) => state.menu)

    return (
        <div className="flex flex-row">
            <div className="h-screen w-full ml-80 mr-3 ">
                {menu === Menu.HV_TRAINER ? <HunyuanVideoTrainer /> : null}
                {menu === Menu.FRAMEPACK_TRAINER ? <FramepackTrainer /> : null}
                {menu === Menu.WAN_TRAINER ? <WanTrainer /> : null}
                {menu === Menu.KONTEXT_TRAINER ? <FluxKontextTrainer /> : null}
                {menu === Menu.QWEN_TRAINER ? <QwenTrainer /> : null}
                {menu === Menu.HV_INFERENCE ? <HunyuanVideoInference /> : null}
                {menu === Menu.FRAMEPACK_INFERENCE ? <FramepackInference /> : null}
                {menu === Menu.WAN_INFERENCE ? <WANInference /> : null}
                {menu === Menu.KONTEXT_INFERENCE ? <FluxKontextInference /> : null}
                {menu === Menu.QWEN_INFERENCE ? <QwenInference /> : null}
                {menu === Menu.LOGS ? <LogViewer /> : null}
                {menu === Menu.SETTINGS ? <Settings /> : null}
                {menu === Menu.ABOUT ? <About /> : null}
            </div>
            <SideBar />
        </div>
    )
}
