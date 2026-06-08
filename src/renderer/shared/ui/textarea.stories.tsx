import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { HangulTextArea } from './textarea';

const meta = {
  title: 'Shared/HangulTextArea',
  component: HangulTextArea,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof HangulTextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '',
    onChange: () => {}
  },
  render: function Render() {
    const [value, setValue] = useState('');
    return <HangulTextArea value={value} onChange={setValue} placeholder="내용을 입력하세요" className="h-32 w-[320px] rounded-md border p-3 text-sm" />;
  }
};
