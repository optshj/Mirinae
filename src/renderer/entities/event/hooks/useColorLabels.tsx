import { useSyncExternalStore } from 'react';
import { COLOR_LABEL_MAX_LENGTH, COLOR_LABEL_STORAGE_KEY } from '@/shared/const/color';

type ColorLabels = Record<string, string>;

const listeners = new Set<() => void>();

function read(): ColorLabels {
  try {
    return JSON.parse(localStorage.getItem(COLOR_LABEL_STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

let labels = read();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 색상별 카테고리 이름. Provider 없이 여러 슬라이스에서 같은 값을 보도록 모듈 스토어로 공유한다. */
export function useColorLabels() {
  const setLabel = (colorId: string, label: string) => {
    const next = { ...labels };
    // 표시하는 쪽(스와치 아래 두 줄)이 감당 못 하는 길이는 저장 단계에서 막는다
    if (label.trim()) next[colorId] = label.slice(0, COLOR_LABEL_MAX_LENGTH);
    else delete next[colorId];

    labels = next;
    localStorage.setItem(COLOR_LABEL_STORAGE_KEY, JSON.stringify(next));
    listeners.forEach((listener) => listener());
  };

  return { labels: useSyncExternalStore(subscribe, () => labels), setLabel };
}
