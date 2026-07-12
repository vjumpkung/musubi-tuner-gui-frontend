import { create } from 'zustand'

export enum Menu {
    // training
    HV_TRAINER = 'HUNYUAN_VIDEO_TRAINER',
    FRAMEPACK_TRAINER = 'FRAMEPACK_TRAINER',
    WAN_TRAINER = 'WAN_TRAINER',
    QWEN_TRAINER = 'QWEN_TRAINER',
    KONTEXT_TRAINER = 'KONTEXT_TRAINER',
    HV_15_TRAINER = 'HUNYUAN_VIDEO_1_5_TRAINER',
    FRAMEPACK_ONE_FRAME_TRAINER = 'FRAMEPACK_ONE_FRAME_TRAINER',
    WAN_ONE_FRAME_TRAINER = 'WAN_ONE_FRAME_TRAINER',
    FLUX_2_TRAINER = 'FLUX_2_TRAINER',
    Z_IMAGE_TRAINER = 'Z_IMAGE_TRAINER',
    HIDREAM_TRAINER = 'HIDREAM_TRAINER',
    IDEOGRAM_TRAINER = 'IDEOGRAM_TRAINER',
    KANDINSKY_TRAINER = 'KANDINSKY_TRAINER',
    KREA_TRAINER = 'KREA_TRAINER',

    // downloads
    DOWNLOADS = 'DOWNLOADS',

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
