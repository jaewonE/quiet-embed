# Quiet Embed

[ [English](https://github.com/jaewonE/quiet-embed) | [한국어](https://github.com/jaewonE/quiet-embed/blob/master/README.ko.md) ]

Quiet Embed는 Markdown 노트 임베드를 일반 문서 내용처럼 보이게 만들면서, 원본 노트로 빠르게 이동할 수 있는 방법을 유지합니다.

## 기능

- Markdown 노트 임베드의 기본 테두리, 좌측 강조선, 들여쓰기를 제거합니다.
- 각 임베드의 제목 영역과 임베딩된 섹션의 첫 번째 렌더링 제목을 숨깁니다.
- 숨겨진 제목과 렌더링 래퍼가 남기던 상단의 빈 여백을 제거합니다.
- 임베드에 마우스를 올리거나 포커스하면 중앙은 투명하게 두고 네 가장자리에 `1px` 강조 `box-shadow` 외곽선과 고정 `4px` light/dark mode 그라데이션을 표시합니다.
- 임베드 본문이 그라데이션 영역과 겹치지 않도록 좌우 `6px` 여백을 추가합니다.
- macOS의 Command-click 또는 Windows/Linux의 Ctrl-click으로만 임베드 원본 노트를 엽니다.
- 임베딩된 원본 노트는 변경하지 않습니다. 플러그인은 렌더링된 화면만 조정합니다.

## 사용 방법

플러그인을 활성화한 뒤 일반 Obsidian 임베드를 작성합니다.

```markdown
![[note#heading]]
```

임베딩된 섹션은 Obsidian 기본 임베드 장식 없이 표시됩니다. 임베드 시작 지점에 렌더링되는 제목은 숨겨져 일반 문서 본문처럼 읽힙니다.

원본 노트를 열려면 macOS에서는 임베드를 Command-click하고, Windows/Linux에서는 Ctrl-click합니다. 일반 클릭, double-click, 키보드 조작으로는 원본 노트가 열리지 않습니다.

## 명령과 단축키

Quiet Embed는 명령이나 기본 단축키를 등록하지 않습니다.

## 설정

Quiet Embed `1.0.0`에는 설정 항목이 없습니다.

## 개인정보와 네트워크 접근

Quiet Embed는 네트워크 접근, 텔레메트리, 외부 서비스를 사용하지 않습니다. 현재 vault 밖의 파일을 읽지 않으며 vault 파일을 수정하지 않습니다. 플러그인이 활성화된 동안 Obsidian이 렌더링한 DOM 요소만 검사하고 조정합니다.

## 모바일과 데스크톱 지원

`isDesktopOnly`는 `false`입니다. 표시 정리는 모바일 가능한 Obsidian 화면에서도 동작할 수 있지만, Command/Ctrl-click 이동은 데스크톱 전용 동작입니다.

## 수동 설치

다음 경로에 파일을 복사합니다.

```text
<Vault>/.obsidian/plugins/quiet-embed/
```

필수 파일:

- `main.js`
- `manifest.json`
- `styles.css`

Obsidian을 다시 불러온 뒤 **Settings -> Community plugins**에서 **Quiet Embed**를 활성화합니다.

## 개발

```bash
npm install
npm run lint
npm run build
```

## 라이선스

GPL-3.0.
