# Plan: 추첨 연출 BGM·효과음

확정 spec/design 이후 구현 작업을 추적하는 계획 문서다.
**진행 상태의 단일 기준은 이 파일의 체크박스다** — 채팅이 아니라 여기서 상태를 읽는다.
각 작업은 독립적으로 완료·검증할 수 있는 Work Package(WP)로 쪼갠다.

## 상태

- 상태: Active
- 변경 등급: Standard
- 작성일: 2026-07-05
- 작성자: Claude Code

## 기준 문서

- PROJECT.md: PROJECT.md
- spec: docs/specs/draw-sound.md (Approved 2026-07-05)
- design: docs/design/draw-sound.md (확정 — 절충안)
- research/proposals: docs/research/draw-sound-assets.md / docs/design/draw-sound-proposals.md

## 실행 전 확인

- 현재 브랜치: feature/draw-sound — main 아님
- main 직접 작업 아님: 예
- 작업트리 상태: clean (설계 확정 커밋 240a94d 이후, 기존 미추적 파일 dgp4d.jpg·.agents/·.codex/만 잔존)
- 사용자 승인: spec Approved 확인됨 (2026-07-05, chmg7626-blip)
- CI 상태: main 직전 통과 (PR #2)
- 미결정 사항: 없음

## Work Packages

WP 하나는 따로 완료·검증할 수 있는 크기로 잡는다. 끝나면 체크박스와 상태를 함께 갱신한다.

- [x] WP-001: 사운드 모듈 (재생 계층 + 설정 저장)
  - 목적: 소리의 "요청"과 "실제 재생"을 분리하는 얇은 계층과 음소거 설정 저장을 만든다.
  - 변경 파일: src/sound/soundPlayer.ts(신규 — SoundEvent enum·SoundPlayer 인터페이스·
    HTMLAudio 실구현·BASE_URL 기준 URL 조립·실패 무해 no-op), src/sound/soundPlayer.test.ts(신규),
    src/storage/soundPreference.ts(신규), src/storage/soundPreference.test.ts(신규)
  - 완료 조건: 저장값 없음·읽기 실패=기본 ON(경계값), 저장·복원 왕복, setMuted 시 play 무음,
    로드·재생 실패가 예외를 던지지 않음 — spec "음소거 토글"·"건너뛰기·오류" 조건의 모듈 단위 부분
  - 검증: npm test (신규 단위 테스트 통과), npm run typecheck
  - 위험: jsdom에 HTMLMediaElement.play가 없음 — 실구현 테스트는 mock/spy 경계까지만, 실재생은
    WP-004 수동 확인으로 미룸
  - 상태: done (2026-07-05 — 테스트 39개·typecheck·lint 통과)

- [x] WP-002: CC0 음원 확보·배치 + research 최종 목록
  - 목적: research 후보에서 실제 사용할 음원 5종(bgm·shoot·cutin·suspense·fanfare)을 확보한다.
  - 변경 파일: public/sounds/\*(신규 음원), docs/research/draw-sound-assets.md(최종 사용 파일
    목록·라이선스 재확인 기록)
  - 완료 조건: 각 파일의 개별 페이지 CC0 표시를 다운로드 시점에 재확인, 웹 친화 포맷(mp3/ogg)으로
    배치, research에 최종 목록 갱신 — spec "접근성·자산" 라이선스 조건
  - 검증: 파일 존재·포맷·용량 확인(효과음 수십 KB·BGM 수백 KB 수준), research 문서 갱신 diff
  - 위험: Freesound·ZapSplat 다운로드에 계정 필요 가능성 — 그 경우 사용자가 브라우저에서 직접
    다운로드(외부 사이트 로그인은 Claude가 하지 않음). .aif 후보는 변환 또는 대체.
  - 상태: done (2026-07-05 — 사용자 다운로드 5종을 ffmpeg(mp3 128k)로 변환·배치, 총 ~2.1MB.
    BGM은 후보와 달리 Pixabay 트랙으로 교체 — spec 요구 9 갱신·research 위험 기록. 빌드에서
    dist/sounds 정적 복사·번들 미포함 확인)

- [x] WP-003: 연출 통합 (세션 시작·phase 결합·음소거 토글 UI)
  - 목적: 확정 설계대로 소리를 연출에 결합한다 — 클릭 핸들러 세션 시작 + phase 전이 재생 요청.
  - 변경 파일: src/App.tsx(handleDraw에서 load+bgm 시작, reduced-motion 경로 제외, soundPlayer·
    음소거 상태 소유), src/components/DrawOverlay.tsx(phase 전이 시 shoot/cutin/suspense/fanfare
    요청 + ref 가드, 결과 진입 시 stopAll 후 fanfare 1회, 언마운트 stopAll, 음소거 토글 버튼),
    src/App.test.tsx·src/components/DrawOverlay.test.tsx(mock SoundPlayer 주입 테스트), CSS(토글 버튼)
  - 완료 조건: spec "재생 흐름"·"음소거 토글"·"건너뛰기·오류"·"접근성" 완료 조건 전체 —
    클릭 전 무음 / bgm→shoot→cutin(×6)→suspense→fanfare 요청 순서 / 확인 시 전부 정지 /
    건너뛰기 정리·팡파르 1회 / 토글 즉시 적용·localStorage 유지 / reduced-motion 무음
  - 검증: npm test (React.act 컴포넌트 테스트 — 기존 타이머 테스트 패턴 재사용), npm run lint
  - 위험: StrictMode 이중 effect로 소리 중복(설계의 ref 가드로 대응), 기존 연출 테스트 회귀
  - 상태: done (2026-07-05 — 테스트 47개·typecheck·lint 통과. 사운드 테스트 8개 추가)

- [x] WP-005: BGM 홈 배경음 전환 (2026-07-05 spec 요구 1·3·4·8 변경 반영)
  - 목적: BGM을 연출 구간에서 홈페이지 배경음으로 옮긴다 — 첫 상호작용 시작, 뽑기 시 정지,
    확인 후 멈춘 지점부터 재개, 홈 화면 음소거 토글 상시 노출.
  - 변경 파일: src/sound/soundPlayer.ts(bgm 위치 보존 play/stopAll), src/App.tsx(첫 상호작용
    리스너·handleDraw 정지·confirmDraw 재개·페이지 토글), src/styles.css(페이지 토글),
    관련 테스트 갱신
  - 완료 조건: spec "재생 흐름"·"음소거 토글"·"접근성" 갱신 조건 — 상호작용 전 무음 /
    첫 상호작용 시 BGM / 뽑기 클릭 시 BGM 정지 / 확인 시 이어서 재개 / 홈 토글 즉시 적용 /
    reduced-motion에서 BGM 유지·효과음 없음
  - 검증: npm test·typecheck·lint + 실브라우저 확인
  - 위험: 첫 상호작용이 뽑기 클릭 자체인 경우(pointerdown→bgm 시작 직후 click→정지) — 무해하나
    실브라우저 확인. StrictMode 리스너 중복은 remove/re-add로 처리.
  - 상태: done (2026-07-05 — 테스트 49개·typecheck·lint 통과, 홈 토글 실브라우저 표시 확인.
    실제 소리 재생·재개는 사용자 청취 확인 대기)

- [x] WP-006: BGM 제거 + 팡파르 타이밍 수정 (2026-07-05 spec 3차 변경 반영)
  - 목적: BGM 완전 제거(산만함), 팡파르를 마지막 공 공개 순간으로 동기화, 드럼롤을 공개
    순간에 끝나게 트림.
  - 변경 파일: src/sound/soundPlayer.ts(bgm 이벤트 삭제·원복), src/App.tsx(리스너·홈 토글
    제거, load만 유지), src/components/DrawOverlay.tsx(팡파르를 마지막 showcase로·skip 보장),
    src/styles.css, public/sounds/(bgm.mp3 삭제·suspense 트림·fanfare 무음 제거), 테스트 갱신,
    research 최종 목록 갱신
  - 완료 조건: spec 갱신된 "재생 흐름" — 뽑기 전 무음 / 마지막 컷인 팡파르(결과 컷 중복 없음) /
    건너뛰기 팡파르 1회 / 확인 시 정지
  - 검증: npm test·typecheck·lint + 실브라우저 청취(사용자)
  - 위험: 드럼롤 트림 길이(1.1초)가 체감상 짧거나 길 수 있음 — 사용자 청취로 조정
  - 상태: done (2026-07-05 — 테스트 47개·typecheck·lint 통과. bgm.mp3 삭제·suspense 1.1s·
    fanfare 무음 제거. 타이밍 체감은 사용자 청취 확인 대기)

- [ ] WP-004: 최종 검증 (spec 완료 조건 전체)
  - 목적: 조각 검증이 아니라 spec 완료 조건 전체 충족을 확인하고 완료를 선언한다.
  - 변경 파일: (검증 전용 — 필요 시 수정 커밋)
  - 완료 조건: spec의 체크리스트 전 항목 (재생 흐름·음소거·건너뛰기·오류·접근성·자산·회귀·품질 게이트)
  - 검증: npm run lint && npm run typecheck && npm test && npm run build, dist에서 음원이 JS 번들
    미포함 확인(정적 복사만), npm run dev로 실브라우저 수동 확인(소리 재생·토글 즉시성·건너뛰기·
    reduced-motion), verify 스킬로 증거 보고
  - 위험: 실브라우저 항목(모바일 Safari 재생·reduced-motion)은 로컬에서 확인 한계 — 확인 못 한
    항목은 "못 돌림"으로 명시
  - 상태: pending

## 실패 루프

막히면 어디서 다시 시작할지 (development-workflow.md "실패·수정 루프" 참조):

- 검증 실패: 원인 격리 → debug 스킬
- Codex 리뷰 지적: 로직·계약·보안 변경이면 수정 후 재검토, 설정·포맷이면 CI 재실행
- CI 실패: 별도 수정 커밋으로 처리
- spec 변경 필요: spec부터 고치고 사람이 재승인 → 필요하면 재설계

## 롤백 계획 (High-Risk 필수, 그 외 선택)

- 되돌리는 방법: 구현 커밋 revert (도메인·기존 연출 로직 무변경이라 커밋 단위 revert로 충분)
- 데이터 백업·복구: 해당 없음 (localStorage 키 추가뿐 — 삭제·마이그레이션 없음)
- 롤백 후 확인: 기존 테스트 통과 + 추첨 연출 무음 동작 확인

## 최종 검증

모든 WP가 done이면 전체가 목표를 달성했는지 따로 확인한다:

- [ ] spec 완료 조건 충족
- [ ] 테스트 (정상·오류·경계값)
- [ ] lint/typecheck
- [ ] Codex 독립 검토 (Standard·High-Risk)
- [ ] CI 통과
- [ ] 사람 최종 확인 → main 병합

## 변경 기록

- 2026-07-05: 확정 설계(절충안) 기준으로 plan 작성 — WP-001 모듈 → WP-002 음원 →
  WP-003 통합 → WP-004 최종 검증.
- 2026-07-05: 실행 순서 변경 — WP-003을 WP-002보다 먼저 진행. 이유: WP-002는 음원 사이트
  다운로드에 사용자 계정·브라우저가 필요할 수 있고, WP-003은 mock 주입으로 독립 검증 가능
  (soundPlayer는 음원 부재 시 no-op이라 통합이 먼저여도 무해).
- 2026-07-05: WP-005 추가 — 사용자 요청으로 BGM을 홈 배경음으로 전환(spec 요구 1·3·4·8
  변경·재승인). WP-004 최종 검증은 WP-005 뒤로.
