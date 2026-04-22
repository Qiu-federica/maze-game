let maze = [];
let player = { x: 0, y: 0 };
let exit = { x: 0, y: 0 };
let mazeSize = 15;
let cellSize = 40;
let canvas, ctx;
let solutionPath = [];
let isSolving = false;
let animationInterval = null;
let moveCount = 0;
let gameTime = 0;
let timerInterval = null;
let isGameOver = false;


class AudioManager {
  constructor() {
    this.audio = document.getElementById('bgMusic');
    this.musicToggle = document.getElementById('musicToggle');
    this.volumeSlider = document.getElementById('volumeSlider');
    this.musicIndicator = document.getElementById('musicIndicator');
    this.isPlaying = false;
    this.volume = 0.5;
    this.isMuted = false;

    this.init();
  }

  init() {
    this.audio.volume = this.volume;

    this.volumeSlider.addEventListener('input', (e) => {
      this.volume = parseFloat(e.target.value);
      this.audio.volume = this.volume;
      this.updateUI();
    });

    this.musicToggle.addEventListener('click', () => {
      this.toggleMusic();
    });

    this.attemptAutoPlay();
  }





  attemptAutoPlay() {
    setTimeout(() => {
      this.play().catch(error => {
        console.log("被阻止，等待用户交互：", error);
        this.showPlayHint();
      });
    }, 1000);
  }

  showPlayHint() {
    this.musicIndicator.innerHTML = '<span class="icon">🔇</span><span>点击任意位置播放音乐</span>';
    this.musicIndicator.style.color = "#ff6b6b";

    const startOnClick = () => {
      this.play().catch(console.error);
      this.musicIndicator.innerHTML = '<span class="icon">🎵</span><span>背景音乐播放中...</span>';
      this.musicIndicator.style.color = "rgba(255,255,255,0.7)";
      document.removeEventListener('click', startOnClick);

    };

    document.addEventListener('click', startOnClick);


  }

  play() {
    return this.audio.play().then(() => {
      this.isPlaying = true;
      this.updateUI();
      return true;
    });
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.updateUI();
  }


  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.updateUI();
  }

  toggleMusic() {
    if (this.isPlaying) {
      this.pause();

    } else {
      this.play().catch(console.error);
    }
  }


  updateUI() {
    this.musicToggle.textContent = this.isPlaying ? '🔊' : '🔇';
    this.musicToggle.title = this.isPlaying ? '暂停音乐' : '播放音乐';

    this.volumeSlider.value = this.volume;

    if (this.isPlaying) {
      this.musicIndicator.innerHTML = '<span class="icon">🎵</span><span>背景音乐播放中...</span>';
      this.musicIndicator.style.color = "rgba(255, 255, 255, 0.7)";
    } else {
      this.musicIndicator.innerHTML = '<span class="icon">🔇</span><span>音乐已暂停</span>';
      this.musicIndicator.style.color = "#888";
    }

  }

}

const audioManager = new AudioManager();


function startGame() {
  const loading = document.getElementById('loadingOverlay');
  const mainMenu = document.getElementById('mainMenu');
  const gameScreen = document.getElementById('gameScreen');

  loading.classList.add('show');
  setTimeout(() => {
    loading.classList.remove('show');
    mainMenu.classList.remove('active');
    mainMenu.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    gameScreen.classList.add('active');
    initGame();
  }, 300);
}


function returnToMenu() {

  const mainMenu = document.getElementById('mainMenu');
  const gameScreen = document.getElementById('gameScreen');

  audioManager.play().catch(console.error);

  gameScreen.classList.remove('active');
  gameScreen.classList.add('hidden');
  mainMenu.classList.remove('hidden');
  mainMenu.classList.add('active');
  resetGame();

}






