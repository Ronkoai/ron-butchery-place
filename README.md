# Ron's Butchery Place

정적 HTML/CSS 개인 홈페이지. 빌드 도구 없이 파일을 그대로 열거나 GitHub Pages에 올리면 바로 동작해요.

## 폴더 구조

```
index.html      Home
about.html      About me
archive.html    Archive
contact.html    Contact
css/style.css   전체 스타일 (컬러·폰트 변수 포함)
js/main.js      모바일 메뉴 토글
images/         사진 폴더 (home / about / archive / shared)
```

## 사진 넣는 법

지금은 모든 사진 자리가 점선 테두리 플레이스홀더로 되어 있어요. 각 자리에 어떤 사진이 들어가면 좋을지 라벨을 달아뒀어요 (예: "사진: 흑백 정육 작업 포트레이트").

1. 사진 파일을 `images/home/`, `images/about/`, `images/archive/` 중 맞는 폴더에 넣기
2. 해당 HTML 파일을 열어서 `<div class="placeholder">...</div>` 부분을 아래처럼 바꾸기

```html
<!-- 변경 전 -->
<div class="placeholder">...</div>

<!-- 변경 후 -->
<img src="images/home/hero.jpg" alt="흑백 정육 작업 포트레이트">
```

사진 교체는 저한테 "이 자리에 이 사진 넣어줘"라고 요청하시면 대신 해드릴 수 있어요.

## GitHub Pages에 올리기

1. GitHub에서 새 저장소 생성 (예: `ron-butchery-place`)
2. 이 폴더 안의 파일 전부를 저장소에 업로드 (또는 `git push`)
3. 저장소 Settings → Pages → Branch를 `main` / `/(root)`로 지정 후 저장
4. 몇 분 뒤 `https://[깃허브아이디].github.io/ron-butchery-place/` 로 접속 가능

커스텀 도메인을 쓰고 싶으면 같은 Pages 설정 화면에서 도메인을 추가하면 돼요.

## 스크롤 등장 효과

섹션에 `class="reveal"`을 붙이면 스크롤해서 화면에 들어올 때 부드럽게 나타나요.

```html
<section class="reveal"> ... </section>
```

- 각 페이지의 **히어로(첫 화면)에는 일부러 안 넣었어요** — 첫 화면은 즉시 보여야 하니까요.
- Contact 페이지는 한 화면짜리라 효과 없이 그대로 보여요.
- 사용자가 기기에서 "동작 줄이기"를 켜두면 효과 없이 바로 보이도록 처리돼 있어요.

## 색상 · 폰트 토큰

`css/style.css` 상단 `:root` 안에 전부 변수로 정리되어 있어요. 색상 톤을 바꾸고 싶으면 이 변수 값만 수정하면 사이트 전체에 반영돼요.
