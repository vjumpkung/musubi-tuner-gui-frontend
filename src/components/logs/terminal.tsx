'use client'

import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'

const TerminalComponent = () => {
    const terminalRef = useRef<HTMLDivElement>(null)
    const terminalInstance = useRef<Terminal | null>(null)
    const fitAddon = useRef<FitAddon | null>(null)

    useEffect(() => {
        const loadTerminal = async () => {
            if (typeof window !== 'undefined' && terminalRef.current) {
                // Instantiate terminal and addon
                terminalInstance.current = new Terminal({
                    fontSize: 16,
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                    cursorBlink: false
                })
                fitAddon.current = new FitAddon()

                // Load the addon and open the terminal in the container
                terminalInstance.current.loadAddon(fitAddon.current)
                terminalInstance.current.open(terminalRef.current)

                terminalInstance.current.writeln('Log goes here.')

                // Use requestAnimationFrame to delay fitting until after render/layout
                requestAnimationFrame(() => {
                    fitAddon.current?.fit()
                })
            }
        }

        loadTerminal()

        // Add resize listener to update the terminal size dynamically
        const handleResize = () => {
            if (fitAddon.current) {
                // Use requestAnimationFrame for smoother updates
                requestAnimationFrame(() => {
                    fitAddon.current?.fit()
                })
            }
        }

        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
            terminalInstance.current?.dispose()
        }
    }, [])

    return (
        <div className="bg-black p-2">
            <div ref={terminalRef} style={{ height: 'calc(100vh - 170px)' }} />
        </div>
    )
}

export default TerminalComponent
