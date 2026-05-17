export function AskButton({ closeDropDown }: { closeDropDown?: () => void }) {
  const handleClick = () => {
    window.api.openExternal('https://www.mirinaecalendar.store/bug-report');
    closeDropDown?.();
  };

  return <div onClick={handleClick}>문의하기</div>;
}
