# 추첨 연출 BGM·효과음 — 독립 설계안 비교

- 작성일: 2026-07-05
- 기준 spec: docs/specs/draw-sound.md
- 참고 research: docs/research/draw-sound-assets.md
- 상태: 결정됨

Claude Code와 Codex가 같은 spec(과 research)만 보고 서로 독립적으로 작성한 두 설계안이다.
두 안이 모두 나오기 전에는 서로의 설계안을 공유하지 않았다 (독립성). 사용자가 방향을 결정한다.

## Claude Code 설계안

- 구조:
  - `src/sound/soundPlayer.ts` — `SoundEvent = 'bgm' | 'shoot' | 'cutin' | 'suspense' | 'fanfare'`
    이벤트 enum 하나와 `SoundPlayer` 인터페이스(`load()`, `play(event)`, `stopAll()`,
    `setMuted(muted)`). 실구현은 HTMLAudioElement 기반(BGM은 `loop=true`, 효과음은 짧은 파일
    재생). 로드·재생 실패는 전부 catch 후 무시(no-op) — 소리 실패가 연출을 막지 않는다.
  - `src/storage/soundPreference.ts` — localStorage 캡슐화(기존 폴더 규약 `src/storage/`).
    저장값 없음·읽기 실패 = 기본 ON.
  - `DrawOverlay`가 `soundPlayer`를 prop으로 주입받고, **기존 phase 전이에 소리를 결합**:
    mixing 진입=bgm 시작, shooting 진입=shoot(휙), showcase 진입=cutin(팝),
    suspense 진입=suspense(드럼롤), result 진입=stopAll 후 fanfare 1회. 건너뛰기도 result
    진입이므로 같은 경로로 정리된다. 확인(언마운트) 시 stopAll.
  - 음소거 토글 버튼은 오버레이 안(건너뛰기 옆·결과 컷에도 표시). 토글 시 preference 저장 +
    `setMuted` 즉시 적용.
  - 음원 파일은 `public/sounds/` 정적 자산 — JS 번들에 import하지 않는다. `번호 뽑기` 클릭
    시점(`handleDraw`)에 `load()`를 시작한다.
- 핵심 결정:
  1. 재생 계층을 인터페이스로 분리해 주입 — "언제 어떤 소리를 요청하는가"를 mock으로 단위
     테스트(spec 요구 10). 실제 오디오는 브라우저에서 수동 확인.
  2. HTMLAudioElement만 사용, Web Audio 미도입 — 효과음도 합성하지 않고 CC0 파일 사용.
     조사된 후보 5개로 충분하고, 합성 코드는 품질 대비 복잡도가 높다(YAGNI).
  3. 트리거를 DrawOverlay의 기존 phase 전이에 결합 — 별도 타이밍 시스템을 만들지 않고 연출
     타이밍을 전혀 바꾸지 않는다.
  4. 음소거는 정지가 아니라 muted 플래그 — BGM 재생 위치가 유지돼 토글 재개가 자연스럽고,
     muted 상태에서도 play "요청"은 동일하게 발생해 테스트 로직이 단순하다.
- 장점: 이벤트 enum 하나라 재생 계층 표면적이 최소. 기존 phase 머신을 그대로 써서 연출 코드
  변경이 작다. muted 방식이라 토글 왕복에 상태 복원 로직이 필요 없다.
- 위험:
  - StrictMode 개발 모드에서 effect 이중 실행으로 소리 중복 — phase 전이 effect에 ref 가드 필요.
  - play 호출이 useEffect(클릭의 비동기 후속) 시점이라, 매우 엄격한 브라우저에서 제스처 체인으로
    인정 안 될 가능성이 이론상 있음(오버레이 mount가 클릭 직후라 대부분 허용 — 실브라우저 확인 필요).
  - muted 유지 방식은 음소거 중에도 오디오 리소스가 재생 상태로 남는다(리소스 영향은 미미).
  - 후보 중 `.aif` 파일(드럼롤)은 브라우저 호환이 불확실 — 웹 포맷 변환 필요.
- 구현 및 검증 순서: ① soundPlayer·soundPreference 모듈+단위 테스트 → ② CC0 음원 확보·포맷
  변환·research 최종 목록 갱신 → ③ DrawOverlay·App 통합+음소거 토글 UI+컴포넌트 테스트(React.act)
  → ④ 회귀 테스트·lint·typecheck·test·build·번들 산출물 확인(verify).

## Codex 설계안

- 구조:
  - 기존 추첨 오버레이의 시각 상태 흐름은 그대로 두고, 그 위에 얇은 사운드 계층을 붙인다.
  - `DrawSoundPlayer` 인터페이스: `prepare`, `startBgm`, `playBallReveal`, `playSuspense`,
    `playResult`, `stopAll`, `setMuted` (의미 있는 메서드 단위).
  - 실구현은 HTMLAudioElement 기반, 새 런타임 의존성 없음. 오버레이/연출 상태 hook은 시각
    이벤트 발생 시 사운드 인터페이스에 "요청"만 보낸다. 테스트는 mock player 주입.
  - 음원은 `public/audio/draw/` 경로 + `import.meta.env.BASE_URL` 기준 URL 참조.
    JS 초기 번들에 import하지 않는다.
