import App from './App'
import './index.css'
import { ThemeProvider } from '@material-tailwind/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1_000,
            retry: 1,
            refetchOnWindowFocus: false
        },
        mutations: {
            retry: 0
        }
    }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <App />
            </ThemeProvider>
        </QueryClientProvider>
    </React.StrictMode>
)
