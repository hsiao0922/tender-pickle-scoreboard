# Tender Pickle Scoreboard · 嫩肌匹克計分板

Ad-free pickleball scoreboard with **serve lights**, so you never forget whether it is the 1st or 2nd server.
無廣告的匹克球計分板，用燈號顯示第 1 發 / 第 2 發。

By **Tender Pickle (嫩肌匹克)** · MIT License

## Features · 功能

- Serve lights: two lamps per team, the lit one is the current server (1st / 2nd) · 發球燈號
- Serve side hint (right / left court) from the serving team's score · 右區 / 左區發球提示
- Score call in doubles format, e.g. `4-2-1` · 自動報分
- Only the serving team can score; the receiving team's button is locked · 接發方按鈕鎖定
- Doubles (with the `0-0-2` start rule) and singles · 雙打、單打
- Play to 11 / 15 / 21, win-by-2 optional · 目標分數、是否領先 2 分
- Voice score call (speaker button, off by default): speaks numbers only, e.g. "4, 2, 1" (server score, receiver score, server number), after every rally, says "Side out", announces the winner; optional serving team name, voice picker with test button (prefers Taiwan Mandarin `zh-TW`), speed and volume · 語音報分（喇叭按鈕，預設關閉）
- Team names: leave empty to use "Left Team" / "Right Team" · 隊名可留空，預設「左邊隊伍 / 右邊隊伍」
- Undo, swap sides, hold-to-reset new game (no accidental resets) · 復原、換邊、長按新局
- Works on phone, tablet and desktop, portrait and landscape · 手機、平板、電腦皆可
- Connection dot next to the score call: green = online, red = offline (the scoreboard keeps working offline) · 連線燈號：綠色連線、紅色離線
- Installable (PWA) and works offline; screen stays awake while in use · 可安裝、可離線、螢幕恆亮
- No account, no tracking, no ads; the game is stored only in your browser (`localStorage`) · 無廣告、無追蹤

## Rules implemented · 採用的規則

Traditional side-out scoring:

1. Only the serving team scores a point. 只有發球方得分。
2. Doubles score call: `serving score – receiving score – server number (1 or 2)`. 雙打報分三個數字。
3. The first serving team of a game starts at `0-0-2`: only one server, so its first fault is a side out. 開局 `0-0-2`，第一次失誤直接換發。
4. Server 1 faults → server 2 serves. Server 2 faults → side out, the other team starts with server 1. 第 1 發失誤換夥伴，第 2 發失誤換對方。
5. Serve from the right court when the serving team's score is even, left court when odd. 發球隊分數偶數右區、奇數左區。
6. Singles: two-number call, no server number, same side rule. 單打只報兩個數字。
7. Win at the target score with a 2-point lead (win-by-2 can be turned off). 達目標分數並領先 2 分獲勝。

Rally scoring is not implemented yet. 尚未支援 Rally 計分。

## Controls · 操作

| Action | Touch / mouse | Keyboard |
|---|---|---|
| Serving team scores | `+1` button on the serving panel | `←` left panel, `→` right panel |
| Serving team faults | `發球方失誤 / Server Fault` | `Space` |
| Undo | `復原 / Undo` | `Z` |
| Swap sides | `換邊 / Swap Sides` | `F` |
| New game | hold `長按新局` 0.7 s | click, then confirm |

## Use it · 使用

Open `index.html` in a browser, or host the folder on any static host.

- **iPhone / iPad**: Safari → Share → *Add to Home Screen* (iOS 16.4+ recommended for keep-awake).
- **Android**: Chrome → menu → *Install app*.
- **Desktop**: Chrome / Edge → install icon in the address bar.

### Host on GitHub Pages · 放上 GitHub Pages

1. Push this folder to a GitHub repository (e.g. `tender-pickle-scoreboard`).
2. Repository **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, branch `main`, folder `/ (root)`.
3. Open `https://<your-account>.github.io/tender-pickle-scoreboard/`.

All paths are relative, so it works under a sub-path.

## Develop · 開發

No build step and no dependencies.

```
index.html   page
style.css    layout and theme
app.js       UI and state (localStorage)
engine.js    pure rules engine (no DOM)
tests/       open tests/index.html in a browser to run the rule tests
sw.js        offline cache — bump CACHE in sw.js when you change files
```

Run a local server (needed for the service worker):

```
python -m http.server 8765
```

Run the rule tests: open `tests/index.html` (it should say `ALL PASSED`), or headless:

```
chrome --headless --virtual-time-budget=2000 --dump-dom tests/index.html
```

## License

[MIT](LICENSE) © 2026 Tender Pickle (嫩肌匹克)
