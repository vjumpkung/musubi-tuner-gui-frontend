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
            <div className="h-screen w-full ml-80 mt-3 mr-3 mb-3">
                {menu === Menu.HV_TRAINER ? <HunyuanVideoTrainer /> : null}
                {menu === Menu.FRAMEPACK_TRAINER ? <FramepackTrainer /> : null}
                {menu === Menu.WAN_TRAINER ? <WanTrainer /> : null}
                {menu === Menu.KONTEXT_TRAINER ? <FluxKontextTrainer /> : null}
                {menu === Menu.QWEN_TRAINER ? <QwenTrainer /> : null}
            </div>
            <SideBar />
        </div>
    )
}
