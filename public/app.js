// === CONFIGURAÇÕES GERAIS ===
let chatHistory = [];
const triondao = document.getElementById('triondao');
const speechBubble = document.getElementById('speech-bubble');

// === NAVEGAÇÃO DE ABAS ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content-area').forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    const target = tab.dataset.tab;
    document.getElementById(target).classList.add('active');

    if (target === 'chat') {
      setBubble("Voltou pro vestiário pra bater um papo? Manda a pergunta!");
    } else if (target === 'penalty') {
      setBubble("Bate na bola e mostra que é artilheiro!");
    } else if (target === 'goalkeeper') {
      setBubble("Hora de calçar as luvas! Defenda todos os chutes no Paredão!");
    } else if (target === 'quiz') {
      setBubble("Concentração total! Quero ver se você sabe tudo de Copa!");
    } else if (target === 'tabela') {
      setBubble("A tabela completa da Copa 2026! Quem será que o Brasil pega?");
      renderTabela();
    } else if (target === 'bolao') {
      setBubble("Hora de mostrar que você entende! Coloque seus palpites no Bolão!");
      renderBolao();
    }
  });
});

// === ESTADOS DO TRIONDÃO ===
function setTriondaoState(state) {
  triondao.className = 'bouncing'; // Reset
  if (state === 'thinking') triondao.classList.add('thinking');
  if (state === 'talking') triondao.classList.add('talking');
  if (state === 'celebrating') triondao.classList.add('celebrating');
  if (state === 'sad') triondao.classList.add('sad');
}

function setBubble(text) {
  speechBubble.textContent = text;
  speechBubble.classList.remove('hidden');
}

function pokeTriondao() {
  setTriondaoState('celebrating');
  setBubble("Aí sim, goleirão! Tamo junto!");
  setTimeout(() => setTriondaoState('idle'), 1500);
}

// === LÓGICA DO CHAT ===
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  addMessage('user', text);
  input.value = '';

  setTriondaoState('thinking');
  setBubble("Hmm... Deixa eu puxar na memória do VAR...");

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatHistory.concat([{ role: 'user', content: text }])
      })
    });

    const data = await response.json();
    setTriondaoState('idle');

    if (data.reply) {
      addMessage('bot', data.reply);
      chatHistory.push({ role: 'user', content: text });
      chatHistory.push({ role: 'bot', content: data.reply });
      if (chatHistory.length > 10) chatHistory.shift();

      setTriondaoState('talking');
      setBubble(data.reply.substring(0, 60) + "...");
      setTimeout(() => setTriondaoState('idle'), 3000);
    } else {
      addMessage('bot', 'Ih, deu zebra! 🦓 Tenta de novo, craque!');
      setTriondaoState('sad');
    }
  } catch (error) {
    console.error('Erro:', error);
    addMessage('bot', 'Putz, o juiz apitou impedimento na minha conexão! Tenta de novo.');
    setTriondaoState('sad');
  }
}

function addMessage(role, content) {
  const window = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `
    <div class="sender">${role === 'bot' ? 'Triondão' : 'Você'}</div>
    <div class="bubble">${content}</div>
  `;
  window.appendChild(div);
  window.scrollTop = window.scrollHeight;
}

// === LÓGICA DO QUIZ (Randomizado de 100 perguntas) ===
let quizState = {
  questions: [],
  current: 0,
  score: 0,
  answered: false
};

function startQuiz() {
  if (typeof all100Questions === 'undefined') {
    alert("Erro: Banco de perguntas não carregado!");
    return;
  }

  // Sorteia 5 perguntas aleatórias do banco de 100
  quizState.questions = [...all100Questions]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5);

  quizState.current = 0;
  quizState.score = 0;

  document.getElementById('btn-start-quiz').style.display = 'none';
  document.getElementById('quiz-result').classList.add('hidden');
  loadQuestion();
}

function loadQuestion() {
  quizState.answered = false;
  const q = quizState.questions[quizState.current];

  document.getElementById('q-number').textContent = quizState.current + 1;
  document.getElementById('score').textContent = quizState.score;
  document.getElementById('quiz-question').textContent = q.q;

  const optionsBox = document.getElementById('quiz-options');
  optionsBox.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(idx);
    optionsBox.appendChild(btn);
  });
}

