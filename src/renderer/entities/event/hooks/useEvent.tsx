import { useQuery } from '@tanstack/react-query';
import { eventOptions } from '../api/queries';
import { useLogin } from '@/shared/hooks/useLogin';

export const useEvents = () => {
  const { tokens } = useLogin();
  return useQuery({
    ...eventOptions.events(tokens.access_token),
    enabled: Boolean(tokens.access_token)
  });
};

export const useHolidayEvents = () => {
  const { tokens } = useLogin();
  return useQuery({
    ...eventOptions.holidays(tokens.access_token),
    enabled: Boolean(tokens.access_token)
  });
};
