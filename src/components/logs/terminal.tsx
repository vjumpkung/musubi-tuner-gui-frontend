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
        if (!terminalRef.current) return

        const terminal = new Terminal({
            fontSize: 14,
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            cursorBlink: false,
            convertEol: true,
            theme: { background: '#020617' }
        })
        const fit = new FitAddon()
        terminal.loadAddon(fit)
        terminal.open(terminalRef.current)
        terminalInstance.current = terminal
        fitAddon.current = fit
        requestAnimationFrame(() => fit.fit())

        const handleResize = () => requestAnimationFrame(() => fit.fit())
        window.addEventListener('resize', handleResize)

        return () => {
            window.removeEventListener('resize', handleResize)
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
            <div ref={terminalRef} className="h-[55vh] min-h-80" />
        </div>
    )
}

export default TerminalComponent