function checkAnswer(idx) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  const options = document.querySelectorAll('.quiz-option');

  if (idx === q.answer) {
    options[idx].classList.add('correct');
    quizState.score++;
    setTriondaoState('celebrating');
    createConfetti();
  } else {
    options[idx].classList.add('wrong');
    options[q.answer].classList.add('correct');
    setTriondaoState('sad');
  }

  setTimeout(() => {
    quizState.current++;
    if (quizState.current < quizState.questions.length) {
      loadQuestion();
    } else {
      showQuizResult();
    }
  }, 2000);
}

function showQuizResult() {
  const result = document.getElementById('quiz-result');
  result.classList.remove('hidden');
  result.innerHTML = `
    <h3>Fim de Jogo!</h3>
    <p>Você acertou ${quizState.score} de ${quizState.questions.length} perguntas.</p>
    <button class="btn-large" onclick="startQuiz()">Tentar de Novo</button>
  `;
  document.getElementById('btn-start-quiz').style.display = 'none';

  // Salva no ranking local
  const totalGames = parseInt(localStorage.getItem('triondao_games') || '0') + 1;
  const totalScore = parseInt(localStorage.getItem('triondao_score') || '0') + quizState.score;
  localStorage.setItem('triondao_games', totalGames);
  localStorage.setItem('triondao_score', totalScore);
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  document.getElementById('total-games').textContent = localStorage.getItem('triondao_games') || '0';
  document.getElementById('total-score').textContent = localStorage.getItem('triondao_score') || '0';
}

