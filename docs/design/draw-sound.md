# 추첨 연출 BGM·효과음 설계 (확정)

- 작성일: 2026-07-05
- 기준 spec: docs/specs/draw-sound.md
- 출처: docs/design/draw-sound-proposals.md 의 사용자 결정 (절충안)

독립 설계안 비교에서 사용자가 결정한 확정 설계다. plan·구현은 이 문서를 기준으로 한다.

## 구조

- `src/sound/soundPlayer.ts`
  - `SoundEvent = 'bgm' | 'shoot' | 'cutin' | 'suspense' | 'fanfare'`
  - `interface SoundPlayer { load(): void; play(event: SoundEvent): void; stopAll(): void; setMuted(muted: boolean): void }`
  - 실구현은 HTMLAudioElement 기반(새 런타임 의존성 없음). BGM은 `loop=true`, 효과음은 짧은
    파일 재생. 음원 URL은 `import.meta.env.BASE_URL` 기준으로 조립한다(Codex B — GitHub Pages
    서브패스 배포 대비). 로드·재생 실패는 전부 catch 후 무시 — 소리 실패가 연출을 막지 않는다
    (spec 요구 6).
- `src/storage/soundPreference.ts` — localStorage 캡슐화(폴더 규약 `src/storage/`).
  저장값 없음·읽기 실패 = 기본 ON (spec 요구 3, 경계값).
- 음원 파일: `public/sounds/` 정적 자산. JS 번들에 import하지 않는다(spec 요구 7).
  CC0 확인·최종 목록은 docs/research/draw-sound-assets.md 갱신으로 관리(spec 요구 9).
- 통합 (2026-07-05 BGM 홈 배경음 전환 반영):
  - **BGM은 첫 사용자 상호작용(pointerdown·keydown 1회)에서 시작**한다 — 자동재생 정책상
    로드 직후 시작은 불가하므로 window 리스너로 제스처 체인 안에서 `load()`+`play('bgm')`
    (spec 요구 1·4). `번호 뽑기` 클릭(`App.handleDraw`)은 `stopAll()`로 BGM을 멈추고 연출로
    넘어가며, `확인`(`confirmDraw`)은 `stopAll()` 후 `play('bgm')`으로 멈춘 지점부터 재개한다.
    reduced-motion 분기에서는 BGM을 멈추지 않고 연출 효과음도 없다(spec 요구 8).
  - `DrawOverlay`는 `soundPlayer`를 prop으로 주입받아 phase 전이에 소리를 결합:
    shooting 진입=`shoot`(휙), showcase 진입=`cutin`(팝), suspense 진입=`suspense`(드럼롤),
    result 진입=`stopAll()` 후 `fanfare` 1회. 건너뛰기도 result 진입이므로 같은 경로로 정리된다
    (spec 요구 5).
  - 음소거 토글 버튼은 **홈 화면(상시)과 오버레이 안** 양쪽에 둔다(spec 요구 3). 토글 시
    preference 저장 + `setMuted` 즉시 적용.
  - 이를 위해 `soundPlayer`의 재생 의미를 나눈다: 효과음 `play`는 항상 처음부터,
    **`play('bgm')`은 이어서 재생**(currentTime 유지). `stopAll()`은 전부 멈추되 효과음만
    처음으로 되감고 BGM 위치는 보존한다(멈춘 지점 재개 — spec 요구 1).

## 핵심 결정

1. **A 골격 — 단일 `play(event)` API + 이벤트 enum**: 재생 계층 표면적을 최소로 유지.
   테스트는 mock `SoundPlayer` 주입으로 "언제 어떤 이벤트를 요청했는가"를 검증(spec 요구 10).
2. **B에서 채택 ① — 사용자 제스처 핸들러에서 세션 시작**: mount useEffect만으로 소리를
   시작하면 엄격한 브라우저에서 제스처 체인으로 인정되지 않을 수 있다. 제스처 이벤트 핸들러
   안에서 `load()`+BGM 시작을 연결해 자동재생 정책을 보수적으로 만족시킨다(spec 요구 4).
   (2026-07-05 변경: 시작 지점이 `번호 뽑기` 클릭 → **첫 상호작용 window 리스너**로 이동 —
   BGM이 홈 배경음이 되면서. 제스처 체인 원칙은 동일.)
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
- **음원 로드가 첫 소리 시점보다 늦음**: 클릭 시 load 시작이라 첫 BGM·슛 소리가 몇백 ms 늦거나
  빠질 수 있다. 실패·미로드는 무해(no-op)가 원칙이고, 파일을 작게 유지해 완화한다. 필요하면
  구현 중 preload 시점을 앞당기는 보정은 plan에서 다룬다(첫 화면 로드는 막지 않는 범위에서).
- **라이선스 표시 변동**: 다운로드 시점에 개별 페이지 CC0 표시를 재확인하고 research 문서의
  최종 사용 파일 목록을 갱신한 뒤에만 커밋한다(spec 요구 9).
- **실브라우저 확인 항목**: 음소거 토글 즉시성, 모바일(iOS Safari) 재생 동작은 jsdom으로 검증
  불가 — 수동 확인 목록으로 plan에 남긴다.

## 구현 및 검증 순서

1. `soundPlayer`(인터페이스+HTMLAudio 실구현+no-op 폴백)·`soundPreference` 모듈 + 단위 테스트
   (기본 ON 경계값, 저장·복원, 실패 무해성).
2. CC0 음원 확보: 개별 페이지 라이선스 재확인 → 다운로드 → 포맷 변환(웹 친화) →
   `public/sounds/` 배치 → research 문서에 최종 파일 목록·확인 결과 갱신.
3. 통합: `App.handleDraw` 세션 시작(reduced-motion 경로 제외), `DrawOverlay` phase 결합 +
   음소거 토글 UI. 컴포넌트 테스트(React.act + mock SoundPlayer): 클릭 전 무음, 재생 요청
   순서(bgm→shoot→cutin×…→suspense→fanfare), 확인 시 stopAll, 건너뛰기 정리, 토글 저장·즉시
   적용, reduced-motion 무음.
4. 회귀·verify: 기존 연출·도메인 테스트 통과 확인, lint·typecheck·test·build, 빌드 산출물에서
   음원이 JS 번들에 포함되지 않았는지 확인.

## 변경 이력

- 2026-07-05: BGM을 연출 구간 → 홈페이지 배경음으로 전환(spec 요구 1·3·4·8 변경·재승인 반영).
  첫 상호작용 시작·뽑기 시 정지·확인 후 이어서 재개, 홈 화면 토글 추가, play/stopAll의 BGM
  위치 보존 의미 추가. 나머지 구조·결정은 유지.
