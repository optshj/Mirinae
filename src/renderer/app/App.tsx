import Provider from './provider';
import { Calendar } from '@/pages';
import { PatchNoteModal } from '@/entities/patchNote';
import { Toaster } from '@/shared/ui/sonner';

import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ko';

dayjs.locale('ko');
dayjs.extend(isSameOrBefore);

export default function App() {
  return (
    <Provider>
      <Calendar />
      <Toaster />
      <PatchNoteModal />
    </Provider>
  );
}