function initGame() {
  canvas = document.getElementById('mazeCanvas');
  ctx = canvas.getContext('2d');

  const gameOverScreen = document.getElementById('gameOverScreen');
  if (gameOverScreen) {
    gameOverScreen.style.display = "none";
    console.log("成功找到游戏结束界面元素");
  } else {
    console.error("未找到游戏结束界面元素");
  }

  generateMaze();

  adjustCanvasSize();
  window.addEventListener('resize', adjustCanvasSize);

  document.addEventListener('keydown', handleKeyPress);




  document.getElementById('slove').addEventListener('click', solveMazeWithAnimation);
  document.getElementById('backToMenu').addEventListener('click', returnToMenu);

  const restartButtons = document.querySelectorAll('button[onclick*="restart"]');
  restartButtons.forEach(button => {
    button.onclick = function () {
      console.log("点击了重新开始按钮");
      restartGame();
    };
  });


}


function adjustCanvasSize() {
  const container = document.querySelector('.canvas-container');
  const maxWidth = Math.min(600, window.innerWidth - 40);

  cellSize = Math.floor(maxWidth / mazeSize);

  canvas.width = cellSize * mazeSize;
  canvas.height = cellSize * mazeSize;

  drawMaze();


}


function generateMaze() {
  resetGame();

  if (mazeSize % 2 === 0) mazeSize++;

  maze = [];
  for (let y = 0; y < mazeSize; y++) {
    maze[y] = [];
    for (let x = 0; x < mazeSize; x++) {
      maze[y][x] = 1;
    }
  }

  generateMazeDFS();

  player.x = 1;
  player.y = 1;
  exit.x = mazeSize - 2;
  exit.y = mazeSize - 2;

  maze[player.y][player.x] = 0;
  maze[exit.y][exit.x] = 0;


  startTimer();

  drawMaze();

}


function resetGame() {
  solutionPath = [];
  isSolving = false;
  moveCount = 0;
  gameTime = 0;
  isGameOver = false;

  document.getElementById('moveCount').textContent = moveCount;
  document.getElementById('timer').textContent = "00:00";

  document.getElementById('gameOverScreen').style.display = "none";

  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}


function startTimer() {
  gameTime = 0;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    gameTime++;
    updateTimerDisplay();
  }, 1000);
}



