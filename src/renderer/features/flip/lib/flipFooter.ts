import { posthog } from '@/shared/lib/posthog';

export function setFlipFooter(flip: boolean, source: 'settings' | 'footer_tab') {
  document.documentElement.classList.toggle('flip-footer', flip);
  localStorage.setItem('flipFooter', flip.toString());
  posthog.capture('flip_footer_changed', { flip_footer: flip, source });
}
