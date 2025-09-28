import axios from 'axios'

const notionKey = process.env.NOTION_API_KEY
const notionDbId = process.env.NOTION_DB_ID
const githubToken = process.env.GITHUB_PAT
const repo = process.env.REPO // username/repo 자동 가져오기

/**
 * Notion 데이터베이스를 조회하여 'ToDo' 상태 항목을 GitHub 이슈로 생성합니다.
 *
 * Notion에서 데이터베이스 페이지 목록을 가져오고 각 페이지의 제목, 본문, 상태를 읽어
 * 상태가 정확히 'ToDo'인 항목만 지정된 GitHub 리포지토리에 이슈로 생성합니다.
 * 생성되는 이슈에는 'notion-sync' 라벨이 자동으로 추가됩니다.
 *
 * 사용되는 환경 변수: NOTION_API_KEY, NOTION_DB_ID, GITHUB_PAT, REPO
 */
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
