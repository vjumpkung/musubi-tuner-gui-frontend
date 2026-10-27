import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import '@xterm/xterm/css/xterm.css'
import { useEffect, useRef } from 'react'

type TerminalComponentProps = {
    content: string
    emptyMessage: string
}

const TerminalComponent = ({ content, emptyMessage }: TerminalComponentProps) => {
    const terminalRef = useRef<HTMLDivElement>(null)
    const terminalInstance = useRef<Terminal | null>(null)
    const fitAddon = useRef<FitAddon | null>(null)

    useEffect(() => {
        const host = terminalRef.current
        if (!host) return

        const terminal = new Terminal({
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            cursorBlink: false,
            convertEol: true,
            theme: { background: '#020617', brightBlack: '#94a3b8' }
        })
        const fit = new FitAddon()
        terminal.loadAddon(fit)
        terminal.open(host)
        terminalInstance.current = terminal
        fitAddon.current = fit
        let pendingFrame: number | null = null
        const scheduleFit = () => {
            if (pendingFrame !== null) return
            pendingFrame = requestAnimationFrame(() => {
                pendingFrame = null
                if (host.clientWidth === 0 || host.clientHeight === 0) return
                fit.fit()
            })
        }
        const resizeObserver = new ResizeObserver(scheduleFit)
        resizeObserver.observe(host)
        scheduleFit()

        return () => {
            resizeObserver.disconnect()
            if (pendingFrame !== null) cancelAnimationFrame(pendingFrame)
            terminal.dispose()
            terminalInstance.current = null
            fitAddon.current = null
        }
    }, [])

    useEffect(() => {
        const terminal = terminalInstance.current
        if (!terminal) return
        terminal.reset()
        terminal.write(content || `\x1b[90m${emptyMessage}\x1b[0m`)
    }, [content, emptyMessage])

    return (
        <div className="bg-slate-950 p-2">
            <div
                ref={terminalRef}
                role="region"
                aria-label="Training job logs"
                translate="no"
                className="h-[55vh] min-h-80"
            />
        </div>
    )
}

export default TerminalComponent
