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

// === LÓGICA DO JOGO DO GOLEIRO (PAREDÃO) ===
const canvas = document.getElementById('goalkeeper-canvas');
const ctx = canvas.getContext('2d');
let gameReq;
let ball = { x: 250, y: 350, radius: 25, tgtX: 250, tgtY: 100, speed: 0.05, progress: 0, active: false };
let gloves = { x: 250, y: 175, radius: 35 };
let gameScore = 0;
let shotsTaken = 0;
const maxShots = 10;

// Imagem da bola (SVG embutido)
const imgBall = new Image();
imgBall.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="white" stroke="black" stroke-width="2"/><polygon points="50,15 75,35 65,65 35,65 25,35" fill="black"/></svg>';

function startGame() {
  document.getElementById('game-overlay').style.display = 'none';
  gameScore = 0;
  shotsTaken = 0;
  document.getElementById('game-score').innerText = gameScore;
  setBubble("Prepara a ponte! Lá vem bomba!");
  loop();
  setTimeout(shootBall, 1000);
}

function shootBall() {
  if (shotsTaken >= maxShots) {
    endGame();
    return;
  }

  shotsTaken++;
  ball.tgtX = Math.random() * 400 + 50;
  ball.tgtY = Math.random() * 150 + 20;
  ball.startX = 250;
  ball.startY = 350;
  ball.startR = 30;
  ball.progress = 0;
  ball.speed = 0.02 + (shotsTaken * 0.003);
  ball.active = true;
}

function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Desenha o gol
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 10, 460, 180); // Trave

  if (ball.active) {
    ball.progress += ball.speed;
    const ease = ball.progress;
    const currentX = ball.startX + (ball.tgtX - ball.startX) * ease;
    const currentY = ball.startY + (ball.tgtY - ball.startY) * ease;
    const currentR = ball.startR - (ball.startR - 15) * ease;

    ctx.drawImage(imgBall, currentX - currentR, currentY - currentR, currentR * 2, currentR * 2);

    if (ball.progress >= 1) {
      ball.active = false;
      goalScored();
    }
  }

  // Desenha luvas
  ctx.beginPath();
  ctx.arc(gloves.x, gloves.y, gloves.radius, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.stroke();

  gameReq = requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  gloves.x = (e.clientX - rect.left) * (canvas.width / rect.width);
  gloves.y = (e.clientY - rect.top) * (canvas.height / rect.height);
  attemptSave();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  gloves.x = (touch.clientX - rect.left) * (canvas.width / rect.width);
  gloves.y = (touch.clientY - rect.top) * (canvas.height / rect.height);
  attemptSave();
}, { passive: false });

function attemptSave() {
  if (!ball.active) return;
  const ease = ball.progress;
  const bx = ball.startX + (ball.tgtX - ball.startX) * ease;
  const by = ball.startY + (ball.tgtY - ball.startY) * ease;

  const dist = Math.sqrt((bx - gloves.x) ** 2 + (by - gloves.y) ** 2);
  if (dist < gloves.radius + 15) {
    ball.active = false;
    saveMade();
  }
}

function saveMade() {
  gameScore++;
  document.getElementById('game-score').innerText = gameScore;
  setTriondaoState('celebrating');
  setBubble("DEFESAÇA!!!");
  createConfetti();
  setTimeout(shootBall, 1500);
}

function goalScored() {
  setTriondaoState('sad');
  setBubble("Gool deles... foi no ângulo!");
  setTimeout(shootBall, 1500);
}

function endGame() {
  cancelAnimationFrame(gameReq);
  document.getElementById('game-overlay').style.display = 'flex';
  document.getElementById('game-msg').innerText = `Fim de Jogo! Defesas: ${gameScore}`;
  setBubble(`Você defendeu ${gameScore} chutes!`);
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
  setBubble("E aí, Paredão! Sou o Triondão. O que quer saber da Copa?");
};

// === TABELA E BOLÃO (COPA 2026) ===
let matches2026 = [];
let matchId = 1;

// 1. Gerando os 72 jogos da Fase de Grupos (Grupos A até L)
const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
groups.forEach(g => {
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: `${g}1`, away: `${g}2` });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: `${g}3`, away: `${g}4` });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: `${g}1`, away: `${g}3` });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: `${g}4`, away: `${g}2` });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: `${g}4`, away: `${g}1` });
  matches2026.push({ id: matchId++, group: g, date: "A definir", time: "--:--", venue: "A definir", home: `${g}2`, away: `${g}3` });
});

// 2. Inserindo as informações já confirmadas e a simulação do Brasil
function setMatch(h, a, nH, nA, d, t, v) {
  let m = matches2026.find(x => x.home === h && x.away === a);
  if (m) {
    if (nH) m.home = nH; if (nA) m.away = nA;
    m.date = d; m.time = t; m.venue = v;
  }
}
setMatch("A1", "A2", "México", "A2", "11/06/2026", "17:00", "Estádio Azteca");
setMatch("A3", "A4", "A3", "A4", "11/06/2026", "20:00", "Guadalajara");
setMatch("B1", "B2", "Estados Unidos", "B2", "12/06/2026", "16:00", "Los Angeles");
setMatch("C1", "C2", "Canadá", "C2", "12/06/2026", "19:00", "Toronto");
setMatch("G1", "G2", "Brasil", "G2", "21/06/2026", "16:00", "Dallas");
setMatch("G4", "G1", "G4", "Brasil", "26/06/2026", "19:00", "Houston");
setMatch("G2", "G3", "G2", "Brasil", "01/07/2026", "15:00", "Miami");

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

function renderBolao() {
  const container = document.getElementById('bolao-list');
  container.innerHTML = '';
  const saved = JSON.parse(localStorage.getItem('triondao_bolao') || '{}');

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
      </div>
    `;
  });
}

function saveBolao() {
  const saved = {};
  matches2026.forEach(m => {
    saved[`m_${m.id}_home`] = document.getElementById(`m_${m.id}_home`).value;
    saved[`m_${m.id}_away`] = document.getElementById(`m_${m.id}_away`).value;
  });
  localStorage.setItem('triondao_bolao', JSON.stringify(saved));
  
  const msg = document.getElementById('bolao-msg');
  msg.innerText = "✅ Palpites salvos com sucesso!";
  setTriondaoState('celebrating');
  setTimeout(() => msg.innerText = "", 3000);
}
