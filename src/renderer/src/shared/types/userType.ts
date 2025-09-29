export interface Tokens {
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
    token_type?: string
}
export const initialTokens: Tokens = {
    access_token: '',
    refresh_token: undefined,
    expires_in: undefined,
    scope: undefined,
    token_type: undefined
}
