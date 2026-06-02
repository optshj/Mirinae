import { useLogin } from '@/shared/hooks/useLogin';

export function LoginButton() {
  const { login, logout, isAuthenticated } = useLogin();

  return <>{isAuthenticated ? <div onClick={logout}>로그아웃</div> : <div onClick={login}>구글 로그인</div>}</>;
}
