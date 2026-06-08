import type { Meta, StoryObj } from '@storybook/react-vite';
import { toast } from 'sonner';

import { Button } from './button';
import { Toaster } from './sonner';

const meta = {
  title: 'Shared/Toaster',
  component: Toaster,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <>
      <Toaster />
      <div className="flex gap-2">
        <Button onClick={() => toast.success('저장되었습니다')}>성공 토스트</Button>
        <Button variant="destructive" onClick={() => toast.error('삭제되었습니다')}>
          에러 토스트
        </Button>
      </div>
    </>
  )
};
