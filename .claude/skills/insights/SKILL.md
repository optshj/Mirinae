---
name: insights
description: 미리내 PostHog 데이터(앱 + 랜딩 mirinae.today)로 통계 인사이트를 낼 때 쓰는 지식. 이벤트 의미, 개발 계정 제외 규칙, 해석 함정을 담는다. "인사이트", "통계", "지표", "사용자 몇 명", "유입", "전환", "리텐션", "광고 성과" 요청에 쓴다. 분석을 서브에이전트에 맡길 땐 `insights` 에이전트를 쓴다.
---

# 미리내 통계 인사이트

PostHog 프로젝트 `Mirinae`(id 462161, 타임존 Asia/Seoul) 하나에 데스크톱 앱과 랜딩(`www.mirinae.today`, 저장소 `../Mirinae_Page`) 이벤트가 같이 들어온다.

## PostHog 도구 쓰는 법

- `mcp__claude_ai_PostHog__exec`로 호출한다. 분석 전에 `learn -s "<키워드>"`로 서버 스킬을 먼저 불러온다. 서버 스킬은 PostHog 버전에 맞춰져 있어 외부 문서보다 정확하다. 주로 쓰는 스킬은 `posthog:querying-posthog-data`, `posthog:investigate-metric`, `posthog:modeling-product-usage-metrics`다.
- 이벤트·속성 이름은 `read-data-schema`로 확인한 뒤에 쓴다. 추측한 이름으로 쿼리하지 않는다.

## 반드시 거를 것

**개발·QA 계정은 사람 단위로 뺀다.** 이벤트 단위로 `$host`만 거르면 개발 PC의 운영 앱 기록이 남는다. localhost 이벤트가 한 번이라도 있는 `person_id`를 통째로 제외한다.

```sql
WITH dev AS (
  SELECT DISTINCT person_id FROM events
  WHERE timestamp > now() - INTERVAL 180 DAY
    AND startsWith(coalesce(properties.$host, ''), 'localhost')
)
... WHERE person_id NOT IN (SELECT person_id FROM dev)
  AND NOT coalesce(properties.$virt_is_bot, false)
```

- dev 포트: 앱 `localhost:5173`/`5174`, 랜딩 `localhost:3000`/`3123`
- 거르지 않으면 숫자가 크게 부푼다. 예: 2026년 10월 신규 앱 사용자가 15명으로 나오지만 실제로는 2명이다.

## 이벤트 구분

| 출처 | `$host` | 대표 이벤트 |
|---|---|---|
| 랜딩 | `www.mirinae.today` | `$pageview`, `download_button_click`, `unsupported_os_download_click`, `pc_link_copy`, `docs_link_click`, `bug_report_link_click` |
| 앱 | `app` 또는 null | `app_launched`(속성 `app_version`, `platform`, `theme`, `palette_set`, `bg_opacity`), 그 외 기능 이벤트 |

- 앱 이벤트 이름은 `src/renderer` 전체에서 `posthog.capture(`를 grep하면 나온다. 랜딩 이벤트는 `../Mirinae_Page/src`에서 찾는다.
- 앱의 `autocapture`와 `capture_pageview`는 꺼져 있다. 앱 안에서는 `$pageview`가 없다.

## 해석 함정

- **웹 방문자와 앱 사용자는 연결되지 않는다.** 앱에서 `posthog.identify`를 호출하지 않아서 같은 사람도 `person_id`가 다르다. "다운로드 클릭 → 설치" 전환은 정확히 계산할 수 없고, 같은 기간의 두 숫자를 비교하는 정도만 가능하다.
- **사라진 이벤트를 현재 문제로 읽지 않는다.** 결론을 내기 전에 그 이벤트가 지금 코드에 있는지 grep하고, `max(timestamp)`로 마지막 발생 시점을 확인한다. 예: `auto_login_failed`는 #158에서 제거됐고 2026-09-20 이후 데이터가 없다.
- **UTM이 없다.** 지금은 광고 유입을 `$referring_domain`으로만 나눌 수 있다.
- **표본이 작다.** 앱 사용자는 수십 명, 랜딩 방문자는 주 수십 명이다. 비율 대신 "n명 중 m명"으로 쓰고, 10명 미만 구간에서는 결론을 내지 않는다.
- **랜딩 방문자 대부분이 모바일이다.** 앱은 Windows 전용이라 기기별로 나눠 보지 않으면 전환율이 왜곡된다.

## 보고 형식

한국어로 쓴다.
- 맨 위에 기간, 제외한 대상(개발 계정·봇), 표본 크기를 적는다.
- 인사이트마다 근거 수치와 "그래서 무엇을 할지"를 붙인다.
- 데이터로 확인할 수 없는 건 추정이라고 밝히고, 확인하려면 무엇을 계측해야 하는지 적는다.
