import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './switch';

const meta = {
  title: 'Shared/Switch',
  component: Switch,
  parameters: {
    layout: 'centered'
  },
  tags: ['autodocs']
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isOn: false,
    onClick: () => {}
  },
  render: function Render(args) {
    const [isOn, setIsOn] = useState(args.isOn);
    return <Switch {...args} isOn={isOn} onClick={() => setIsOn((prev) => !prev)} />;
  }
};
