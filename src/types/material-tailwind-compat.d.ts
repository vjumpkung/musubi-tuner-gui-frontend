// @material-tailwind/react v2 ships type declarations compiled against React 18,
// whose Pick<...> prop lists reference attributes removed from @types/react 19
// (making them appear as required props). Re-add them as optional until the
// library supports React 19.
import 'react'

declare module 'react' {
    interface DOMAttributes<T> {
        onPointerEnterCapture?: PointerEventHandler<T> | undefined
        onPointerLeaveCapture?: PointerEventHandler<T> | undefined
        onResize?: ReactEventHandler<T> | undefined
        onResizeCapture?: ReactEventHandler<T> | undefined
    }
    interface HTMLAttributes<T> {
        placeholder?: string | undefined
    }
    interface InputHTMLAttributes<T> {
        crossOrigin?: '' | 'anonymous' | 'use-credentials' | undefined
    }
}
