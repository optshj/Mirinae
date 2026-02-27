import { useLogin } from '@/shared/hooks/useLogin';

interface LoginButtonProps {
    closeDropDown?: () => void;
    closeOnClick?: boolean;
}
export function LoginButton({ closeDropDown, closeOnClick = true }: LoginButtonProps) {
    const { login, logout, tokens } = useLogin();

    const onLogout = () => {
        if (closeOnClick && closeDropDown) {
            closeDropDown();
        }
        logout();
    };
    const onLogin = () => {
        if (closeOnClick && closeDropDown) {
            closeDropDown();
        }
        login();
    };

    return <>{tokens.access_token ? <div onClick={onLogout}>로그아웃</div> : <div onClick={onLogin}>구글 로그인</div>}</>;
}