function updateTimerDisplay() {
  const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
  const seconds = (gameTime % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `${minutes}:${seconds}`;

}


function restartGame() {
  generateMaze();

  document.getElementById('gameOverScreen').style.display = "none";

  solutionPath = [];
  isSolving = false;
  moveCount = 0;
  gameTime = 0;
  isGameOver = false;

  document.getElementById('moveCount').textContent = moveCount;
  document.getElementById('timer').textContent = "00:00";
}


function generateMazeDFS() {

  let stack = [];

  let startX = 1;
  let startY = 1;

  maze[startY][startX] = 0;
  stack.push({ x: startX, y: startY });


  const directions = [
    { dx: 0, dy: -2 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: 2 },
    { dx: -2, dy: 0 },
  ];

  while (stack.length > 0) {
    let current = stack[stack.length - 1];

    let neighbors = [];

    for (let dir of directions) {
      let newX = current.x + dir.dx;
      let newY = current.y + dir.dy;

      if (newX > 0 && newX < mazeSize - 1 && newY > 0 && newY < mazeSize - 1) {
        if (maze[newY][newX] === 1) {
          neighbors.push({ x: newX, y: newY, dir: dir });
        }
      }



    }

    if (neighbors.length > 0) {
      let next = neighbors[Math.floor(Math.random() * neighbors.length)];

      maze[current.y + next.dir.dy / 2][current.x + next.dir.dx / 2] = 0;

      maze[next.y][next.x] = 0;

      stack.push({ x: next.x, y: next.y });
    }
    else {
      stack.pop();
    }


  }



}


function drawMaze() {
  if (!ctx) return;

  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < mazeSize; y++) {
    for (let x = 0; x < mazeSize; x++) {
      if (maze[y][x] === 1) {
        ctx.fillStyle = "#000";
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  drawStartEndPlayer();



}


function drawSolutionPathTo(index) {
  if (solutionPath.length === 0 || index < 0) return;

  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = Math.max(3, cellSize / 4);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();

  ctx.moveTo(
    player.x * cellSize + cellSize / 2,
    player.y * cellSize + cellSize / 2
  );

  for (let i = 0; i <= index && i < solutionPath.length; i++) {
    const point = solutionPath[i];
    ctx.lineTo(
      point.x * cellSize + cellSize / 2,
      point.y * cellSize + cellSize / 2
    );
  }

  ctx.stroke();

  drawStartEndPlayer();

}


function drawStartEndPlayer() {

  ctx.fillStyle = '#4caf50';
  ctx.fillRect(
    player.x * cellSize,
    player.y * cellSize,
    cellSize,
    cellSize
  );

  ctx.fillStyle = '#f44336';
  ctx.fillRect(
    exit.x * cellSize,
    exit.y * cellSize,
    cellSize,
    cellSize
  );

  ctx.fillStyle = '#2196F3';
  ctx.fillRect(
    player.x * cellSize + 2,
    player.y * cellSize + 2,
    cellSize - 4,
    cellSize - 4
  );



}


function handleKeyPress(e) {
  if (isGameOver) return;

  let dx = 0, dy = 0;

  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      dy = -1;
      break;
    case 'ArrowDown':
    case 's':
    case 'S':
      dy = 1;
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      dx = -1;
      break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      dx = 1;
      break;
    default:
      return;


  }

  e.preventDefault();

  movePlayer(dx, dy);


}



function movePlayer(dx, dy) {
  if (isGameOver) return;

  const newX = player.x + dx;
  const newY = player.y + dy;

  if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && maze[newY][newX] === 0) {
    player.x = newX;
    player.y = newY;

    moveCount++;
    document.getElementById('moveCount').textContent = moveCount;

    drawMaze();

    if (player.x === exit.x && player.y === exit.y) {
      endGame();
    }
  }


}



function endGame() {
  isGameOver = true;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  solutionPath = findSolutionPath();

  drawMaze();

  if (solutionPath.length > 0) {
    drawSolutionPathTo(solutionPath.length - 1);
  }

  const minutes = Math.floor(gameTime / 60).toString().padStart(2, '0');
  const seconds = (gameTime % 60).toString().padStart(2, '0');

  document.getElementById('finalTime').textContent = `${minutes}:${seconds}`;
  document.getElementById('finalMoves').textContent = moveCount;
  document.getElementById('gameOverScreen').style.display = "flex";

  console.log("game over");

}
function findSolutionPath() {
  const queue = [{ x: player.x, y: player.y, path: [] }];
  const visited = new Set();
  visited.add(`${player.x},${player.y}`);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }
  ];

  while (queue.length > 0) {
    const { x, y, path } = queue.shift();

    if (x === exit.x && y === exit.y) {

      return path;
    }

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;
      const key = `${newX},${newY}`;


      if (newX >= 0 && newX < mazeSize &&
        newY >= 0 && newY < mazeSize &&
        maze[newY][newX] === 0 &&
        !visited.has(key)) {
        visited.add(key);
        queue.push({
          x: newX,
          y: newY,
          path: [...path, { x: newX, y: newY }]
        });
      }

    }


  }
  return [];


}


function solveMazeWithAnimation() {
  if (isSolving || isGameOver) return;

  isSolving = true;

  solutionPath = findSolutionPath();

  if (solutionPath.length === 0) {
    alert("can't find path");
    isSolving = false;
    return;
  }

  let currentIndex = 0;

  if (animationInterval) {
    clearInterval(animationInterval);
  }

  animationInterval = setInterval(() => {
    drawMaze();

    drawSolutionPathTo(currentIndex);

    currentIndex++;

    if (currentIndex >= solutionPath.length) {
      clearInterval(animationInterval);
      animationInterval = null;
      isSolving = false;
    }
  }, 50);


}



window.onload = initGame;