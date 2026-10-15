import { RotateCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tooltip } from '@/shared/ui/tooltip';
import { useLogin } from '@/shared/hooks/useLogin';
import { posthog } from '@/shared/lib/posthog';

export function RefreshButton() {
  const queryClient = useQueryClient();
  const { isAuthenticated, restoreSession } = useLogin();

  return (
    <Tooltip content="새로고침" side="bottom">
      <div
        role="button"
        tabIndex={-1}
        onClick={() => {
          posthog.capture('refresh_button', { authenticated: isAuthenticated });
          if (!isAuthenticated) {
            restoreSession();
            return;
          }
          toast.promise(queryClient.refetchQueries({ type: 'active' }, { throwOnError: true, cancelRefetch: false }), {
            id: 'refresh',
            loading: '일정을 불러오는 중이에요',
            success: '최신 일정으로 업데이트했어요',
            error: '일정을 불러오지 못했어요'
          });
        }}
        className="inline-flex cursor-pointer appearance-none border-0 bg-transparent p-0 [&_svg]:pointer-events-none"
      >
        <RotateCw strokeWidth={1} />
      </div>
    </Tooltip>
  );
}
