const notionKey = process.env.NOTION_API_KEY
const notionDbId = process.env.NOTION_DB_ID
const githubToken = process.env.GITHUB_PAT
const repo = process.env.REPO

/** 🔹 Notion DB에서 데이터 가져오기 */
async function fetchNotionIssues() {
    console.log('🔹 Notion DB에서 이슈 조회 중...')

    const res = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${notionKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })

    if (!res.ok) {
        throw new Error(`❌ Notion API 요청 실패: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    return data.results
}

/** 🔹 GitHub Issue 생성 */
async function createGitHubIssue(title, body, labels) {
    const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: 'POST',
        headers: {
            Authorization: `token ${githubToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            title,
            body,
            labels
        })
    })

    if (!res.ok) {
        throw new Error(`❌ GitHub Issue 생성 실패: ${res.status} ${res.statusText}`)
    }

    const result = await res.json()
    console.log(`✅ Issue 생성 완료: #${result.number} - ${title}`)
}

/** 🔹 메인 로직 */
async function main() {
    try {
        const issues = await fetchNotionIssues()

        for (const page of issues) {
            const properties = page.properties

            const title = properties['이름']?.title[0]?.plain_text || 'Untitled'
            const status = properties['상태']?.status?.name || ''
            const type = properties['기능']?.multi_select.map((item) => item.name) || []
            const priority = properties['우선순위']?.select?.name || '보통'
            const date = properties['발견일시']?.date?.start || ''

            // 🔹 GitHub Issue body 내용 구성
            const body = `
                **발견일시**: ${date}
                **우선순위**: ${priority}
                **상태**: ${status}
                    
                자동으로 동기화된 Notion Issue 입니다.
            `

            // 🔹 상태가 "시작 전" 인 것만 생성
            if (status === '시작 전') {
                const labels = [...type, priority] // 기능 + 우선순위를 라벨로
                await createGitHubIssue(title, body, labels)
            } else {
                console.log(`⏭ '${title}'은(는) 상태가 '${status}'이므로 건너뜀`)
            }
        }

        console.log('🎉 모든 동기화 완료!')
    } catch (err) {
        console.error('❌ 오류 발생:', err.message)
        process.exit(1)
    }
}

main()
