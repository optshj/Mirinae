import { useLogin } from '@/shared/hooks/useLogin';

export function LoginButton() {
    const { login, logout, tokens } = useLogin();

    return <>{tokens.access_token ? <div onClick={logout}>로그아웃</div> : <div onClick={login}>구글 로그인</div>}</>;
}
