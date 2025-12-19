import Provider from './provider';
import { Calendar } from '@/pages';
import { Toaster } from '@/shared/ui/sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';

dayjs.locale('ko');

export default function App() {
    return (
        <Provider>
            <Calendar />
            <Toaster position="top-center" richColors />
        </Provider>
    );
}
