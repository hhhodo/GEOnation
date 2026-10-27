# GEO Nation — 지오네이션 사이트 (메인)

지오네이션㈜ 카탈로그 내용으로 만든 메인 페이지. 레이아웃은 Figma `수출바우처_WEB` 노드 17:7850(1920px, 9개 섹션)을 따릅니다.
GNB(회사 소개 / 제품·서비스 소개 / 사업 분야 / 문의하기)의 서브 페이지는 추후 제작합니다.

- 순수 HTML / CSS, `main` push 시 GitHub Pages 자동 배포
- `css/styles.css`는 공용 디자인 키트 원본(수정 안 함), `css/site.css`가 컴포넌트 (weight pair 600/400)
- Figma의 슬라이더 컨트롤·화살표 아이콘은 치트시트 금지 규칙에 따라 생략/대체(+)
- 이미지는 카탈로그 PDF와 제품 렌더 사진에서 추출 (원본 파일은 저장소에 포함하지 않음)

```bash
python3 -m http.server 8000
```
