import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const updateWorkflow = readFileSync('.github/workflows/update-data.yml', 'utf8')
const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8')

describe('주간 데이터 자동화 workflow', () => {
  it('당첨번호와 최신 당첨금을 같은 allowlist commit으로 갱신한다', () => {
    expect(updateWorkflow).toContain('src/data/draws.json')
    expect(updateWorkflow).toContain('src/data/latestPrize.json')
    expect(updateWorkflow).toContain("cron: '30 15 * * 6'")
  })

  it('bot push 완료 뒤 CI와 Pages 배포 workflow를 명시적으로 이어 실행한다', () => {
    expect(ciWorkflow).toContain('workflow_run:')
    expect(ciWorkflow).toContain('Update lotto data')
    expect(ciWorkflow).toMatch(/workflow_run\.conclusion\s*==\s*'success'/)
  })
})
