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

  it('updater가 실제 push 결과 SHA를 artifact로 전달한다', () => {
    expect(updateWorkflow).toContain('head-sha.txt')
    expect(updateWorkflow).toContain('actions/upload-artifact@v4')
    expect(updateWorkflow).toContain('updated-head-sha')
  })

  it('workflow_run 검사와 배포가 updater의 실제 결과 commit을 checkout한다', () => {
    const pinnedRef = 'ref: ${{ needs.resolve.outputs.commit_sha }}'

    expect(ciWorkflow).toContain('actions/download-artifact@v4')
    expect(ciWorkflow).toContain('github.event.workflow_run.id')
    expect(ciWorkflow).not.toContain('workflow_run.head_sha')
    expect(ciWorkflow.split(pinnedRef)).toHaveLength(3)
  })
})
