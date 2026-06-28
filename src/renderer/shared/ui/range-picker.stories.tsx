import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { RangePicker } from './range-picker';

const meta = {
  title: 'Shared/RangePicker',
  component: RangePicker,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs'],
  // RangePicker는 --event-color CSS 변수로 강조색을 칠하므로 event-color-* 클래스로 감싼다
  decorators: [
    (Story) => (
      <div className="event-color-1">
        <Story />
      </div>
    )
  ]
} satisfies Meta<typeof RangePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

// 기본: 시작일 = 종료일(하루 일정). 시작일은 고정이고 종료일만 선택 가능
export const Default: Story = {
  args: {
    start: '2026-06-26',
    end: '2026-06-26',
    onChange: () => {}
  },
  render: function Render(args) {
    const [end, setEnd] = useState(args.end);
    return <RangePicker {...args} end={end} onChange={setEnd} />;
  }
};

// 여러 날에 걸친 일정 — 시작~종료 범위가 강조된 상태
export const MultiDay: Story = {
  args: {
    start: '2026-06-26',
    end: '2026-06-30',
    onChange: () => {}
  },
  render: function Render(args) {
    const [end, setEnd] = useState(args.end);
    return <RangePicker {...args} end={end} onChange={setEnd} />;
  }
};

// 다른 이벤트 색상(event-color-4, Soft Coral)으로 강조색 테마 확인
export const ColoredTheme: Story = {
  args: {
    start: '2026-06-26',
    end: '2026-06-28',
    onChange: () => {}
  },
  decorators: [
    (Story) => (
      <div className="event-color-4">
        <Story />
      </div>
    )
  ],
  render: function Render(args) {
    const [end, setEnd] = useState(args.end);
    return <RangePicker {...args} end={end} onChange={setEnd} />;
  }
};
