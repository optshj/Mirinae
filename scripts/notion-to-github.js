import axios from 'axios'

const notionKey = process.env.NOTION_API_KEY
const notionDbId = process.env.NOTION_DB_ID
const githubToken = process.env.GITHUB_PAT
const repo = process.env.REPO // username/repo 자동 가져오기

async function main() {
    console.log('🔹 Notion → GitHub Issue Sync 시작')

    // 1. Notion DB에서 데이터 가져오기
    const notionRes = await axios.post(
        `https://api.notion.com/v1/databases/${notionDbId}/query`,
        {},
        {
            headers: {
                Authorization: `Bearer ${notionKey}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            }
        }
    )

    const pages = notionRes.data.results
    console.log(`📦 Notion에서 ${pages.length}개의 이슈를 가져옴`)

    // 2. GitHub Issue 생성
    for (const page of pages) {
        const title = page.properties.Name.title[0]?.plain_text || 'Untitled'
        const body = page.properties.Description.rich_text[0]?.plain_text || ''
        const status = page.properties.Status.select?.name || 'ToDo'

        // "ToDo" 상태인 것만 처리
        if (status === 'ToDo') {
            console.log(`➡️ GitHub Issue 생성: ${title}`)

            await axios.post(
                `https://api.github.com/repos/${repo}/issues`,
                {
                    title,
                    body,
                    labels: ['notion-sync'] // 자동 라벨
                },
                {
                    headers: {
                        Authorization: `token ${githubToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            )
        }
    }

    console.log('✅ Sync 완료!')
}

main().catch((err) => {
    console.error('❌ 오류 발생:', err.message)
    process.exit(1)
})
