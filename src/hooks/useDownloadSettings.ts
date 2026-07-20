import { create } from 'zustand'

type DownloadSettingsState = {
    hfToken: string
    setHfToken: (hfToken: string) => void
    clearHfToken: () => void
}

const useDownloadSettings = create<DownloadSettingsState>((set) => ({
    hfToken: '',
    setHfToken: (hfToken) => set({ hfToken }),
    clearHfToken: () => set({ hfToken: '' })
}))

export default useDownloadSettings
