# Limitações Arquiteturais do Kindle (Aviso para IAs)

Este web-app foi construído sob medida para funcionar nativamente no navegador experimental (Webkit muito antigo) de E-readers Kindle (ex: Paperwhite, Kindle 10a geração). 

## 1. Regras Estristas de JavaScript
O motor do Kindle SOFRE CRASH E IGNORA o arquivo inteiro caso contenha qualquer sintaxe ES6+.
- **PROIBIDO** usar `let` ou `const` (Use estritamente `var`).
- **PROIBIDO** usar *Arrow Functions* `() => {}` (Use funções clássicas `function() {}`).
- **PROIBIDO** usar *Destructuring* ou *Spread/Rest operators* `[...array]`. Substitua por `.slice()`, etc.
- Trabalhe visualmente o Javascript como se estivesse programando para IE8/IE9 em 2011.

## 2. Regras Estritas de CSS
A engine é agressiva, lenta em renders e ignora propriedades modernas.
- **PROIBIDO** usar Variáveis de CSS `:root { --var: color }`. O CSS irá falhar massivamente num Kindle se você tentar interpolar variáveis.
- As Cores (`white`, `black`, `#ccc`) **DEVEM** ser hard-coded diretamente nas classes!
- O E-Ink causa *Ghosting* na tela. Para evitar que os blocos fiquem manchados, ativamos `text-rendering: optimizeSpeed;` e desativamos o *anti-aliasing*.

## 3. Comportamentos de Layout da Tela (Collapse Effect)
Qualquer `div` sem "peso" e corpo real causará colapso de tamanho `height` para zero, ignorando borders.
- **Solução Padrão**: Nunca deixe uma célula de grid sem tags. Se ela precisa estar visivelmente "vazia", injete o caractere rígido invisível: `<span style="visibility:hidden">X</span>`.
- O Box-sizing do Webkit legado tem deficiências nas margens. Para Tabelas (Sudoku, TicTacToe), em vez de bordas CSS em toda a grade, o design usa um _Container Preto com Margens em Divs em float_. Ex: um wrapper com fundo preto e `.cell` que possuem margin. A cor do container vazará através do Margin simulando bordas 100% indestrutíveis.

## 4. Servidor de Testes
O dispositivo roda com Nginx via Docker / Podman (`docker compose up -d`). Foi definido um header forçado `Cache-Control: no-cache` porque o Kindle adora manter os assets velhos presos. Mesmo assim, se criar um CSS ou script novo, altere sempre o arquivo do index referenciando (`<script src="js/file.js?v=3">`).

---

# 🇬🇧 English: Architecture Limitations & AI Guidelines

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

## 5. Aggressive Caching
The testing device runs Nginx. The Kindle browser is extraordinarily stubborn about keeping old assets locked in cache.
- `sendfile off;` and strict `no-cache` headers are placed in the Nginx config, but that's often circumvented by the Kindle.
- **Cache Buster**: Always manually bump the cache-busting parameter `?v=X` on CSS and JS imports inside HTML templates (`<script src="js/sudoku.js?v=4">`) when making logic or style modifications.
