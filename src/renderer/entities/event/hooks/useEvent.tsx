import { useQuery } from '@tanstack/react-query';
import { eventOptions } from '../api/queries';
import { useLogin } from '@/shared/hooks/useLogin';

export const useEvents = () => {
  const { isAuthenticated } = useLogin();
  return useQuery({
    ...eventOptions.events(),
    enabled: isAuthenticated
  });
};

export const useHolidayEvents = () => {
  const { isAuthenticated } = useLogin();
  return useQuery({
    ...eventOptions.holidays(),
    enabled: isAuthenticated
  });
};
