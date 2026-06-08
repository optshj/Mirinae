/// <reference types="vite/client" />
import type { Preview } from '@storybook/react-vite';
import '../src/renderer/app/index.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  }
};

export default preview;
