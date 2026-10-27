# aquapado.com

파도(pado)가 만들어 공개한 사이트를 한곳에 모은 허브 페이지. Vite + React, GitHub Pages(Actions 자동 배포).

- 사이트 목록은 `src/data/sites.js` 한 파일에서 관리한다(분류·설명·링크).
- 정적 하위 페이지는 `public/<slug>/index.html`로 얹는다(`/palworld/`, `/tools/`, `/privacy/`).
- `master`에 올리면 워크플로가 빌드·배포한다.

```bash
npm ci
npm run dev     # 개발 서버
npm run build   # dist/ 검증
```
