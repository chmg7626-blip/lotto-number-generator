# GitHub Actions 데이터 갱신 후 Pages 배포 트리거

- 조사일: 2026-07-15
- 상태: Confirmed
- 질문: 주간 workflow가 `GITHUB_TOKEN`으로 main에 commit하면 기존 push CI와 Pages 배포가 자동 실행되는가?

## 확인 결과

실행되지 않는다. GitHub 공식 문서는 `GITHUB_TOKEN`을 사용한 작업이 만든 이벤트는 `workflow_dispatch`와 `repository_dispatch`를 제외하고 새 workflow run을 만들지 않으며, 해당 token으로 push한 commit은 GitHub Pages build도 만들지 않는다고 설명한다.

따라서 `Update lotto data` 완료 이벤트를 `workflow_run`으로 구독해, 성공 결론일 때 기존 CI와 Pages deploy를 실행한다. 별도 PAT이나 GitHub App token이 필요 없고 권한 범위를 늘리지 않는다.

## 출처

- GitHub Docs — Use GITHUB_TOKEN for authentication in workflows: https://docs.github.com/en/actions/concepts/security/github_token
- GitHub Docs — Events that trigger workflows: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
