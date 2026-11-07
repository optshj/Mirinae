import { app } from 'electron';
import * as Sentry from '@sentry/electron/main';
import log from 'electron-log';

export const REPORT_INTERVAL_MS = 60 * 60 * 1000;

let lastReportAt = performance.now();
let lastCpuSecondsByPid = new Map<number, number>();

// 메인 프로세스 단독 지표는 index.ts의 nodeRuntimeMetricsIntegration(node.runtime.*)이 잰다.
const report = () => {
  const processes = app.getAppMetrics();
  const now = performance.now();
  const intervalSeconds = (now - lastReportAt) / 1000;
  lastReportAt = now;

  // percentCPUUsage는 Sentry도 getAppMetrics를 부를 때마다 리셋돼서, 누적 CPU 초의 차이로 직접 계산한다
  const cpuSecondsByPid = new Map(processes.map((metric) => [metric.pid, metric.cpu.cumulativeCPUUsage ?? 0]));
  const cpuPercent = (list: Electron.ProcessMetric[]) => {
    const usedSeconds = list.reduce((total, { pid }) => total + Math.max(0, (cpuSecondsByPid.get(pid) ?? 0) - (lastCpuSecondsByPid.get(pid) ?? 0)), 0);
    return (usedSeconds / intervalSeconds) * 100; // 100 = 코어 1개 꽉 참
  };
  const memoryMegabytes = (list: Electron.ProcessMetric[]) => list.reduce((total, metric) => total + metric.memory.workingSetSize, 0) / 1024; // KB → MB
  const ofType = (type: string) => processes.filter((metric) => metric.type === type);

  // uptime_hours로 묶으면 켜둘수록 메모리가 느는지(누수), interval_minutes가 60보다 크면 절전이 섞인 구간
  const attributes = {
    uptime_hours: Math.round(process.uptime() / 3600),
    interval_minutes: Math.round(intervalSeconds / 60)
  };
  const send = (name: string, value: number, unit: string) => Sentry.metrics.distribution(name, value, { unit, attributes });

  send('performance.memory.total', memoryMegabytes(processes), 'megabyte');
  send('performance.memory.renderer', memoryMegabytes(ofType('Tab')), 'megabyte');
  send('performance.memory.gpu', memoryMegabytes(ofType('GPU')), 'megabyte');
  send('performance.cpu.total', cpuPercent(processes), 'percent');
  send('performance.cpu.renderer', cpuPercent(ofType('Tab')), 'percent');
  lastCpuSecondsByPid = cpuSecondsByPid; // cpuPercent 계산이 끝난 뒤에 갱신
};

export const startPerformanceMetrics = () => {
  if (!app.isPackaged) return; // 개발 모드 차단
  setInterval(() => {
    try {
      report();
    } catch (error) {
      log.warn('[PerformanceMetrics] 측정 실패', error);
    }
  }, REPORT_INTERVAL_MS);
};
