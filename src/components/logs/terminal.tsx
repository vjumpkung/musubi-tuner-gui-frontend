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
    const writtenRef = useRef('')
    const placeholderShownRef = useRef(false)

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
        writtenRef.current = ''
        placeholderShownRef.current = false
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
            writtenRef.current = ''
            placeholderShownRef.current = false
        }
    }, [])

    useEffect(() => {
        const terminal = terminalInstance.current
        if (!terminal) return
        if (!content) {
            terminal.reset()
            terminal.write(`\x1b[90m${emptyMessage}\x1b[0m`)
            writtenRef.current = ''
            placeholderShownRef.current = true
            return
        }
        const written = writtenRef.current
        if (
            !placeholderShownRef.current &&
            content.length >= written.length &&
            content.startsWith(written)
        ) {
            const delta = content.slice(written.length)
            if (delta) terminal.write(delta)
        } else {
            terminal.reset()
            terminal.write(content)
            placeholderShownRef.current = false
        }
        writtenRef.current = content
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
