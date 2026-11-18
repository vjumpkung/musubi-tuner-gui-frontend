import { authApi, queryKeys } from '../../api/api'
import { getApiErrorMessage } from '../../api/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { LoaderCircleIcon } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'

const loginErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) return 'Incorrect password'
        if (error.response?.status === 429) {
            return 'Too many attempts. Wait a moment and try again.'
        }
    }
    return getApiErrorMessage(error, 'Sign in failed.')
}

const Login = () => {
    const queryClient = useQueryClient()
    const passwordId = useId()
    const errorId = useId()
    const [password, setPassword] = useState('')
    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: async (status) => {
            queryClient.setQueryData(queryKeys.auth, status)
            await queryClient.invalidateQueries()
        }
    })

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!password || loginMutation.isPending) return
        loginMutation.mutate(password)
    }

    return (
        <main className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm shadow-sm">
                <CardHeader>
                    <h1 className="text-xl leading-snug font-semibold">Musubi Tuner GUI</h1>
                    <CardDescription>Enter the password to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} noValidate>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor={passwordId}>Password</FieldLabel>
                                <Input
                                    id={passwordId}
                                    type="password"
                                    name="password"
                                    autoComplete="current-password"
                                    autoFocus
                                    required
                                    maxLength={1024}
                                    className="h-10"
                                    value={password}
                                    aria-invalid={loginMutation.isError || undefined}
                                    aria-describedby={loginMutation.isError ? errorId : undefined}
                                    onChange={(event) => setPassword(event.target.value)}
                                />
                            </Field>
                            {loginMutation.isError ? (
                                <Alert id={errorId} variant="destructive" role="alert">
                                    <AlertDescription>
                                        {loginErrorMessage(loginMutation.error)}
                                    </AlertDescription>
                                </Alert>
                            ) : null}
                            <Button
                                type="submit"
                                className="h-10 w-full"
                                disabled={!password || loginMutation.isPending}
                                aria-busy={loginMutation.isPending}
                            >
                                {loginMutation.isPending ? (
                                    <LoaderCircleIcon className="animate-spin" />
                                ) : null}
                                {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </FieldGroup>
                    </form>
                </CardContent>
            </Card>
        </main>
    )
}

export default Login
