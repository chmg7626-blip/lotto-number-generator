# 당첨 데이터

`draws.json`(전 회차 당첨번호)과 `latestPrize.json`(최신 회차 등수별 당첨금)은
`npm run data:update`(scripts/update-draws.ts)가 동행복권 공식 회차 조회에서 받아 생성한다.
**손으로 편집하지 않는다** — 스키마 검증(src/domain/drawsValidation.ts)을 통과한 것만 기록되고,
`src/data/dataFiles.test.ts`가 커밋된 파일을 같은 규칙으로 검사한다.

- 출처: 동행복권 로또 6/45 회차별 당첨번호 — https://www.dhlottery.co.kr/lt645/winNumber
- 비공식·재배포 허가를 받은 것이 아니며, 권리자 요청 시 삭제한다
  (조사·위험 감수 결정: docs/research/lotto-draw-data.md)
- 주간 자동 갱신: .github/workflows/update-data.yml (토 15:30 UTC = 일 00:30 KST)

## 스키마

```ts
type Draw = { round: number; date?: string; numbers: number[]; bonus: number }
type DrawsFile = { draws: Draw[] }
type LatestPrizeFile = {
  round: number // draws 최신 회차와 일치해야 한다
  tiers: { rank: 1 | 2 | 3 | 4 | 5; winners: number; prizePerGame: number }[]
}
```
