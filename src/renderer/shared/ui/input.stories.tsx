import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { HangulInput } from './input';

const meta = {
  title: 'Shared/HangulInput',
  component: HangulInput,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof HangulInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '',
    onChange: () => {}
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    return <HangulInput {...args} value={value} onChange={setValue} placeholder="입력해보세요" className="w-[280px] rounded-md border px-3 py-2 text-sm" />;
  }
};
