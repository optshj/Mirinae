import { RotateCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Tooltip } from '@/shared/ui/tooltip';
import { useLogin } from '@/shared/hooks/useLogin';

export function RefreshButton() {
  const queryClient = useQueryClient();
  const { isAuthenticated, restoreSession } = useLogin();

  return (
    <Tooltip content="새로고침" side="bottom">
      <div
        role="button"
        tabIndex={-1}
        onClick={() => (isAuthenticated ? queryClient.refetchQueries({ type: 'active' }) : restoreSession())}
        className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none"
      >
        <RotateCw strokeWidth={1} />
      </div>
    </Tooltip>
  );
}
