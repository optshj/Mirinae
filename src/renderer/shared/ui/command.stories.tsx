import type { Meta, StoryObj } from '@storybook/react-vite';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './command';

const meta = {
  title: 'Shared/Command',
  component: Command,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Command className="w-[320px] rounded-lg border shadow-md">
      <CommandInput placeholder="명령어를 입력하세요..." />
      <CommandList>
        <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>
        <CommandGroup heading="제안">
          <CommandItem>캘린더 열기</CommandItem>
          <CommandItem>이벤트 추가</CommandItem>
          <CommandItem>
            검색
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="설정">
          <CommandItem>프로필</CommandItem>
          <CommandItem>환경설정</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  )
};
