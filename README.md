# Car Game — Enhanced (HTML/CSS/JS)

Features
- Lane-change animation (smooth left/right movement)
- Power-ups: Shield (temporary invulnerability) and Slow Time (slows enemies)
- Sprite image support (player: car2.png, enemy: car4.png, optional bg.png)
- Mobile touch controls, Pause/Resume, Mute
- Local leaderboard (top 5, via localStorage)
- Responsive layout; easy to host on GitHub Pages / Netlify

How to run
1. Put files in one folder: index.html, style.css, script.js
2. Add optional assets next to them:
   - bg.png (background), car2.png (player sprite), car4.png (enemy sprite)
3. Open index.html in a modern browser.
4. To host: push the folder to a GitHub repo and enable GitHub Pages (or deploy to Netlify).

Notes
- Shield and Slow counts are stored in UI only per session; you can reset counts in code.
- Sounds use tiny embedded placeholders; replace with real .mp3/.wav files for full audio.