// === LÓGICA DO JOGO DE PÊNALTI (CHUTADOR) ===
const canvas = document.getElementById('penalty-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let gameReq;
let ball = { x: 250, y: 320, radius: 25, tgtX: 250, tgtY: 100, speed: 0.03, progress: 0, active: false };
let gloves = { x: 250, y: 100, radius: 30, targetX: 250, speed: 2 };
let gameScore = 0;
let shotsTaken = 0;
const maxShots = 5;
let gameIsRunning = false;

// Imagem da bola (SVG embutido)
const imgBall = new Image();
imgBall.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="white" stroke="black" stroke-width="2"/><polygon points="50,15 75,35 65,65 35,65 25,35" fill="black"/></svg>';

function startGame() {
  document.getElementById('game-overlay').style.display = 'none';
  gameScore = 0;
  shotsTaken = 0;
  gameIsRunning = true;
  document.getElementById('game-score').innerText = gameScore;
  document.getElementById('game-chances').innerText = shotsTaken;
  setBubble("Escolha o canto e mande pro fundo da rede!");
  
  // Dificuldade
  const diff = document.getElementById('penalty-difficulty').value;
  if (diff === 'facil') { gloves.speed = 1.0; gloves.radius = 25; }
  else if (diff === 'medio') { gloves.speed = 2.5; gloves.radius = 35; }
  else if (diff === 'pro') { gloves.speed = 4.5; gloves.radius = 45; }
  
  // Reseta posição da bola
  ball.x = 250; ball.y = 320; ball.active = false;
  
  if(gameReq) cancelAnimationFrame(gameReq);
  loop();
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenha o gol
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, 460, 160); // Trave superior e laterais
  // Rede (linhas simples)
  ctx.beginPath();
  for(let i=20; i<=480; i+=20) { ctx.moveTo(i, 20); ctx.lineTo(i, 180); }
  for(let i=20; i<=180; i+=20) { ctx.moveTo(20, i); ctx.lineTo(480, i); }
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Movimento automático do goleiro (luvas) se a bola não foi chutada ou está no começo do voo
  if (gameIsRunning && (!ball.active || ball.progress < 0.5)) {
    if (Math.abs(gloves.targetX - gloves.x) < 5) {
      // Sorteia novo alvo para o goleiro pular
      gloves.targetX = Math.random() * 400 + 50; 
    }
    // Goleiro se move
    if (gloves.x < gloves.targetX) gloves.x += gloves.speed + (Math.random()*2);
    if (gloves.x > gloves.targetX) gloves.x -= gloves.speed + (Math.random()*2);
  } else if (ball.active && ball.progress >= 0.5) {
      // No final do chute, goleiro tenta pular desesperadamente na direção da bola
      if (gloves.x < ball.tgtX) gloves.x += gloves.speed * 2;
      if (gloves.x > ball.tgtX) gloves.x -= gloves.speed * 2;
  }

  // Desenha luvas (goleiro)
  ctx.beginPath();
  ctx.arc(gloves.x, gloves.y, gloves.radius, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Desenha a bola
  if (ball.active) {
    ball.progress += ball.speed;
    const ease = ball.progress; // Linear simple
    const currentX = ball.startX + (ball.tgtX - ball.startX) * ease;
    const currentY = ball.startY + (ball.tgtY - ball.startY) * ease;
    const currentR = ball.startR - (ball.startR - 15) * ease; // Bola diminui (perspectiva)

    ctx.drawImage(imgBall, currentX - currentR, currentY - currentR, currentR * 2, currentR * 2);

    if (ball.progress >= 1) {
      ball.active = false;
      checkGoal();
    }
  } else {
    // Bola parada na marca do pênalti
    ctx.drawImage(imgBall, ball.x - 20, ball.y - 20, 40, 40);
  }

  gameReq = requestAnimationFrame(loop);
}

// Quando clicar no canvas, chuta a bola
if(canvas) {
  canvas.addEventListener('mousedown', (e) => {
    if (!gameIsRunning || ball.active) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Só permite chutar da metade da tela pra cima (no gol)
    if (clickY > 200) return;

    shootBallTo(clickX, clickY);
  });
  
  canvas.addEventListener('touchstart', (e) => {
    if (!gameIsRunning || ball.active) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = (touch.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (touch.clientY - rect.top) * (canvas.height / rect.height);
    
    if (clickY > 200) return;
    shootBallTo(clickX, clickY);
  }, { passive: false });
}

function shootBallTo(targetX, targetY) {
  shotsTaken++;
  document.getElementById('game-chances').innerText = shotsTaken;
  
  ball.tgtX = targetX;
  ball.tgtY = targetY;
  ball.startX = 250;
  ball.startY = 320;
  ball.startR = 20;
  ball.progress = 0;
  ball.speed = 0.03; // Velocidade do chute
  ball.active = true;
}

function checkGoal() {
  // Calcula distância final entre bola e luva do goleiro
  const dist = Math.sqrt((ball.tgtX - gloves.x) ** 2 + (ball.tgtY - gloves.y) ** 2);
  
  // Se a bola for pra fora (fora do retângulo do gol)
  if (ball.tgtX < 20 || ball.tgtX > 480 || ball.tgtY < 20 || ball.tgtY > 180) {
      setTriondaoState('sad');
      setBubble("Iiiisolou!!! Bateu na lua!");
  } 
  // Se bater na luva (raio da luva + raio da bola)
  else if (dist < gloves.radius + 15) {
      setTriondaoState('sad');
      setBubble("DEFENDEU o goleiro! Que muralha!");
  } 
  // Gol
  else {
      gameScore++;
      document.getElementById('game-score').innerText = gameScore;
      setTriondaoState('celebrating');
      setBubble("GOOOOOOOOOOOL! Pega essa coruja!");
      createConfetti();
  }

  setTimeout(() => {
    if (shotsTaken >= maxShots) {
      endGame();
    } else {
      setTriondaoState('idle');
      setBubble("Ajeita a bola... bate mais uma!");
      // Reseta bola visualmente
      ball.x = 250; ball.y = 320;
    }
  }, 2000);
}

function endGame() {
  gameIsRunning = false;
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('game-msg').innerText = `Fim de Jogo! Gols: ${gameScore}/${maxShots}`;
  setBubble(`Você fez ${gameScore} gols de ${maxShots} chances!`);
}

// === LÓGICA DO JOGO DE DEFESA (GOLEIRO) ===
const canvasGk = document.getElementById('goalkeeper-canvas');
const ctxGk = canvasGk ? canvasGk.getContext('2d') : null;
let gkReq;
let ballGk = { x: 250, y: 350, radius: 25, tgtX: 250, tgtY: 100, speed: 0.05, progress: 0, active: false };
let glovesGk = { x: 250, y: 175, radius: 35 };
let scoreGk = 0;
let shotsGk = 0;
const maxShotsGk = 5;
let gkBaseSpeed = 0.02;

function startGoalkeeperGame() {
  document.getElementById('gk-game-overlay').style.display = 'none';
  scoreGk = 0;
  shotsGk = 0;
  document.getElementById('gk-game-score').innerText = scoreGk;
  setBubble("Prepara a ponte! Lá vem bomba!");
  
  // Dificuldade
  const diff = document.getElementById('gk-difficulty').value;
  if (diff === 'facil') { gkBaseSpeed = 0.015; glovesGk.radius = 45; }
  else if (diff === 'medio') { gkBaseSpeed = 0.025; glovesGk.radius = 35; }
  else if (diff === 'pro') { gkBaseSpeed = 0.040; glovesGk.radius = 25; }

  if(gkReq) cancelAnimationFrame(gkReq);
  loopGk();
  setTimeout(shootBallGk, 1000);
}

function shootBallGk() {
  if (shotsGk >= maxShotsGk) {
    endGkGame();
    return;
  }
  shotsGk++;
  ballGk.tgtX = Math.random() * 400 + 50;
  ballGk.tgtY = Math.random() * 150 + 20;
  ballGk.startX = 250;
  ballGk.startY = 350;
  ballGk.startR = 30;
  ballGk.progress = 0;
  ballGk.speed = gkBaseSpeed + (shotsGk * 0.003);
  ballGk.active = true;
}

function loopGk() {
  ctxGk.clearRect(0, 0, canvasGk.width, canvasGk.height);

  ctxGk.strokeStyle = "rgba(255,255,255,0.3)";
  ctxGk.lineWidth = 2;
  ctxGk.strokeRect(20, 10, 460, 180);

  if (ballGk.active) {
    ballGk.progress += ballGk.speed;
    const ease = ballGk.progress;
    const currentX = ballGk.startX + (ballGk.tgtX - ballGk.startX) * ease;
    const currentY = ballGk.startY + (ballGk.tgtY - ballGk.startY) * ease;
    const currentR = ballGk.startR - (ballGk.startR - 15) * ease;

    ctxGk.drawImage(imgBall, currentX - currentR, currentY - currentR, currentR * 2, currentR * 2);

    if (ballGk.progress >= 1) {
      ballGk.active = false;
      goalScoredGk();
    }
  }

  ctxGk.beginPath();
  ctxGk.arc(glovesGk.x, glovesGk.y, glovesGk.radius, 0, Math.PI * 2);
  ctxGk.fillStyle = "orange";
  ctxGk.fill();
  ctxGk.strokeStyle = "white";
  ctxGk.stroke();

  gkReq = requestAnimationFrame(loopGk);
}

if(canvasGk) {
  canvasGk.addEventListener('mousemove', (e) => {
    const rect = canvasGk.getBoundingClientRect();
    glovesGk.x = (e.clientX - rect.left) * (canvasGk.width / rect.width);
    glovesGk.y = (e.clientY - rect.top) * (canvasGk.height / rect.height);
    attemptSaveGk();
  });

  canvasGk.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvasGk.getBoundingClientRect();
    const touch = e.touches[0];
    glovesGk.x = (touch.clientX - rect.left) * (canvasGk.width / rect.width);
    glovesGk.y = (touch.clientY - rect.top) * (canvasGk.height / rect.height);
    attemptSaveGk();
  }, { passive: false });
}