- 핵심 결정:
  - BGM은 오버레이 시작 시 재생, 공개·서스펜스 구간 유지. **결과 컷 진입 시 BGM·진행 효과음을
    정리한 뒤 팡파르 1회** — 결과 화면에 오래 머물러도 BGM이 계속 돌지 않는다.
  - 효과음 매핑: 공 공개 6회=`ballReveal`(woosh 중심, 필요시 pop 보강) / 마지막 공 직전=`suspense`
    드럼롤 / 결과 컷=`result` 팡파르.
  - 음소거: 저장값 없음·읽기 실패=기본 ON. **토글 OFF는 즉시 stopAll + 이후 요청 무시. 토글 ON은
    결과 전 단계면 BGM을 다시 시작**하고, 지나간 일회성 효과음은 재생하지 않는다.
  - **재생 시작은 반드시 `번호 뽑기` 클릭 경로에서 연결**(자동재생 정책 — mount useEffect만으로
    시작하면 일부 환경에서 차단될 수 있음). 음원 준비는 idle 또는 첫 클릭 시 비동기, 재생 실패
    promise는 모두 catch.
  - CC0 확인은 도입 직전 재확인하고 research에 최종 파일 목록 갱신. `.aif` 등 브라우저 호환이
    불확실한 파일은 웹 친화 포맷으로 변환하거나 대체 후보 선택.
- 장점: 번호 생성 로직·추첨 타이밍 무변경, 사운드는 연출 상태 변화에만 종속. mock 주입으로
  jsdom에서 "재생 요청 순서" 검증 가능. 음원 JS import 없음 → 초기 번들 비대화 위험 낮음.
  재생 계층이 실패해도 UI·번호 공개는 진행.
- 위험:
  - StrictMode·상태 재진입으로 같은 phase effect가 두 번 실행되면 효과음 중복 —
    `sessionId + eventType + ballIndex` 단위 중복 방지 필요.
  - 건너뛰기와 일반 도달이 같은 결과 컷 이벤트를 만들 수 있어 팡파르는 세션당 1회만.
  - 외부 음원은 조사 시점과 다운로드 시점의 라이선스 표시가 다를 수 있음 — 구현 전 재확인 필수.
  - 자동재생 정책상 play()는 클릭 이후 흐름에서 호출돼야 함 — 클릭 핸들러에서 세션 시작 연결이 안전.
- 구현 및 검증 순서: ① 오버레이 상태 소유자·이벤트 지점 확인 → ② DrawSoundPlayer 인터페이스 +
  no-op/mock 가능한 실제 player → ③ localStorage sound preference hook(기본 ON, 실패 시도 ON) →
  ④ 뽑기 클릭에서 사운드 세션 시작, phase 전환에서 ballReveal·suspense·result 요청 → ⑤ 확인·
  unmount·건너뛰기에서 stopAll·세션 정리 → ⑥ CC0 음원 public 배치 + research 갱신 → ⑦ mock
  테스트(기본 ON 흐름·클릭 전 무음·확인 시 stop·토글 저장/즉시 적용·skip 정리·reduced-motion
  무음·음원 실패 무해성) → ⑧ lint·typecheck·test·build + 번들에 음원 미포함 확인.

## 핵심 차이

| 항목             | Claude Code                                                                                                      | Codex                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 재생 API         | `play(event)` 단일 메서드 + 이벤트 enum                                                                          | `startBgm`·`playBallReveal` 등 의미 메서드 분리                         |
| 소리 시작 지점   | 오버레이 phase 전이(useEffect) — mount가 클릭 직후임에 의존                                                      | `번호 뽑기` 클릭 핸들러에서 사운드 세션 시작(자동재생 정책에 더 보수적) |
| 음소거 토글 동작 | muted 플래그 유지(재생 위치 보존, 요청은 계속 발생)                                                              | OFF=stopAll+요청 무시, ON=결과 전이면 BGM 재시작                        |
| 중복 재생 방지   | effect ref 가드                                                                                                  | sessionId+eventType+ballIndex 단위 중복 방지                            |
| 음원 경로        | `public/sounds/`                                                                                                 | `public/audio/draw/` + `BASE_URL` 기준 참조(서브패스 배포 대비)         |
| 효과음 구성      | 슛(woosh)과 컷인(pop)을 별도 이벤트로                                                                            | 공개(ballReveal) 하나로 묶고 woosh 중심+pop 보강                        |
| 공통점           | HTMLAudio만 사용(새 의존성 없음)·mock 주입 테스트·결과 컷에서 BGM 정리 후 팡파르·기본 ON·실패 무해성·번들 미포함 | 동일                                                                    |

## 각 도구의 추천

- Claude Code 추천: 골격은 두 안이 사실상 같다(얇은 재생 계층 + phase 결합 + mock 테스트).
  A의 단순한 `play(event)` API와 muted 방식이 코드 표면적이 작아 유리하다. 다만 **B의 두 가지는
  A보다 명확히 낫다**: ① 클릭 핸들러에서 사운드 세션을 시작하는 것(자동재생 정책에 안전),
  ② `BASE_URL` 기준 음원 참조(GitHub Pages 서브패스 배포 예정이라 실질적 버그 예방).
  → **A 골격 + B의 이 두 결정을 얹은 절충안**을 추천.
- Codex 추천: (별도 비교 없이 자체 설계안 B를 제시 — 의미 메서드 API, 세션 기반 중복 방지,
  토글 OFF=정지/ON=BGM 재개, 클릭 경로 시작을 핵심으로 꼽음.)

## 사용자 결정

- 선택: 절충안 (2026-07-05)
- 선택 이유: 두 안의 골격이 사실상 같아, 표면적이 작은 A 골격에 B가 명확히 나은 두 결정을
  얹는 쪽이 비용 대비 안전하다.
- 추가 지시: A 골격(단일 `play(event)` API·muted 방식 음소거·phase 결합) + B의
  ① `번호 뽑기` 클릭 핸들러에서 사운드 세션 시작(자동재생 정책 보수 대응),
  ② `import.meta.env.BASE_URL` 기준 음원 참조(GitHub Pages 서브패스 배포 대비).
  확정 설계: docs/design/draw-sound.md
