import { create } from 'zustand'

export enum Menu {
    // training
    HV_TRAINER = 'HUNYUAN_VIDEO_TRAINER',
    FRAMEPACK_TRAINER = 'FRAMEPACK_TRAINER',
    WAN_TRAINER = 'WAN_TRAINER',
    QWEN_TRAINER = 'QWEN_TRAINER',
    KONTEXT_TRAINER = 'KONTEXT_TRAINER',

    // inference
    HV_INFERENCE = 'HUNYUAN_VIDEO_INFERENCE',
    FRAMEPACK_INFERENCE = 'FRAMEPACK_INFERENCE',
    WAN_INFERENCE = 'WAN_INFERENCE',
    QWEN_INFERENCE = 'QWEN_INFERENCE',
    KONTEXT_INFERENCE = 'KONTEXT_INFERENCE',

    // logs
    LOGS = 'LOGS',
    SETTINGS = 'SETTINGS',
    ABOUT = 'ABOUT'
}

type MenuState = {
    menu: Menu
    setMenuBar: (menu: Menu) => void
}

const useMenuBar = create<MenuState>((set) => ({
    menu: Menu.HV_TRAINER,
    setMenuBar: (menu) => set(() => ({ menu: menu }))
}))

export default useMenuBar
