# 📅 미리내 (Mirinae) - 데스크톱 캘린더 위젯

## 🔗 Quick Start

- **공식 홈페이지:** [mirinaecalendar.store](https://www.mirinaecalendar.store/)

**미리내(Mirinae)** 는 Electron, Vite, React를 기반으로 제작된 **심플하고 강력한 데스크톱 캘린더 위젯**입니다.
복잡한 기능은 덜어내고, 바탕화면에서 일정을 빠르게 확인하고 관리하는 핵심 경험에 집중했습니다.

## 소개 (Introduction)

"바탕화면에서 언제나 내 일정을 확인할 수 있다면 어떨까?"
미리내는 이런 단순한 생각에서 출발했습니다. 무거운 캘린더 앱을 켜지 않아도, 바탕화면 한구석에서 당신의 일정을 챙겨줍니다.

## 주요 기능 (Key Features)

- **📅 구글 캘린더 연동 (Google Calendar Sync)**
    - 구글 계정과 연동하여 실시간으로 일정을 불러오고 관리할 수 있습니다.
- **🖱️ 데스크톱 위젯 (Desktop Widget)**
    - **드래그 앤 드롭:** 위젯을 원하는 위치로 자유롭게 이동하세요.
    - **투명도 조절:** 바탕화면과 자연스럽게 어우러지도록 투명도를 조절할 수 있습니다.

- **🎨 직관적인 UI/UX**
    - **다크 모드 (Dark Mode):** 눈이 편안한 다크 모드를 지원하며, 시스템 설정에 맞출 수도 있습니다.

- **📝 일정 관리 (Event Management)**
    - 일정을 간편하게 **추가, 수정, 삭제**할 수 있습니다.
    - 완료된 일정은 체크하여 관리할 수 있습니다.

- **🗣️ 사용자 소통 (Feedback)**
    - 앱 내 '문의하기' 기능을 통해 개발자에게 직접 버그 제보나 기능 제안을 보낼 수 있습니다.

- **🔄 자동 업데이트 (Auto Update)**
    - 새로운 기능과 수정 사항을 자동으로 업데이트합니다.

## 기술 스택 (Tech Stack)

- **Core:** Electron, Vite, React, TypeScript
- **Styling:** Tailwind CSS, Radix UI, Lucide React
- **State & Data:** React Query (TanStack Query), Electron Store
- **Architecture:** FSD (Feature-Sliced Design)

## 📂 프로젝트 구조 (Project Structure)

`src/renderer` 폴더 내부는 FSD 아키텍처 규칙에 따라 구성되어 있습니다.

```
src/renderer/
├── app/          # 전역 설정, Provider, 라우팅 등
├── pages/        # 페이지 단위 컴포넌트 조합
├── widgets/      # 독립적인 기능을 가진 UI 블록 (Calendar, Header 등)
├── features/     # 비즈니스 로직이 포함된 기능 단위 (Login, AddEvent, DarkMode 등)
├── entities/     # 비즈니스 모델 및 UI (User, Event 등)
├── shared/       # 재사용 가능한 공통 컴포넌트, 유틸리티, 상수
└── ...
```
