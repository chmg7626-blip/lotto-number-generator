# PostToolUse(Write|Edit) 훅: 방금 수정된 파일 하나만 포맷한다.
#
# 매 저장마다 프로젝트 전체를 포맷하지 않고, stdin JSON 의 tool_input.file_path 가
# 가리키는 그 파일에만 포맷터를 적용한다. 큰 저장소에서 전체 포맷은 느리고,
# 건드리지 않은 파일까지 바꿔 diff 를 더럽히기 때문이다.
#
# 실행 파일과 인자는 분리해서 넘긴다 (단일 문자열을 공백으로 쪼개지 않으므로
# 따옴표가 든 인자도 깨지지 않는다). 포맷터 인자는 -Executable 뒤에 위치로 나열한다.
# (-Arguments 라벨을 붙이면 PowerShell 이 "--write" 같은 대시 인자를 파라미터 이름으로
#  오해해 바인딩이 깨지므로, 라벨 없이 나열해 ValueFromRemainingArguments 로 흡수시킨다.)
# settings.json 예:
#   -Executable "npx"  prettier --write
#   -Executable "ruff" format
#
# 대상 파일 경로는 항상 마지막 단일 인자로 전달되어, 공백·한글·특수문자가 든
# Windows 경로에서도 안전하게 동작한다.
#
# 포맷 실패는 stderr 로 알리되, 원래 Write/Edit 작업까지 실패시키지 않도록
# 마지막은 항상 exit 0 으로 끝낸다.

param(
    [Parameter(Mandatory)]
    [string]$Executable,

    # 나머지 인자를 전부 흡수한다. 이렇게 받아야 "--write" 처럼 대시로 시작하는
    # 포맷터 옵션이 파라미터 이름으로 오해되지 않고 그대로 전달된다.
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Arguments = @()
)

# stdin 은 UTF-8 JSON 이다. 콘솔 기본 인코딩(Windows 코드페이지)으로 읽으면
# 한글·특수문자가 든 파일 경로가 깨지므로, UTF-8 로 명시해 디코드한다.
$reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8)
$raw = $reader.ReadToEnd()
try {
    $payload = $raw | ConvertFrom-Json
} catch {
    [Console]::Error.WriteLine("[format-file] stdin JSON 파싱 실패: $($_.Exception.Message)")
    exit 0
}

$path = $payload.tool_input.file_path
if (-not $path -or -not (Test-Path -LiteralPath $path -PathType Leaf)) { exit 0 }

try {
    & $Executable @Arguments $path
    if ($LASTEXITCODE -ne 0) {
        [Console]::Error.WriteLine("[format-file] 포맷터 종료 코드 $LASTEXITCODE — 대상: $path")
    }
} catch {
    [Console]::Error.WriteLine("[format-file] 포맷터 실행 예외: $($_.Exception.Message) — 대상: $path")
}

exit 0
