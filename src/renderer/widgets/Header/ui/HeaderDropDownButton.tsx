import { DropDown } from '@/shared/ui/dropdown';
import { Settings } from 'lucide-react';

import { LoginButton } from '@/features/user';
import { OpacityButton } from '@/features/opacity';
import { QuitAppButton } from '@/features/quit';
import { DarkModeButton } from '@/features/darkmode';
import { HolidayButton } from '@/features/event';
import { MoveActiveButton } from '@/features/move';
import { FlipFooterButton } from '@/features/flip';

export function HeaderDropDownButton() {
    return (
        <DropDown trigger={<Settings strokeWidth={1.5} size={24} />} align="right" closeOnClick={false}>
            <LoginButton />
            <MoveActiveButton />
            <OpacityButton />
            <DarkModeButton />
            <HolidayButton />
            <FlipFooterButton />
            <QuitAppButton />
        </DropDown>
    );
}
