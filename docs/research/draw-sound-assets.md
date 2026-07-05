# 추첨 연출 음원 출처·라이선스 조사

- 조사일: 2026-07-05
- 조사 방법: 사용자가 외부 도구로 직접 조사, 출처·결론 확인 후 기록 (development-workflow "외부 조사·자문" 절)
- 관련 spec: docs/specs/draw-sound.md

## 질문

웹앱(GitHub 공개 저장소 + 정적 배포, 상업적 배포 가능성 포함)에 쓸 무료 음원 —
① BGM 루프 1개(추첨/게임쇼 분위기), ② 효과음 4종(휙/woosh, 임팩트/팝, 드럼롤 서스펜스, 팡파르) —
을 구할 수 있는 사이트와 라이선스 조건(CC0 여부, 상업적 사용, 표기 의무, 재배포 허용).

## 결론

**"개별 파일 페이지에 CC0가 명시된 것"만 사용한다.** CC0는 저작권자가 권리를 포기한 형태로,
상업적 복사·수정·배포·공연을 허용하고 허락 요청·저작자 표기가 필요 없다. 공개 저장소에 소스와
함께 음원을 올려도 문제없다. 단, 원작자/사이트가 우리 서비스를 보증하는 것처럼 보이게 하면 안 된다.
(근거: Creative Commons CC0 1.0 deed — https://creativecommons.org/publicdomain/zero/1.0/deed.en)

추천 조합: BGM은 ZapSplat CC0 게임쇼 카운트다운 트랙, 효과음 4종은 Freesound CC0 개별 파일.
간편 대안: Kenney.nl 오디오 팩(전체 CC0 — UI 팝·전자음 대체용으로 적합).

## 바로 쓸 후보 5개 (전부 CC0 표시 확인)

| 용도                          | 파일                                             | 출처 URL                                                       |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| BGM(게임쇼 카운트다운 분위기) | ZapSplat — Ascending xylophone riff              | https://www.zapsplat.com/music/ascending-xylophone-riff/       |
| 휙(woosh)                     | Freesound — Swing Woosh (Jofae, 0.315초 WAV)     | https://freesound.org/people/Jofae/sounds/389590/              |
| 임팩트/팝                     | Freesound — Quick pop (Rvgerxini)                | https://freesound.org/people/Rvgerxini/sounds/465264/          |
| 드럼롤 서스펜스               | Freesound — drumroll.aif (Heigh-hoo, 6.241초)    | https://freesound.org/people/Heigh-hoo/sounds/19433/           |
| 팡파르                        | Freesound — Fanfare 3 - Rpg (colorsCrimsonTears) | https://freesound.org/people/colorsCrimsonTears/sounds/607407/ |

## 사이트별 라이선스 판단

- **Freesound**: 개별 파일이 CC0로 표시된 경우 상업 사용·수정·배포 가능, 표기 불필요
  (FAQ: https://freesound.org/help/faq/). **주의**: 파일마다 CC0/CC-BY/CC-BY-NC가 섞여 있음 —
  반드시 License: Creative Commons 0 필터 + 개별 페이지 하단 라이선스 확인.
- **ZapSplat**: 개별 페이지에 CC0 1.0 Universal License가 표시된 사운드만 표기 없이 사용 가능
  (FAQ: https://www.zapsplat.com/faq/). **주의**: 전체가 CC0 아님 — Standard License는 무료 계정에서
  표기 의무가 생기므로 CC0 표시된 것만 사용.
- **Kenney.nl**: 게임 에셋 전부 public domain/CC0, 상업 사용 가능·표기 불필요
  (지원 페이지: https://kenney.nl/support, UI Audio 팩: https://kenney.nl/assets/ui-audio).
- **OpenGameArt**: CC0 컬렉션 다수 (예: Short Loops Background Music Pack —
  https://opengameart.org/content/short-loops-background-music-pack). **주의**: 컬렉션 페이지는
  여러 자료 묶음 — 각 파일 상세 페이지의 License(s): CC0 확인 후 사용.

## 피하는 곳

**Pixabay·Mixkit 등 일반 royalty-free 사이트**: 무료·상업 사용처럼 보여도 CC0가 아닌 자체
라이선스. Pixabay는 "standalone basis" 판매·배포 제한이 있음
(https://pixabay.com/service/license-summary/). 이번 기준(CC0 + 재배포 명확 허용)에서는 제외.

## 운영 규칙 (조사 결론에서 도출)

- 다운로드한 음원은 파일 옆에 출처 링크와 "CC0"를 기록해 둔다(배포·심사 대비).
- spec 요구사항 9(출처·라이선스 기록 후 도입)의 기록 위치는 이 문서다 — 실제 도입 파일이
  확정되면 이 문서에 최종 사용 파일 목록을 갱신한다.

## 불확실성

- 위 개별 파일의 CC0 표시는 조사 시점 기준이다. **다운로드 시점에 각 페이지의 라이선스 표시를
  다시 확인**하고, 달라졌으면 이 문서를 갱신한다.
- ZapSplat은 다운로드에 계정이 필요할 수 있음(확인 필요 — 조사에서 미확정).
- 각 후보의 실제 음질·길이·루프 적합성은 들어보기 전까지 미확정 — 설계는 "후보 교체 가능"을
  전제로 한다.
