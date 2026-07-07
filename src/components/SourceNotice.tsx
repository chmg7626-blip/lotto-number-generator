// 데이터 출처·비공식 고지. 전체 회차 재배포 허가가 미확인이라 사용자가 위험을 감수하며 정한
// 완화 조치다 — 출처 표기·비공식 명시·삭제 수용 문구를 항상 노출한다
// (spec docs/specs/real-data-deploy.md, docs/research/lotto-draw-data.md "사용자 결정").
export function SourceNotice() {
  return (
    <footer className="source-note">
      <p>
        당첨번호 출처:{' '}
        <a
          href="https://www.dhlottery.co.kr/lt645/winNumber"
          target="_blank"
          rel="noreferrer"
        >
          동행복권 로또 6/45 회차별 당첨번호
        </a>
      </p>
      <p>
        본 서비스는 동행복권·복권위원회와 무관한 비공식 서비스이며, 데이터
        재배포 허가를 받은 것이 아닙니다. 권리자 요청 시 데이터를 삭제합니다.
      </p>
      {/* CC-BY 4.0은 저작자 표시가 라이선스 조건이다 — 항상 노출한다. */}
      <p>
        효과음:{' '}
        <a
          href="https://freesound.org/people/mokasza/sounds/810764/"
          target="_blank"
          rel="noreferrer"
        >
          "single bubble pop 02" by mokasza
        </a>{' '}
        (Freesound, CC BY 4.0)
      </p>
    </footer>
  )
}
