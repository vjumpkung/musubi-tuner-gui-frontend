import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type AccelerationSettings = {
    dynamoBackend: string
    dynamoMode: string
    numProcesses: string
    numMachines: string
    numCpuThreadsPerProcess: string
}

export const defaultAccelerationSettings: AccelerationSettings = {
    dynamoBackend: 'no',
    dynamoMode: 'default',
    numProcesses: '1',
    numMachines: '1',
    numCpuThreadsPerProcess: ''
}

type AccelerationSettingsState = {
    settings: AccelerationSettings
    setSetting: (key: keyof AccelerationSettings, value: string) => void
    setSettings: (settings: AccelerationSettings) => void
    resetSettings: () => void
}

const useAccelerationSettings = create<AccelerationSettingsState>()(
    persist(
        (set) => ({
            settings: { ...defaultAccelerationSettings },
            setSetting: (key, value) =>
                set((state) => ({ settings: { ...state.settings, [key]: value } })),
            setSettings: (settings) => set({ settings }),
            resetSettings: () => set({ settings: { ...defaultAccelerationSettings } })
        }),
        {
            name: 'musubi-tuner-acceleration-settings',
            version: 1
        }
    )
)

export default useAccelerationSettings
