# 추첨 연출 BGM·효과음 설계 (확정)

## 2026-07-15 통합 변경

`App` mount에서 `load()`와 `startBgm()`을 호출하고, document 첫 click capture는 자동재생 차단 fallback으로 유지한다. `SoundPlayer.startBgm()`은 기존 loop source가 있어도 먼저 suspended `AudioContext`를 resume하도록 순서를 바꾼다. `DrawOverlay`는 결과 phase 진입을 `onComplete`로 한 번 알리고, `App`이 그 시점에 BGM을 재개한다. gain은 0.20이다.

- 작성일: 2026-07-05
- 기준 spec: docs/specs/draw-sound.md
- 출처: docs/design/draw-sound-proposals.md 의 사용자 결정 (절충안)

독립 설계안 비교에서 사용자가 결정한 확정 설계다. plan·구현은 이 문서를 기준으로 한다.

## 구조

- `src/sound/soundPlayer.ts`
  - `SoundEvent = 'bgm' | 'shoot' | 'cutin' | 'suspense' | 'fanfare'`
  - `interface SoundPlayer { load(): void; play(event: SoundEvent): void; stopAll(): void; setMuted(muted: boolean): void; startBgm(): void; stopBgm(): void }`
  - 실구현은 Web Audio API 기반(새 런타임 의존성 없음)이다. 음원을 `AudioBuffer`로 decode하고,
    BGM source만 `loop=true`로 유지한다. 음원 URL은 `import.meta.env.BASE_URL` 기준으로 조립한다
    (GitHub Pages 서브패스 배포 대비). 로드·재생·resume 실패는 전부 catch 후 무시해 소리 실패가
    연출을 막지 않는다(spec 요구 6).
- `src/storage/soundPreference.ts` — localStorage 캡슐화(폴더 규약 `src/storage/`).
  저장값 없음·읽기 실패 = 기본 ON (spec 요구 3, 경계값).
- 음원 파일: `public/sounds/` 정적 자산. JS 번들에 import하지 않는다(spec 요구 7).
  CC0 확인·최종 목록은 docs/research/draw-sound-assets.md 갱신으로 관리(spec 요구 9).
- 통합 (2026-07-15 현재 동작):
  - `App` mount에서 `load()`와 `startBgm()`을 즉시 시도한다. 자동재생이 차단된 브라우저를 위해
    document 첫 click capture에서 `startBgm()`을 한 번 더 호출한다. 일반 뽑기 시작 시
    `stopBgm()`으로 배경음을 멈추고, 모든 공이 공개되어 result phase에 진입하면
    `DrawOverlay.onComplete`를 통해 `startBgm()`을 재개한다. reduced-motion 경로는 연출이 없으므로
    BGM을 중단하지 않는다.
  - `DrawOverlay`는 `soundPlayer`를 prop으로 주입받아 phase 전이에 소리를 결합:
    shooting 진입=`shoot`(휙), 1~5번째 showcase 진입=`cutin`(팝), suspense 진입=`suspense`
    (드럼롤 — **파일을 서스펜스 0.8초+마지막 슛 0.3초 ≈ 1.1초로 트림**해 공개 순간에 끝난다),
    **마지막 showcase 진입=`stopAll()` 후 `fanfare`**(번호 공개와 동기 — spec 요구 2).
    result 진입은 팡파르가 이미 울렸으면 아무것도 안 하고, 건너뛰기로 바로 왔으면 그때
    `stopAll()`+`fanfare` 1회(spec 요구 5). 확인(`confirmDraw`) 시 `stopAll()`(spec 완료 조건).
  - 음소거 토글 버튼은 오버레이 안에 둔다(연출 중·결과 컷 모두 접근 가능 — spec 요구 3).
    토글 시 preference 저장 + `setMuted` 즉시 적용.

## 핵심 결정

1. **A 골격 — 단일 `play(event)` API + 이벤트 enum**: 재생 계층 표면적을 최소로 유지.
   테스트는 mock `SoundPlayer` 주입으로 "언제 어떤 이벤트를 요청했는가"를 검증(spec 요구 10).
2. **즉시 시작 + 첫 click fallback**: mount에서 `load()`+`startBgm()`을 시도해 허용되는 환경에서는
   첫 화면부터 재생한다. 엄격한 자동재생 정책으로 실패한 환경은 document 첫 click capture에서
   `AudioContext.resume()`과 BGM 시작을 한 번 더 요청한다(spec 요구 4).
3. **B에서 채택 ② — `BASE_URL` 기준 음원 참조**: GitHub Pages는 `/<repo>/` 서브패스로
   배포되므로 절대경로 `/sounds/...`는 깨진다. `import.meta.env.BASE_URL`로 조립한다.
