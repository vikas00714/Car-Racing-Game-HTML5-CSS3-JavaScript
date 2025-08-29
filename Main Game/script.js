
(() => {
  
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const muteBtn = document.getElementById("muteBtn");
  const difficultySel = document.getElementById("difficulty");
  const shieldBtn = document.getElementById("shieldBtn");
  const slowBtn = document.getElementById("slowBtn");
  const shieldCntEl = document.getElementById("shieldCnt");
  const slowCntEl = document.getElementById("slowCnt");
  const scoreEl = document.getElementById("score");
  const road = document.getElementById("road");
  const gameArea = document.getElementById("gameArea");
  const boardList = document.getElementById("boardList");
  const clearLb = document.getElementById("clearLb");
  const leftBtn = document.getElementById("leftBtn");
  const rightBtn = document.getElementById("rightBtn");

  
  let hasPlayerSprite = false,
    hasEnemySprite = false;
  new Image().src = "car2.png";
  new Image().onload = () => (hasPlayerSprite = true);
  new Image().src = "car4.png";
  new Image().onload = () => (hasEnemySprite = true);

  const S = {
    enabled: true,
    beep: new Audio(),
    crash: new Audio(),
    bg: new Audio(),
  };
  
  S.beep.src =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAABaAAAAPwAA";
  S.crash.src = S.beep.src;
  S.bg.src = S.beep.src;
  S.bg.loop = true;

  function play(audio) {
    if (!S.enabled) return;
    try {
      audio.currentTime = 0;
      audio.play();
    } catch (e) {}
  }

  
  const state = {
    started: false,
    paused: false,
    muted: false,
    score: 0,
    speed: 5,
    difficulty: "medium",
    lines: [],
    enemies: [],
    playerEl: null,
    shieldCount: 1,
    slowCount: 1,
    shieldActiveUntil: 0,
    slowActiveUntil: 0,
    leaderboardKey: "car_game_lb_v1",
    passedSet: new Set(),
    lastTime: 0,
  };

  
  const PRES = {
    easy: { speed: 4.5, enemies: 3, inc: 0.35 },
    medium: { speed: 5.5, enemies: 4, inc: 0.5 },
    hard: { speed: 7.0, enemies: 5, inc: 0.75 },
  };

 
  function getLB() {
    try {
      return JSON.parse(localStorage.getItem(state.leaderboardKey)) || [];
    } catch {
      return [];
    }
  }
  function saveLB(score) {
    let list = getLB();
    list.push({ score, at: Date.now() });
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 5);
    localStorage.setItem(state.leaderboardKey, JSON.stringify(list));
    renderLB();
  }
  function renderLB() {
    const list = getLB();
    boardList.innerHTML = "";
    if (list.length === 0) {
      boardList.innerHTML = "<li>No scores</li>";
      return;
    }
    list.forEach((e, i) => {
      const li = document.createElement("li");
      li.textContent = `${i + 1}. ${e.score}`;
      boardList.appendChild(li);
    });
  }
  clearLb.addEventListener("click", () => {
    localStorage.removeItem(state.leaderboardKey);
    renderLB();
  });

  
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function rect(el) {
    return el.getBoundingClientRect();
  }
  function isCollide(a, b) {
    const A = rect(a),
      B = rect(b);
    return !(
      A.bottom < B.top ||
      A.top > B.bottom ||
      A.right < B.left ||
      A.left > B.right
    );
  }

  
  function buildRoad() {
    road.innerHTML = "";
    state.lines = [];
    state.enemies = [];
    state.passedSet.clear();
    
    for (let i = 0; i < 6; i++) {
      const l = document.createElement("div");
      l.className = "lines";
      l.style.top = i * 150 + "px";
      l.dataset.y = i * 150;
      road.appendChild(l);
      state.lines.push(l);
    }
    
    const p = document.createElement("div");
    p.className = "myCar";
    if (hasPlayerSprite) p.classList.add("skin-my");
    road.appendChild(p);
    state.playerEl = p;
    
    state.playerX = (road.clientWidth - 50) / 2;
    state.playerY = road.clientHeight - 150;
    p.style.left = state.playerX + "px";
    p.style.top = state.playerY + "px";

   
    const count = PRES[state.difficulty].enemies;
    for (let i = 0; i < count; i++) {
      const e = document.createElement("div");
      e.className = "enemyCar";
      if (hasEnemySprite) e.classList.add("skin-enemy");
      const leftPos = Math.floor(Math.random() * (road.clientWidth - 50));
      const y = -(i + 1) * 300;
      e.style.left = leftPos + "px";
      e.style.top = y + "px";
      e.dataset.y = y;
      road.appendChild(e);
      state.enemies.push(e);
    }
  }

  
  const keys = { left: false, right: false };
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      keys.left = true;
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      keys.right = true;
      e.preventDefault();
    }
    if (e.key === "p" || e.key === "P") {
      togglePause();
    }
    if (e.key === "m" || e.key === "M") {
      toggleMute();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") {
      keys.left = false;
    }
    if (e.key === "ArrowRight") {
      keys.right = false;
    }
  });
 
  leftBtn &&
    leftBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys.left = true;
    });
  leftBtn &&
    leftBtn.addEventListener("touchend", (e) => {
      keys.left = false;
    });
  rightBtn &&
    rightBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys.right = true;
    });
  rightBtn &&
    rightBtn.addEventListener("touchend", (e) => {
      keys.right = false;
    });

  
  shieldBtn.addEventListener("click", () => {
    if (!state.started) return alert("Start the game first");
    if (state.shieldCount <= 0) return alert("No shields left");
    
    state.shieldCount--;
    shieldCntEl.textContent = state.shieldCount;
    state.shieldActiveUntil = performance.now() + 4000;
    state.playerEl.classList.add("shielded"); 
    play(S.beep);
  });
  slowBtn.addEventListener("click", () => {
    if (!state.started) return alert("Start the game first");
    if (state.slowCount <= 0) return alert("No slows left");
    state.slowCount--;
    slowCntEl.textContent = state.slowCount;
    state.slowActiveUntil = performance.now() + 3500;
    play(S.beep);
  });

 
  startBtn.addEventListener("click", startGame);
  restartBtn.addEventListener("click", () => {
    stopGame();
    startGame();
  });
  pauseBtn.addEventListener("click", togglePause);

  function togglePause() {
    if (!state.started) return;
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? "▶ Resume" : "⏯ Pause";
    if (!state.paused)
      (state.lastTime = performance.now()), requestAnimationFrame(loop);
  }
  function toggleMute() {
    S.enabled = !S.enabled;
    muteBtn.textContent = S.enabled ? "🔊 Sound" : "🔇 Muted";
    if (!S.enabled) S.bg.pause();
  }

  muteBtn.addEventListener("click", toggleMute);

  
  function startGame() {
    state.difficulty = difficultySel.value;
    state.speed = PRES[state.difficulty].speed;
    state.inc = PRES[state.difficulty].inc;
    state.score = 0;
    state.started = true;
    state.paused = false;
    state.passedSet.clear();
    state.shieldCount = parseInt(shieldCntEl.textContent) || state.shieldCount;
    state.slowCount = parseInt(slowCntEl.textContent) || state.slowCount;
    shieldCntEl.textContent = state.shieldCount;
    slowCntEl.textContent = state.slowCount;
    buildRoad();
    state.lastTime = performance.now();
    play(S.bg);
    requestAnimationFrame(loop);
  }
  function stopGame() {
    state.started = false;
    state.enemies.forEach((e) => e.remove());
    state.playerEl && state.playerEl.remove();
  }

  
  function laneChange(dir) {
    const step = 50; 
    state.playerX += dir === "left" ? -step : step;
    state.playerX = clamp(state.playerX, 0, road.clientWidth - 50);
    state.playerEl.style.left = state.playerX + "px";
  }

  
  function loop(ts) {
    if (!state.started || state.paused) return;
    const dt = Math.min(40, ts - state.lastTime);
    state.lastTime = ts;

 
    state.lines.forEach((l) => {
      let y = (+l.dataset.y || 0) + state.speed;
      if (y > road.clientHeight + 100) y -= road.clientHeight + 240;
      l.dataset.y = y;
      l.style.top = y + "px";
    });

    // player movement via keys (smooth lane-change)
    if (keys.left) laneChange("left");
    if (keys.right) laneChange("right");

    // move enemies
    const slowFactor = state.slowActiveUntil > performance.now() ? 0.45 : 1;
    state.enemies.forEach((e, idx) => {
      let y = (+e.dataset.y || 0) + state.speed * slowFactor;
      // collision
      if (state.playerEl && isCollide(state.playerEl, e)) {
        // if shield active, destroy this enemy and continue
        if (state.shieldActiveUntil > performance.now()) {
          // knock enemy away
          play(S.beep);
          e.dataset.y = -400;
          e.style.top = e.dataset.y + "px";
        } else {
          endGame();
          return;
        }
      }
      
      const playerRect = state.playerEl.getBoundingClientRect();
      const enemyRect = e.getBoundingClientRect();
      const key = e._id || (e._id = Math.random().toString(36).slice(2, 9));
      if (enemyRect.top > playerRect.bottom && !state.passedSet.has(key)) {
        state.passedSet.add(key);
        state.score += 10;
        play(S.beep);
      }

      if (y > road.clientHeight + 120) {
        y = -200 - Math.random() * 200;
        e.style.left =
          Math.floor(Math.random() * (road.clientWidth - 40)) + "px";
        e.dataset.y = y;
      
        state.passedSet.delete(key);
      }
      e.dataset.y = y;
      e.style.top = y + "px";
    });

    // increase speed gradually
    state.speed += state.inc * (dt / 1000);

    // update UI
    scoreEl.textContent = `Score: ${Math.floor(
      state.score
    )} | Speed: ${state.speed.toFixed(1)}`;

    // clear expired powerups visuals
    if (state.shieldActiveUntil < performance.now()) {
      state.playerEl && state.playerEl.classList.remove("shielded");
    }
    if (state.slowActiveUntil < performance.now()) {
      // nothing visual to remove; slowFactor computed each frame
    }

    requestAnimationFrame(loop);
  }

  function endGame() {
    state.started = false;
    play(S.crash);
    S.bg.pause();
    // overlay
    const overlay = document.createElement("div");
    overlay.className = "crashOverlay";
    overlay.innerHTML = `<div>
      <h2 style="margin-bottom:8px">Game Over</h2>
      <p style="margin-bottom:12px">Score: ${Math.floor(state.score)}</p>
      <div style="display:flex;gap:8px;justify-content:center">
        <button id="again" class="btn">Play Again</button>
      </div>
    </div>`;
    road.appendChild(overlay);
    saveLB(Math.floor(state.score));
    document.getElementById("again").addEventListener("click", () => {
      overlay.remove();
      restartBtn.click();
    });
  }

  // set initial UI
  renderLB();
  shieldCntEl.textContent = state.shieldCount;
  slowCntEl.textContent = state.slowCount;

  // window resize -> reinit road if not running
  window.addEventListener("resize", () => {
    if (!state.started) buildRoad();
  });
})();
