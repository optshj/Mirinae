import { useState } from 'react';
import { COLORPALLETTE } from '@/shared/const/color';
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/shared/ui/dropdown-menu';

import { ColorChips } from './components/ColorChips';

export function ColorLabelButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(COLORPALLETTE[0]);

  return (
    <DropdownMenuSub open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuSubTrigger
        className="p-0"
        onClick={(event) => {
          event.preventDefault();
          setIsOpen((prev) => !prev);
        }}
      >
        <span>색상 이름</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-60 px-2 py-2">
        <ColorChips isSelected={(key) => editing === key} onSelect={setEditing} naming={editing} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