4. **음소거는 muted 플래그(A)**: 정지/재개 방식(B) 대신 muted 유지 — BGM 재생 위치가 보존돼
   토글 왕복이 자연스럽고, muted 상태에서도 play "요청"은 동일하게 발생해 상태 복원 로직이
   필요 없다. 비용: 음소거 중에도 오디오 리소스는 재생 상태(영향 미미).
5. **효과음도 CC0 파일 사용, Web Audio 합성 미도입**: 조사된 후보로 충분하고 합성은 품질 대비
   복잡도가 높다(YAGNI). `.aif` 후보(드럼롤)는 웹 친화 포맷(mp3/ogg)으로 변환하거나 대체
   후보를 고른다(CC0 조건 안에서 — B 위험 지적 수용).
6. **연출 타이밍 무변경**: 소리는 기존 phase 전이에만 종속. DrawOverlay의 타이머·상태 머신은
   건드리지 않는다(spec 범위 밖 "리듬·타이밍 변경" 준수).

## 위험과 대응

- **StrictMode 이중 effect로 소리 중복**: phase 전이 effect의 소리 호출에 ref 가드(직전 재생한
  phase·shotCount 기록)를 둔다. 팡파르는 result 진입 1회만 — 건너뛰기·일반 도달이 같은 경로를
  타므로 가드가 겸한다(B 위험 지적 수용).
- **음원 로드가 첫 소리 시점보다 늦음**: mount에서 load를 시작해도 첫 BGM·슛 소리가 몇백 ms
  늦거나 빠질 수 있다. 실패·미로드는 무해(no-op)가 원칙이고, 파일을 작게 유지해 완화한다.
- **라이선스 표시 변동**: 다운로드 시점에 개별 페이지 CC0 표시를 재확인하고 research 문서의
  최종 사용 파일 목록을 갱신한 뒤에만 커밋한다(spec 요구 9).
- **실브라우저 확인 항목**: 음소거 토글 즉시성, 모바일(iOS Safari) 재생 동작은 jsdom으로 검증
  불가 — 수동 확인 목록으로 plan에 남긴다.

## 구현 및 검증 순서

1. `soundPlayer`(인터페이스+Web Audio 실구현+no-op 폴백)·`soundPreference` 모듈 + 단위 테스트
   (기본 ON 경계값, 저장·복원, 실패 무해성).
2. CC0 음원 확보: 개별 페이지 라이선스 재확인 → 다운로드 → 포맷 변환(웹 친화) →
   `public/sounds/` 배치 → research 문서에 최종 파일 목록·확인 결과 갱신.
3. 통합: `App` mount 즉시 시작·첫 click fallback·`handleDraw` 정지, `DrawOverlay` phase 및
   `onComplete` 재개 + 음소거 토글 UI. 컴포넌트 테스트(React.act + mock SoundPlayer):
   startBgm→stopBgm→효과음→result startBgm 순서, 확인 시 stopAll, 건너뛰기 정리,
   토글 저장·즉시 적용, reduced-motion 연출 효과음 없음.
4. 회귀·verify: 기존 연출·도메인 테스트 통과 확인, lint·typecheck·test·build, 빌드 산출물에서
   음원이 JS 번들에 포함되지 않았는지 확인.

## 변경 이력

- 2026-07-15: 현재 구현 기준으로 즉시 BGM 시작 시도, 첫 click 자동재생 fallback, 뽑기 중 정지,
  result phase 재개, Web Audio API와 gain 0.20을 확정했다. 아래 2026-07-05 항목은 이전 결정의
  변경 과정을 기록한 이력이며 현재 동작의 기준이 아니다.
- 2026-07-05: BGM을 연출 구간 → 홈페이지 배경음으로 전환(spec 요구 1·3·4·8 변경·재승인 반영).
  첫 상호작용 시작·뽑기 시 정지·확인 후 이어서 재개, 홈 화면 토글 추가, play/stopAll의 BGM
  위치 보존 의미 추가. 나머지 구조·결정은 유지.
- 2026-07-05: **BGM 제거 + 팡파르 타이밍 수정**(spec 3차 변경 반영). SoundEvent에서 bgm 삭제,
  첫 상호작용 리스너·홈 토글·BGM 위치 보존 로직 제거(원복). 팡파르를 결과 컷 → 마지막 공
  대형 컷인으로 이동, 드럼롤 파일 ≈1.1초 트림. 건너뛰기 경로는 result 진입에서 팡파르 1회 보장.
- 2026-07-05: 소리 트리거를 phase 반영 후 useEffect → **전이 타이머 콜백 안(리렌더 전)**으로
  이동(사용자 체감 피드백 — 번호가 소리보다 먼저 보임). 렌더 사이클+오디오 시작 지연만큼의
  지연을 제거. shoot 앞 무음 42ms·fanfare 꼬리 무음 2.1초 트림. StrictMode 중복 가드는
  "타이머 1회 실행 + 팡파르 ref 가드"로 대체(키 가드 불필요).
