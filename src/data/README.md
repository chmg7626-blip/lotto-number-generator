# 당첨 데이터

## ⚠️ draws.sample.json 은 실제 당첨번호가 아니다

`draws.sample.json` 은 **코드 로직·UI 확인용으로 무작위 생성한 가짜 데이터**다(30회차).
실제 로또 당첨 이력이 아니므로 통계에 어떤 의미도 없다.

## 실데이터 교체

공개 배포 전에 실제 당첨번호로 교체해야 한다. 스키마(`DrawsFile`)만 동일하면 파일 내용만 바꾸면 된다.

```ts
type Draw = { round: number; date?: string; numbers: number[]; bonus: number }
type DrawsFile = { draws: Draw[] }
```

실데이터 출처·이용약관 확인은 외부 조사로 사용자가 직접 수행하고 결과를 `docs/research/` 에 기록한다
(확정 설계 docs/design/lotto-mvp.md 의 "실데이터 출처·이용약관 미검증" 배포 게이트).