function attemptSaveGk() {
  if (!ballGk.active) return;
  const ease = ballGk.progress;
  const bx = ballGk.startX + (ballGk.tgtX - ballGk.startX) * ease;
  const by = ballGk.startY + (ballGk.tgtY - ballGk.startY) * ease;

  const dist = Math.sqrt((bx - glovesGk.x) ** 2 + (by - glovesGk.y) ** 2);
  if (dist < glovesGk.radius + 15) {
    ballGk.active = false;
    saveMadeGk();
  }
}

function saveMadeGk() {
  scoreGk++;
  document.getElementById('gk-game-score').innerText = scoreGk;
  setTriondaoState('celebrating');
  setBubble("DEFESAÇA!!!");
  createConfetti();
  setTimeout(shootBallGk, 1500);
}

function goalScoredGk() {
  setTriondaoState('sad');
  setBubble("Gool deles... foi no ângulo!");
  setTimeout(shootBallGk, 1500);
}

function endGkGame() {
  cancelAnimationFrame(gkReq);
  document.getElementById('gk-game-overlay').style.display = 'flex';
  document.getElementById('gk-game-msg').innerText = `Fim de Jogo! Defesas: ${scoreGk}`;
  setBubble(`Você defendeu ${scoreGk} chutes de ${maxShotsGk}!`);
}

