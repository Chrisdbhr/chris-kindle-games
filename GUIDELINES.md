# Architecture Limitations & Guidelines

This web-app is custom-built to run natively on the experimental browser (extremely legacy Webkit) of Kindle E-readers (e.g., Paperwhite, 10th gen).

## 1. Strict JavaScript Rules (ES5 Only)
The Kindle browser engine will CRASH and completely IGNORE the JS file if it contains any ES6+ syntax.
- **FORBIDDEN**: `let` or `const` (Use strictly `var`).
- **FORBIDDEN**: *Arrow Functions* `() => {}` (Use classic `function() {}`).
- **FORBIDDEN**: *Destructuring* or *Spread/Rest operators* `[...array]`. Substitute with `.slice()`, etc.
- Always write Javascript as if you were programming for IE8/IE9 in 2011.

## 2. Strict CSS Rules
The engine is aggressive, slow to render, and ignores most modern properties.
- **FORBIDDEN**: CSS Variables `:root { --var: color }`. CSS will fail massively on a Kindle if you try to interpolate variables.
- Colors (`white`, `black`, `#ccc`) **MUST** be hardcoded directly into classes!
- The E-Ink screen causes severe *Ghosting*. To mitigate it, we use `text-rendering: optimizeSpeed;` and avoid heavy text-shadows or gradients.

## 3. Sub-pixel Ghosting Fix (Black on Black WebKit Artifacts)
- When changing an element's background color (e.g., from white to black) while simultaneously hiding its text, Kindle's old anti-aliasing algorithm will leave a permanent gray ghost trace of the text.
- **Solution (Flash Clear)**: Hide the text first using `visibility:hidden`, let the WebKit flush the screen (e.g., `setTimeout` for 120ms-150ms to paint pure white), and then finally apply the `black` CSS class state. 
- Avoid directly mutating `.style.color` inline if it conflicts with a CSS-class background change on the same tick. Manage states firmly through explicit classes.

## 4. Layout & Grid Wrapping Bugs (Collapse Effect)
Any `div` without "weight" or real physical body will cause its `height` to collapse to zero.
- **Standard Solution (Empty Cells)**: Never leave a grid cell empty. If it needs to be transparent, inject a rigid invisible character: `<span style="visibility:hidden">0</span>` or `X`.
- **Legacy Grid Wraps Bug**: Old WebKit has fractional box-sizing rendering bugs regarding `float: left` and margins. This frequently causes grids to line-wrap early.
- **Grid Generation Solution**:
  1. Do not rely entirely on the container's width to auto-wrap elements perfectly.
  2. Dynamically inject a `<div class="clearfix"></div>` at the end of each physical row (e.g., after the 3rd element in TicTacToe, 4th in Memory, 9th in Sudoku).
  3. Force main board wrappers to use `box-sizing: content-box;` in CSS so custom borders/margins do not artificially shrink the available pixel runway.

## 5. Caching & Native Offline Support (AppCache)
The app now operates with a fully native Offline Mode tailored for the Kindle's archaic constraints.
- Modern Service Workers **will crash**. The only way to force offline caching is through the deprecated **HTML5 Application Cache** (`manifest.appcache`).
- Nginx provides a 1-year cache policy on static assets + proper MIME type dispatch for `.appcache`.
- **Cache Buster Rules**: You *MUST* modify the `# version X` string inside `manifest.appcache` to trigger a re-download on the device. Additionally, continue bumping `?v=X` on JS/CSS imports inside HTMLs as a fallback security measure.

## 6. Mobile Responsiveness (Smartphones)
The core layout is hardcoded for ~600px Kindle viewports.
- On smaller smartphone screens (`<500px`), elements will appear too tiny. Instead of re-flowing the entire layout via specific flex-bases, we apply an overarching `transform: scale(1.15)` digital zoom to the `.container` via `@media` queries. This guarantees a highly readable layout on phones while strictly preserving the integrity of the Kindle layout. Specific bloated grids (like Memory Hard Mode) utilize negative scaling `scale(0.85)` to prevent overflow sideways.
## 7. Design Visual & Ativos (Thumbnails)
- **Grid de 3 Colunas**: O menu principal (`index.html`) utiliza um layout de grade (3 itens por linha) inspirado na Kindle Store. Use `display: -webkit-flex` com `width: 31%` para os itens.
- **Thumbnails Pixel-Art**: Ativos visuais devem ser gerados em Pixel-Art de alto contraste, P&B, e processados via FFmpeg (`scale=60:-1`, `pix_fmt pal8`) para garantir peso mínimo (<3KB) e nitidez em telas E-ink.
- **Arquitetura de Descrições**: 
    - No menu, use descrições curtas (`_desc`) para economizar espaço vertical.
    - Nas telas de detalhes (`setup-screen`), exiba as regras completas (`_rules`) dentro de um box com borda sólida e a thumbnail em destaque (`.detail-thumb`).
- **Standardization**: Todas as bandeiras e ícones de interface devem ser estritamente retangulares (sem bordas arredondadas) para manter a consistência estética do sistema.
