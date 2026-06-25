const notionKey = process.env.NOTION_API_KEY;
const notionDbId = process.env.NOTION_DB_ID;
const githubToken = process.env.GHP_PAT;
const repo = process.env.REPO;

/** 🔹 Notion DB에서 데이터 가져오기 */
async function fetchNotionIssues() {
  const res = await fetch(`https://api.notion.com/v1/databases/${notionDbId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!res.ok) throw new Error(`❌ Notion API 요청 실패: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.results;
}

/** 🔹 GitHub 모든 이슈 조회 */
async function fetchAllGitHubIssues() {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues?state=all&per_page=100`, {
    headers: {
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`❌ GitHub 이슈 조회 실패: ${res.status} ${res.statusText}`);
  return res.json();
}

/** 🔹 Notion ID 추출 */
function extractNotionId(body) {
  if (!body) return null;
  const match = body.match(/\*\*Notion ID\*\*: ([\w-]+)/);
  return match ? match[1] : null;
}

/** 🔹 GitHub Issue 생성 */
async function createGitHubIssue(title, body, labels) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ title, body, labels })
  });
  if (!res.ok) throw new Error(`❌ GitHub Issue 생성 실패: ${res.status} ${res.statusText}`);
  const result = await res.json();
  console.log(`✅ Issue 생성 완료: #${result.number} - ${title}`);
}

/** 🔹 GitHub Issue 닫기 */
async function closeGitHubIssue(issueNumber) {
  await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ state: 'closed' })
  });
  console.log(`🗑 Issue #${issueNumber} 닫음 (Notion에서 제거됨)`);
}

/** 🔹 메인 동기화 로직 */
async function main() {
  try {
    const [notionPages, githubIssues] = await Promise.all([fetchNotionIssues(), fetchAllGitHubIssues()]);

    const notionIds = notionPages.map((page) => page.id);

    // 🔹 GitHub에 없는 Notion 이슈 생성
    for (const page of notionPages) {
      const props = page.properties;
      const tag = props['태그']?.status?.name || 'Docs';
      const title = `[${tag}] ` + props['이름']?.title[0]?.plain_text || 'Untitled';
      const status = props['상태']?.status?.name || '';
      const type = props['기능']?.multi_select.map((i) => i.name) || [];
      const priority = props['우선순위']?.select?.name || '보통';
      const date = props['발견일시']?.date?.start || '';

      const body = `
                **Notion ID**: ${page.id}
                **발견일시**: ${date}
                **우선순위**: ${priority}
                **상태**: ${status}

                자동으로 동기화된 Notion Issue 입니다.
            `;

      if (status === '시작 전') {
        const exists = githubIssues.some((issue) => extractNotionId(issue.body) === page.id);
        if (!exists) {
          const labels = [...type, priority];
          await createGitHubIssue(title, body, labels);
        } else {
          console.log(`⏭ '${title}' 이미 GitHub에 존재`);
        }
      } else {
        console.log(`⏭ '${title}' 상태가 '${status}'이므로 건너뜀`);
      }
    }

    // 🔹 Notion에서 삭제된 이슈 GitHub 닫기
    for (const issue of githubIssues) {
      const notionId = extractNotionId(issue.body);
      if (notionId && !notionIds.includes(notionId) && issue.state !== 'closed') {
        await closeGitHubIssue(issue.number);
      }
    }

    console.log('🎉 모든 동기화 완료!');
  } catch (err) {
    console.error('❌ 오류 발생:', err.message);
    process.exit(1);
  }
}

main();