// === CONFETTI ===
function createConfetti() {
  const container = document.getElementById('confetti-container');
  for (let i = 0; i < 30; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random() * 100 + '%';
    conf.style.backgroundColor = ['#ffd700', '#2ecc71', '#3498db', '#e74c3c'][Math.floor(Math.random() * 4)];
    conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
    container.appendChild(conf);
    setTimeout(() => conf.remove(), 3000);
  }
}

// Inicialização
window.onload = () => {
  updateHistoryDisplay();
  updatePlayerSelect();
  setBubble("E aí, Paredão! Sou o Triondão. O que quer saber da Copa?");
};

// === TABELA E BOLÃO (COPA 2026) ===
let matches2026 = [];
let matchId = 1;

// Seleções Reais (Sorteio)
const groupTeams = {
  'A': ['México', 'África do Sul', 'Coreia do Sul', 'Repescagem 1 (Europa)'],
  'B': ['Canadá', 'Catar', 'Suíça', 'Repescagem 2 (Europa)'],
  'C': ['Brasil', 'Marrocos', 'Haiti', 'Escócia'],
  'D': ['Estados Unidos', 'Paraguai', 'Austrália', 'Repescagem 3 (Europa)'],
  'E': ['Alemanha', 'Curaçao', 'Costa do Marfim', 'Equador'],
  'F': ['Holanda', 'Japão', 'Repescagem 4 (Europa)', 'Tunísia'],
  'G': ['Bélgica', 'Egito', 'Irã', 'Nova Zelândia'],
  'H': ['Espanha', 'Cabo Verde', 'Arábia Saudita', 'Uruguai'],
  'I': ['França', 'Senegal', 'Repescagem (Mundo)', 'Noruega'],
  'J': ['Argentina', 'Argélia', 'Áustria', 'Jordânia'],
  'K': ['Portugal', 'Repescagem (Mundo)', 'Uzbequistão', 'Colômbia'],
  'L': ['Inglaterra', 'Croácia', 'Gana', 'Panamá']
};

// 1. Gerando os 72 jogos da Fase de Grupos
const groups = Object.keys(groupTeams);
groups.forEach(g => {
  const t = groupTeams[g];
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: t[0], away: t[1] });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: t[2], away: t[3] });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: t[0], away: t[2] });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: t[3], away: t[1] });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: t[3], away: t[0] });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: t[1], away: t[2] });
});

// 2. Inserindo as datas conhecidas
function setMatch(h, a, d, t, v) {
  let m = matches2026.find(x => x.home === h && x.away === a);
  if (!m) m = matches2026.find(x => x.home === a && x.away === h);
  if (m) { 
      m.home = h; m.away = a;
      m.date = d; m.time = t; m.venue = v; 
  }
}

// Grupo A
setMatch("México", "África do Sul", "11/06/2026", "16:00", "CDMX (Azteca)");
setMatch("Coreia do Sul", "Repescagem 1 (Europa)", "11/06/2026", "23:00", "Guadalajara");
setMatch("México", "Coreia do Sul", "18/06/2026", "22:00", "Guadalajara");
setMatch("África do Sul", "Repescagem 1 (Europa)", "18/06/2026", "13:00", "Atlanta");
setMatch("Repescagem 1 (Europa)", "México", "24/06/2026", "22:00", "CDMX (Azteca)");
setMatch("Coreia do Sul", "África do Sul", "24/06/2026", "22:00", "Monterrey");

