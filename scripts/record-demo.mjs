// 홈페이지 기능 소개(Mirinae_Page /docs)용 데모 클립 녹화.
// npm run demo:record            전체 녹화
// npm run demo:record -- 일정추가  골라서 녹화 (--list로 목록)
// npm run demo:record -- --seed   녹화 계정에 클립용 일정 만들기 (처음 한 번)
// 결과: demo-videos/*.mp4 → Mirinae_Page/public/demo/에 복사해서 쓴다. ffmpeg(PATH)와 npx playwright-core install ffmpeg 필요.
// 일정은 로그인된 계정의 실제 구글 캘린더를 그대로 쓴다: 녹화 전에 데모용 계정으로 로그인해 둘 것.
// dev 앱(localhost 렌더러)으로 찍으므로 localStorage가 실사용 앱(mirinae://app)과 섞이지 않는다.
// 앱 코드엔 녹화용 분기를 두지 않는다: 뷰포트 고정·클릭 차단 해제·가짜 커서는 아래 prepare()가 밖에서 처리한다.
// 실행 중인 미리내(배포판·npm run dev)는 먼저 종료할 것(단일 인스턴스).
import { chromium } from 'playwright-core';
import { execFileSync, spawn } from 'child_process';
import { mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'demo-videos');
const SIZE = { width: 1200, height: 1032 };

// HangulInput은 OS IME 대신 영문 keydown을 직접 조합하므로 한글은 두벌식 키 시퀀스로 쳐야 한다
const CHO = 'rRseEfaqQtTdwWczxvg';
const JUNG = ['k', 'o', 'i', 'O', 'j', 'p', 'u', 'P', 'h', 'hk', 'ho', 'hl', 'y', 'n', 'nj', 'np', 'nl', 'b', 'm', 'ml', 'l'];
const JONG = ['', 'r', 'R', 'rt', 's', 'sw', 'sg', 'e', 'f', 'fr', 'fa', 'fq', 'ft', 'fx', 'fv', 'fg', 'a', 'q', 'qt', 't', 'T', 'd', 'w', 'c', 'z', 'x', 'v', 'g'];
const toKeystrokes = (text) =>
  [...text]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHO[Math.floor(code / 588)] + JUNG[Math.floor((code % 588) / 28)] + JONG[code % 28];
    })
    .join('');

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const thisMonth = (day) => ymd(new Date(new Date().getFullYear(), new Date().getMonth(), day));
// 미니뷰에선 달력이 따로 그려지고 원래 달력은 숨겨지므로 보이는 칸만 고른다
const cell = (day) => `[data-date="${thisMonth(day)}"]:visible`;
const settings = 'div:has(> svg.lucide-settings)';

