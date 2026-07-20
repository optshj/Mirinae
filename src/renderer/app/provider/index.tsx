import { ReactQueryProvider } from './QueryClient';
import { MaxLanesProvider, HolidayProvider, ColorFilterProvider } from '@/entities/event';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <MaxLanesProvider>
      <ColorFilterProvider>
        <HolidayProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </HolidayProvider>
      </ColorFilterProvider>
    </MaxLanesProvider>
  );
}