// Grupo B
setMatch("Canadá", "Repescagem 2 (Europa)", "12/06/2026", "16:00", "Toronto");
setMatch("Catar", "Suíça", "13/06/2026", "16:00", "Santa Clara");
setMatch("Canadá", "Catar", "18/06/2026", "19:00", "Vancouver");
setMatch("Repescagem 2 (Europa)", "Suíça", "18/06/2026", "16:00", "Los Angeles");
setMatch("Suíça", "Canadá", "24/06/2026", "16:00", "Vancouver");
setMatch("Catar", "Repescagem 2 (Europa)", "24/06/2026", "16:00", "Seattle");

// Grupo C
setMatch("Brasil", "Marrocos", "13/06/2026", "19:00", "New York");
setMatch("Haiti", "Escócia", "13/06/2026", "22:00", "Boston");
setMatch("Brasil", "Haiti", "19/06/2026", "22:00", "Filadélfia");
setMatch("Marrocos", "Escócia", "19/06/2026", "19:00", "Boston");
setMatch("Escócia", "Brasil", "24/06/2026", "19:00", "Miami");
setMatch("Haiti", "Marrocos", "24/06/2026", "19:00", "Atlanta");

// Grupo D
setMatch("Estados Unidos", "Paraguai", "12/06/2026", "22:00", "Los Angeles");
setMatch("Austrália", "Repescagem 3 (Europa)", "14/06/2026", "01:00", "Vancouver");
setMatch("Estados Unidos", "Austrália", "19/06/2026", "16:00", "Seattle");
setMatch("Paraguai", "Repescagem 3 (Europa)", "19/06/2026", "01:00", "Santa Clara");
setMatch("Repescagem 3 (Europa)", "Estados Unidos", "25/06/2026", "23:00", "Los Angeles");
setMatch("Austrália", "Paraguai", "25/06/2026", "23:00", "Santa Clara");

// Grupo E
setMatch("Alemanha", "Curaçao", "14/06/2026", "14:00", "Houston");
setMatch("Costa do Marfim", "Equador", "14/06/2026", "20:00", "Filadélfia");
setMatch("Alemanha", "Costa do Marfim", "20/06/2026", "17:00", "Toronto");
setMatch("Curaçao", "Equador", "20/06/2026", "21:00", "Kansas City");
setMatch("Equador", "Alemanha", "25/06/2026", "17:00", "New York");
setMatch("Costa do Marfim", "Curaçao", "25/06/2026", "17:00", "Filadélfia");

// Grupo F
setMatch("Holanda", "Japão", "14/06/2026", "17:00", "Dallas");
setMatch("Repescagem 4 (Europa)", "Tunísia", "14/06/2026", "23:00", "Monterrey");
setMatch("Holanda", "Repescagem 4 (Europa)", "20/06/2026", "14:00", "Houston");
setMatch("Japão", "Tunísia", "20/06/2026", "01:00", "Monterrey");
setMatch("Tunísia", "Holanda", "25/06/2026", "20:00", "Kansas City");
setMatch("Repescagem 4 (Europa)", "Japão", "25/06/2026", "20:00", "Dallas");

// 3. Gerando o Mata-Mata (32 jogos)
for(let i=1; i<=16; i++) matches2026.push({ id: matchId++, group: "16 Avos", date: "Mata-Mata", time: "--:--", venue: "A definir", home: `Classificado ${i*2-1}`, away: `Classificado ${i*2}` });
for(let i=1; i<=8; i++) matches2026.push({ id: matchId++, group: "Oitavas", date: "Mata-Mata", time: "--:--", venue: "A definir", home: `Vencedor 16A-${i*2-1}`, away: `Vencedor 16A-${i*2}` });
for(let i=1; i<=4; i++) matches2026.push({ id: matchId++, group: "Quartas", date: "Mata-Mata", time: "--:--", venue: "A definir", home: `Vencedor OIT-${i*2-1}`, away: `Vencedor OIT-${i*2}` });
for(let i=1; i<=2; i++) matches2026.push({ id: matchId++, group: "Semifinal", date: "Mata-Mata", time: "--:--", venue: "A definir", home: `Vencedor QUA-${i*2-1}`, away: `Vencedor QUA-${i*2}` });
matches2026.push({ id: matchId++, group: "3º Lugar", date: "18/07/2026", time: "A definir", venue: "Miami", home: "Perdedor SEMI-1", away: "Perdedor SEMI-2" });
matches2026.push({ id: matchId++, group: "FINAL", date: "19/07/2026", time: "16:00", venue: "New York/New Jersey", home: "Vencedor SEMI-1", away: "Vencedor SEMI-2" });