// 녹화 드라이버: 커서를 눈에 보이게 천천히 움직이고, 동작마다 마지막 인자(ms)만큼 보여준다
// 사람처럼 보이도록 커서가 도착한 뒤 누르기 전에 잠깐 멈춘다
const ARRIVE_PAUSE = 450;
const driver = (page) => {
  const at = (target) => (typeof target === 'string' ? page.locator(target).first() : target);
  const center = async (target) => {
    const box = await at(target).boundingBox();
    if (!box) throw new Error(`안 보임: ${target}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  };
  const d = {
    wait: (ms) => page.waitForTimeout(ms),
    async move(target, wait = 300) {
      const { x, y } = await center(target);
      await page.mouse.move(x, y, { steps: 25 });
      await d.wait(wait);
    },
    async click(target, wait = 800) {
      await d.move(target, ARRIVE_PAUSE);
      await page.mouse.down();
      await page.mouse.up();
      await d.wait(wait);
    },
    async dblclick(target, wait = 1000) {
      await d.move(target, ARRIVE_PAUSE);
      await page.mouse.dblclick((await center(target)).x, (await center(target)).y);
      await d.wait(wait);
    },
    async drag(from, to, wait = 1200) {
      await d.move(from, ARRIVE_PAUSE);
      await page.mouse.down();
      const { x, y } = await center(to);
      await page.mouse.move(x, y, { steps: 40 });
      await d.wait(ARRIVE_PAUSE);
      await page.mouse.up();
      await d.wait(wait);
    },
    async type(text, wait = 600) {
      await page.keyboard.type(toKeystrokes(text), { delay: 70 });
      await d.wait(wait);
    },
    async press(key, wait = 600) {
      await page.keyboard.press(key);
      await d.wait(wait);
    },
    dialog: (text) => page.getByRole('dialog').locator('div[data-hoverable]', { hasText: text }).first(),
    text: (text) => page.getByText(text, { exact: true }).first(),
    button: (name) => page.getByRole('button', { name, exact: true }).first(),
    settingsTab: (label) => page.locator('[role="menu"] div[tabindex="-1"]', { hasText: label }).first()
  };
  return d;
};

const CLIPS = {
  일정추가: async (d) => {
    await d.dblclick(cell(21));
    await d.click(d.button('일정 추가'));
    await d.type('가족 외식', 400);
    await d.click('[aria-label="6번 색상"]', 500);
    await d.click(d.button('추가'), 1500);
    await d.press('Escape', 1500);
  },
  일정수정: async (d, page) => {
    await d.dblclick(cell(7));
    await d.click(d.dialog('토익 시험 준비'));
    await page.keyboard.press('Control+A');
    await d.type('자격증 공부하기', 400);
    await d.click('[aria-label="1번 색상"]', 500);
    await d.click(d.button('수정'), 1500);
    await d.press('Escape', 1500);
  },
  일정드래그로옮기기: async (d) => {
    await d.drag('[data-event="병원 진료"]', cell(23), 1800);
  },
  일정완료: async (d) => {
    await d.dblclick(cell(new Date().getDate()));
    await d.click(d.dialog('헬스장').locator('button').first(), 1500);
    await d.press('Escape', 1500);
  },
  행동되돌리기: async (d) => {
    await d.dblclick(cell(27));
    await d.click(d.dialog('농구 대회 결승!').locator('button').last(), 600);
    await d.click('[aria-label="실행 취소"]', 1500);
    await d.press('Escape', 1200);
  },
  일정삭제: async (d) => {
    await d.dblclick(cell(20));
    await d.click(d.dialog('친구랑 저녁 약속').locator('button').last(), 1500);
    await d.press('Escape', 1500);
  },
  색상필터: async (d) => {
    await d.click(settings);
    await d.click(d.settingsTab('캘린더'));
    await d.click('[role="menu"] [aria-label="9번 색상"]', 1000);
    await d.click('[role="menu"] [aria-label="4번 색상"]', 1500);
    await d.click(d.text('필터 초기화'), 1200);
    await d.press('Escape', 800);
  },
  캘린더접기: async (d) => {
    await d.click('div:has(> svg.lucide-fold-vertical)', 1500);
    await d.click('div:has(> svg.lucide-unfold-vertical)', 1500);
  },
  캘린더축소: async (d, page) => {
    await d.click('div:has(> svg.lucide-minimize-2)', 1500);
    await d.move(cell(new Date().getDate()), 1800);
    await page.mouse.move(400, 900, { steps: 15 });
    await d.click('div:has(> svg.lucide-maximize-2)', 1500);
  },
  캘린더요약보기: async (d) => {
    // 달력 아래 접기/펼치기 탭 (설정 메뉴의 화면 구성과 같은 동작)
    await d.click('div[data-hoverable]:has-text("접기")', 1500);
    await d.click('div[data-hoverable]:has-text("펼치기")', 1500);
  },
  오늘로돌아가기: async (d) => {
    await d.click('svg.lucide-chevron-right', 700);
    await d.click('svg.lucide-chevron-right', 1200);
    await d.click(d.button('오늘로 돌아가기'), 1800);
  },
  표시할캘린더: async (d, page) => {
    await d.click('div:has(> svg[class*="calendar-check"])');
    const holiday = '[role="menuitemcheckbox"]:has-text("대한민국 공휴일")';
    await d.click(holiday, 1500);
    await d.click(holiday, 1200);
    // 녹화 계정에 구독 캘린더가 있으면 첫 번째 것도 껐다 켠다
    const subscribed = page.locator('[role="menuitemcheckbox"]').nth(1);
    if (await subscribed.count()) {
      await d.click(subscribed, 1500);
      await d.click(subscribed, 1200);
    }
    await d.press('Escape', 1000);
  },
  다크모드: async (d) => {
    await d.click(settings);
    await d.click(d.settingsTab('화면'));
    await d.click(d.button('다크'), 1500);
    await d.click(d.button('라이트'), 1200);
    await d.press('Escape', 600);
  },
  투명도: async (d, page) => {
    // 실제로는 바탕화면이 비치지만 녹화엔 안 찍혀서 배경화면 대신 그라디언트를 깐다
    await page.evaluate(() => (document.documentElement.style.background = 'linear-gradient(135deg, #5b7fd6, #c48ad8 55%, #f2b39b)'));
    await d.click(settings);
    await d.click(d.settingsTab('화면'));
    // 한 번에 5%씩이라 커서를 한 번 올려 두고 빠르게 연타한다 (100% → 0% → 100%)
    const mash = async (target) => {
      await d.move(target, ARRIVE_PAUSE);
      for (let i = 0; i < 20; i++) {
        await page.mouse.down();
        await page.mouse.up();
        await d.wait(80);
      }
    };
    await mash('[role="menu"] button:has(svg.lucide-chevron-down)');
    await d.wait(1200);
    await mash('[role="menu"] button:has(svg.lucide-chevron-up)');
    await d.press('Escape', 800);
  },
  컬러팔레트: async (d) => {
    await d.click(settings);
    await d.click(d.settingsTab('캘린더'));
    await d.move(d.text('캘린더 팔레트'), 800); // 서브메뉴는 hover로 열리고, 클릭하면 도로 닫힌다
    await d.click(d.text('비비드'), 1300);
    await d.click(d.text('톤다운'), 1300);
    await d.click(d.text('파스텔'), 1000);
    await d.press('Escape', 300);
    await d.press('Escape', 600);
  },
  색상이름: async (d) => {
    await d.dblclick(cell(14));
    await d.click(d.button('일정 추가'));
    await d.type('팀 주간 회의', 300);
    await d.click('[aria-label="9번 색상"]', 400);
    await d.click('input[placeholder="무슨 일정에 쓸 색인가요?"]', 300);
    await d.type('업무', 500);
    await d.click(d.button('추가'), 1500);
    await d.press('Escape', 1500);
  }
};

const CDP_PORT = 9223;

// --seed: 클립이 전제하는 일정을 녹화 계정의 기본 캘린더에 만든다 (이번 달 기준, 한 번만 실행)
const SEED = () => {
  const today = new Date();
  const timed = (summary, colorId, date, from, to) => ({
    summary,
    colorId,
    start: { dateTime: `${date}T${from}:00+09:00`, timeZone: 'Asia/Seoul' },
    end: { dateTime: `${date}T${to}:00+09:00`, timeZone: 'Asia/Seoul' }
  });
  const allDay = (summary, colorId, date, end = date) => {
    const next = new Date(end);
    next.setDate(next.getDate() + 1);
    return { summary, colorId, start: { date }, end: { date: ymd(next) } };
  };
  const plus = (days) => ymd(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
  return [
    allDay('엄마 생신', '11', thisMonth(3)),
    timed('자격증 공부하기', '1', thisMonth(7), '08:00', '10:00'),
    timed('사이드 프로젝트 회의', '6', thisMonth(13), '20:10', '21:00'),
    allDay('제주도 2박 3일 여행', '7', thisMonth(17), thisMonth(19)),
    timed('병원 진료', '4', thisMonth(23), '10:30', '11:00'),
    timed('농구 대회 결승!', '5', thisMonth(27), '15:00', '18:00'),
    timed('팀 회의', '9', plus(0), '10:00', '11:00'),
    timed('헬스장', '2', plus(0), '19:00', '20:30'),
    timed('치과 예약', '4', plus(1), '14:00', '15:00'),
    allDay('보고서 마감', '11', plus(2)),
    { ...timed('영어 스터디', '3', thisMonth(1), '07:00', '08:00'), recurrence: ['RRULE:FREQ=WEEKLY;INTERVAL=1'] }
  ];
};

const seed = async (page) => {
  for (const event of SEED()) {
    const { status } = await page.evaluate(
      (body) => window.api.googleRequest('https://www.googleapis.com/calendar/v3/calendars/primary/events', { method: 'POST', body: JSON.stringify(body) }),
      event
    );
    console.log(`${status === 200 ? '✓' : `✗ ${status}`} ${event.summary}`);
  }
};

// npm run dev와 같은 dev 앱을 원격 디버깅 포트와 함께 띄우고 CDP로 붙는다
// (Playwright의 _electron.launch는 dev 서버와 함께 쓸 수 없다: electron-vite dev가 앱을 따로 띄워 단일 인스턴스 잠금에 걸린다)
const startApp = async () => {
  const dev = spawn('npx', ['electron-vite', 'dev', '--remoteDebuggingPort', String(CDP_PORT)], { cwd: ROOT, shell: true, stdio: 'ignore' });
  const stop = () => execFileSync('taskkill', ['/pid', String(dev.pid), '/t', '/f'], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) {
    try {
      const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
      const page = browser
        .contexts()[0]
        ?.pages()
        .find((p) => p.url().startsWith('http://localhost'));
      if (page) return { page, stop };
      await browser.close();
    } catch {
      // 아직 앱이 안 떴다
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  stop();
  throw new Error('dev 앱에 연결하지 못했어요');
};

const prepare = async (page) => {
  // 앞 클립이 바꾼 테마·미니뷰 등이 남지 않게 매번 비우고 시작한다 (dev 렌더러 localStorage라 실사용 앱과 무관)
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  // 창은 바탕화면에 부착된 채로 두고 뷰포트만 홈페이지 FeatureVideo 비율(1200:1032)로 맞춘다
  await page.setViewportSize(SIZE);
  // 일정이 들어오는 장면이 찍히지 않게, 일정이 뜬 뒤 공휴일·구독 캘린더까지 자리 잡을 시간을 더 준다
  await page.locator('[data-event]:visible').first().waitFor();
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    const root = document.documentElement;
    // 다른 앱(터미널 등)에 포커스가 있으면 앱이 disable-click으로 클릭을 막으므로 녹화 중엔 바로 떼어낸다
    new MutationObserver(() => root.classList.contains('disable-click') && root.classList.remove('disable-click')).observe(root, { attributeFilter: ['class'] });
    root.classList.remove('disable-click');
    // 투명 창이라 녹화에선 빈 곳이 검게 찍히므로 흰 배경을 깔고, dev에서만 뜨는 TanStack Query 개발 도구 버튼은 숨긴다
    root.style.background = '#fff';
    document.querySelectorAll('.tsqd-parent-container').forEach((el) => (el.style.display = 'none'));
    // 녹화엔 OS 커서가 안 찍혀서 페이지 안에 가짜 커서를 그린다
    const cursor = document.createElement('div');
    cursor.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M5 3l0 16l4.5-4.2l3 6.2l2.6-1.2l-3-6.1l6.2-.2z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, { position: 'fixed', left: '0', top: '0', zIndex: '2147483647', pointerEvents: 'none', transform: 'translate(-50px,-50px)' });
    root.appendChild(cursor);
    addEventListener('mousemove', (e) => (cursor.style.transform = `translate(${e.clientX - 5}px,${e.clientY - 3}px)`), true);
  });
  await page.mouse.move(470, 600);
  await page.waitForTimeout(500);
};

const record = async (page, name) => {
  // webm은 영문 이름으로 둔다: Node 24(Windows)의 rmSync가 없는 한글 경로를 지우려 하면 프로세스가 죽는다
  const webm = join(OUT, 'recording.webm');
  try {
    await prepare(page);
    await page.screencast.start({ path: webm, size: SIZE });
    await page.waitForTimeout(500);
    await CLIPS[name](driver(page), page);
    await page.screencast.stop();
    execFileSync('ffmpeg', [
      '-y',
      '-loglevel',
      'error',
      '-i',
      webm,
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      '-preset',
      'veryslow',
      '-tune',
      'animation',
      '-crf',
      '30',
      '-movflags',
      '+faststart',
      '-an',
      join(OUT, `${name}.mp4`)
    ]);
    unlinkSync(webm);
    console.log(`✓ ${name}`);
  } catch (error) {
    await page.screencast.stop().catch(() => {});
    await page.screenshot({ path: join(OUT, `failed-${Date.now()}.png`) }).catch(() => {});
    console.error(`✗ ${name}: ${error.message}`);
    process.exitCode = 1;
  }
};

const args = process.argv.slice(2);
if (args.includes('--list')) {
  console.log(Object.keys(CLIPS).join('\n'));
} else {
  mkdirSync(OUT, { recursive: true });
  const unknown = args.filter((name) => name !== '--seed' && !CLIPS[name]);
  if (unknown.length) throw new Error(`없는 클립: ${unknown.join(', ')}`);
  const { page, stop } = await startApp();
  try {
    if (args.includes('--seed')) await seed(page);
    else for (const name of args.length ? args : Object.keys(CLIPS)) await record(page, name);
  } finally {
    stop();
  }
}
