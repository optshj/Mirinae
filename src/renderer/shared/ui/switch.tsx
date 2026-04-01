export function Switch({ onClick, isOn, id }: { onClick: () => void; isOn: boolean; id?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      id={id}
      onClick={onClick}
      onKeyDown={(e) => e.preventDefault()}
      className={`group border-background-secondary relative flex h-6 w-12 items-center justify-center rounded-full transition-colors duration-300 ${isOn ? 'bg-[#3EBD88] dark:bg-[#10B981]' : 'bg-[#CCD0E4] dark:bg-zinc-500'} `}
    >
      <div className={`absolute h-5 w-5 transform rounded-full bg-white p-1 transition-all duration-300 group-active:scale-80 ${isOn ? 'translate-x-3' : '-translate-x-3'} `} />
    </button>
  );
}