function renderTabela(filter = '') {
  const container = document.getElementById('tabela-list');
  container.innerHTML = '';
  
  const filtered = matches2026.filter(m => 
    m.home.toLowerCase().includes(filter.toLowerCase()) || 
    m.away.toLowerCase().includes(filter.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#ccc;">Nenhum jogo encontrado.</p>';
    return;
  }

  filtered.forEach(m => {
    container.innerHTML += `
      <div class="match-card">
        <div class="match-header">
          <span>Grupo ${m.group}</span>
          <span>📅 ${m.date} - ${m.time} | 🏟️ ${m.venue}</span>
        </div>
        <div class="match-teams">
          <span>${m.home}</span>
          <span class="match-vs">X</span>
          <span>${m.away}</span>
        </div>
      </div>
    `;
  });
}

function filterTabela(term) {
  if (term !== undefined) {
    document.getElementById('filter-matches').value = term;
  }
  const input = document.getElementById('filter-matches').value;
  renderTabela(input);
}

// === BOLÃO MULTIPLAYER ===
let bolaoData = JSON.parse(localStorage.getItem('triondao_bolao_multi')) || {};
let currentPlayer = "";

function createPlayer() {
  const name = document.getElementById('new-player-name').value.trim();
  if(!name) return;
  if(!bolaoData[name]) {
    bolaoData[name] = {};
    localStorage.setItem('triondao_bolao_multi', JSON.stringify(bolaoData));
    updatePlayerSelect();
    document.getElementById('new-player-name').value = '';
    setBubble(`Aí sim, ${name}! Perfil criado, boa sorte no bolão!`);
    
    // Auto-seleciona o jogador criado
    document.getElementById('player-selector').value = name;
    changePlayer();
  } else {
    setBubble(`Opa, já existe um jogador com o nome ${name}!`);
  }
}

function updatePlayerSelect() {
  const sel = document.getElementById('player-selector');
  if(!sel) return;
  sel.innerHTML = '<option value="">Selecione um jogador...</option>';
  Object.keys(bolaoData).forEach(p => {
    sel.innerHTML += `<option value="${p}">${p}</option>`;
  });
  sel.value = currentPlayer;
}

function changePlayer() {
  currentPlayer = document.getElementById('player-selector').value;
  if(currentPlayer) {
    document.getElementById('bolao-content').style.display = 'block';
    showBolaoTab('palpites');
    renderBolao();
    setBubble(`E aí ${currentPlayer}, pronto para palpitar?`);
  } else {
    document.getElementById('bolao-content').style.display = 'none';
  }
}

function showBolaoTab(tab) {
  document.getElementById('area-palpites').style.display = tab === 'palpites' ? 'block' : 'none';
  document.getElementById('area-ranking').style.display = tab === 'ranking' ? 'block' : 'none';
  
  document.getElementById('btn-tab-palpites').style.background = tab === 'palpites' ? '#ffaa00' : '#444';
  document.getElementById('btn-tab-palpites').style.color = tab === 'palpites' ? '#1a5e1a' : 'white';
  
  document.getElementById('btn-tab-ranking').style.background = tab === 'ranking' ? '#ffaa00' : '#444';
  document.getElementById('btn-tab-ranking').style.color = tab === 'ranking' ? '#1a5e1a' : 'white';

  if (tab === 'ranking') updateRanking();
}

function renderBolao() {
  const container = document.getElementById('bolao-list');
  container.innerHTML = '';
  const saved = bolaoData[currentPlayer] || {};

  matches2026.forEach(m => {
    const sHome = saved[`m_${m.id}_home`] !== undefined ? saved[`m_${m.id}_home`] : '';
    const sAway = saved[`m_${m.id}_away`] !== undefined ? saved[`m_${m.id}_away`] : '';

    container.innerHTML += `
      <div class="match-card">
        <div class="match-header">
          <span>Grupo ${m.group} | 📅 ${m.date}</span>
        </div>
        <div class="match-teams">
          <span>${m.home}</span>
          <input type="number" min="0" class="bolao-input" id="m_${m.id}_home" value="${sHome}">
          <span class="match-vs">X</span>
          <input type="number" min="0" class="bolao-input" id="m_${m.id}_away" value="${sAway}">
          <span>${m.away}</span>
        </div>
        ${m.realHomeScore !== undefined ? `<div style="text-align:center; color:#ffd700; font-size:0.8em; margin-top:5px;">Resultado Real: ${m.realHomeScore} x ${m.realAwayScore}</div>` : ''}
      </div>
    `;
  });
}

function saveBolao() {
  if(!currentPlayer) return;
  const saved = {};
  matches2026.forEach(m => {
    saved[`m_${m.id}_home`] = document.getElementById(`m_${m.id}_home`).value;
    saved[`m_${m.id}_away`] = document.getElementById(`m_${m.id}_away`).value;
  });
  bolaoData[currentPlayer] = saved;
  localStorage.setItem('triondao_bolao_multi', JSON.stringify(bolaoData));
  
  const msg = document.getElementById('bolao-msg');
  msg.innerText = "✅ Palpites salvos com sucesso!";
  setTriondaoState('celebrating');
  setTimeout(() => msg.innerText = "", 3000);
}

// Easter Egg / Função de Teste: Como os jogos ainda não aconteceram, podemos simular os jogos da primeira rodada para ver o ranking
function simularResultados() {
  matches2026.forEach(m => {
      if (m.date === "11/06/2026" || m.date === "12/06/2026" || m.date === "13/06/2026" || m.date === "14/06/2026") {
          if(Math.random() > 0.5) {
             m.realHomeScore = Math.floor(Math.random() * 4);
             m.realAwayScore = Math.floor(Math.random() * 4);
          }
      }
  });
  setBubble("Resultados simulados gerados para teste de ranking!");
  if (document.getElementById('area-ranking').style.display === 'block') {
      updateRanking();
  } else if (currentPlayer) {
      renderBolao();
  }
}

// Ativar easter egg ao clicar 5 vezes no Triondão
let clickCountEgg = 0;
document.getElementById('triondao').addEventListener('click', () => {
    clickCountEgg++;
    if(clickCountEgg === 5) {
        simularResultados();
        clickCountEgg = 0;
    }
});

function updateRanking() {
  const tbody = document.getElementById('ranking-list');
  tbody.innerHTML = '';
  
  let scores = [];
  
  Object.keys(bolaoData).forEach(player => {
      let pts = 0;
      const palpites = bolaoData[player];
      
      matches2026.forEach(m => {
          if (m.realHomeScore !== undefined && m.realAwayScore !== undefined) {
              const pHome = parseInt(palpites[`m_${m.id}_home`]);
              const pAway = parseInt(palpites[`m_${m.id}_away`]);
              
              if (!isNaN(pHome) && !isNaN(pAway)) {
                  const realDiff = m.realHomeScore - m.realAwayScore;
                  const pDiff = pHome - pAway;
                  
                  if (m.realHomeScore === pHome && m.realAwayScore === pAway) {
                      pts += 3; // Placar exato
                  } else if ((realDiff > 0 && pDiff > 0) || (realDiff < 0 && pDiff < 0) || (realDiff === 0 && pDiff === 0)) {
                      pts += 1; // Acertou vencedor/empate
                  }
              }
          }
      });
      scores.push({ player, pts });
  });
  
  // Ordenar por pontos (decrescente)
  scores.sort((a,b) => b.pts - a.pts);
  
  if (scores.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#ccc;">Nenhum jogador cadastrado.</td></tr>';
      return;
  }
  
  scores.forEach((s, idx) => {
      let icon = "🏅";
      if (idx === 0) icon = "🥇";
      else if (idx === 1) icon = "🥈";
      else if (idx === 2) icon = "🥉";
      
      tbody.innerHTML += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
          <td style="padding: 12px; font-weight: bold; color: #ffd700; width: 60px;">${idx + 1}º ${icon}</td>
          <td style="padding: 12px; color: white;">${s.player}</td>
          <td style="padding: 12px; font-weight: bold; color: #2ecc71; text-align:right;">${s.pts} pts</td>
        </tr>
      `;
  });
}
