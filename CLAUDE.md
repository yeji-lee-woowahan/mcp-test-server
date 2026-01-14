# MCP mandao - MCPHUB 아키텍처 검증용 테스트 서버

## 🎯 프로젝트 배경

이 프로젝트는 **MCPHUB 플랫폼 구축을 위한 사전 아키텍처 검증** 목적의 MCP 서버입니다.

### 최종 목표: MCPHUB
사내 MCP(Model Context Protocol) 도구를 검색, 등록, 실행, 관리할 수 있는 통합 플랫폼.
- Provider: MCP 서버를 개발하고 등록
- Customer: 등록된 MCP 서버를 검색하고 활용
- 단일 진입점(Gateway)으로 Internal/External MCP 실행을 표준화

상세 기획은 `docs/MCPHUB/` 폴더 참고.

### 현재 목적: 아키텍처 검증
MCPHUB를 구축하기 전, 다양한 예외 케이스를 직접 MCP 서버로 구현해보며 Hub가 처리해야 할 시나리오를 검증합니다.

- 실제 구현 스펙: `docs/명세.md`
- 아키텍처 리뷰 체크리스트: `docs/케이스스터디.md`

---

## 🛠️ 기술 스택

- **Runtime**: Node.js + TypeScript
- **Protocol**: MCP (Model Context Protocol) - JSON-RPC 2.0 기반

---

## 📌 작업 가이드

1. **기존 코드 스타일 준수**: 같은 역할의 파일이 있으면 양식을 맞출 것
2. **Hub 관점으로 검증**: 각 기능 구현 시 "Hub가 이걸 어떻게 처리해야 하는가?"를 항상 고려
3. **에러 케이스 우선**: 정상 케이스보다 예외/에러 케이스 구현이 더 중요
4. **문서화**: 구현 스펙은 `docs/명세.md`, 아키텍처 리뷰 사항은 `docs/케이스스터디.md`에 기록

---

## 📝 Confluence 위키 작성 가이드

### MCP 도구 사용
- `mcp_confluence_create_page`: 새 페이지 생성
- `mcp_confluence_update_page`: 페이지 수정
- `mcp_confluence_get_page_content`: 페이지 내용 조회

### Mermaid 다이어그램 작성법

Confluence에 Mermaid 다이어그램을 넣을 때는 **expand + code 구조**를 사용합니다:

```xml
<ac:structured-macro ac:name="expand">
  <ac:parameter ac:name="title">다이어그램 제목 (예: 인증 Flow, AS-IS 흐름)</ac:parameter>
  <ac:rich-text-body>
    <ac:structured-macro ac:name="code">
      <ac:parameter ac:name="language">mermaid</ac:parameter>
      <ac:plain-text-body><![CDATA[flowchart LR
    A --> B
    B --> C]]></ac:plain-text-body>
    </ac:structured-macro>
  </ac:rich-text-body>
</ac:structured-macro>
```

**주의사항:**
- `expand`의 `title`은 "Mermaid code" 대신 **다이어그램 이름**으로 설정 (예: "인증 Flow", "AS-IS 구조")
- 코드 블록만 넣으면 코드로 표시됨
- **다이어그램 렌더링**은 사용자가 편집기에서 `/mermaid diagram` 매크로를 직접 추가해야 함
- Mermaid Diagrams Viewer 앱이 코드 블록을 감지해서 옆에 다이어그램을 자동 렌더링함
