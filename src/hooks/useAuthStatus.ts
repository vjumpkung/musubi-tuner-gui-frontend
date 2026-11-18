import { authApi, queryKeys } from '../api/api'
import { useQuery } from '@tanstack/react-query'

// Shared by the app gate and the sidebar so both observers use identical query options.
const useAuthStatus = () =>
    useQuery({
        queryKey: queryKeys.auth,
        queryFn: authApi.status,
        retry: false,
        staleTime: Infinity
    })

export default useAuthStatus
