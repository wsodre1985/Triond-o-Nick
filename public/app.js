// ===== ESTADO GLOBAL =====
let chatHistory = [];
let isRecording = false;
let recognition = null;

// ===== SONS (Web Audio API) =====
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playSound(type) {
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  gain.gain.value = 0.15;

  if (type === 'send') {
    osc.frequency.setValueAtTime(523, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.08);
    osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'receive') {
    osc.frequency.setValueAtTime(784, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.start(); osc.stop(audioCtx.currentTime + 0.25);
  } else if (type === 'correct') {
    osc.frequency.setValueAtTime(523, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
    osc.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  } else if (type === 'wrong') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.setValueAtTime(200, audioCtx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
    osc.start(); osc.stop(audioCtx.currentTime + 0.4);
  } else if (type === 'save') {
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1047, audioCtx.currentTime + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  } else if (type === 'goal') {
    osc.type = 'sawtooth';
    gain.gain.value = 0.1;
    osc.frequency.setValueAtTime(200, audioCtx.currentTime);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.start(); osc.stop(audioCtx.currentTime + 0.6);
  } else if (type === 'kick') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  } else if (type === 'whistle') {
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.15);
    osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  }
}

// ===== TRIONDÃO ANIMATIONS =====
const triondao = document.getElementById('triondao');
const speechBubble = document.getElementById('speech-bubble');
const speechText = document.getElementById('speech-text');
const mouth = document.querySelector('.mouth');

function setTriondaoState(state) {
  triondao.className = '';
  if (state) triondao.classList.add(state);

  mouth.className = 'mouth';
  if (state === 'thinking') mouth.classList.add('thinking');
  else if (state === 'celebrating') mouth.classList.add('surprised');
  else if (state === 'sad') mouth.classList.add('thinking');
  else mouth.classList.add('happy');
}

function showSpeechBubble(text, duration) {
  speechText.textContent = text;
  speechBubble.classList.remove('hidden');
  if (duration) {
    setTimeout(() => speechBubble.classList.add('hidden'), duration);
  }
}

function hideSpeechBubble() {
  speechBubble.classList.add('hidden');
}

// Eye tracking
document.addEventListener('mousemove', (e) => {
  const pupils = document.querySelectorAll('.pupil');
  const ballRect = document.querySelector('.ball-body').getBoundingClientRect();
  const cx = ballRect.left + ballRect.width / 2;
  const cy = ballRect.top + ballRect.height / 2;

  const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
  const dist = Math.min(3, Math.hypot(e.clientX - cx, e.clientY - cy) / 50);

  pupils.forEach(p => {
    p.style.left = (4 + Math.cos(angle) * dist) + 'px';
    p.style.top = (4 + Math.sin(angle) * dist) + 'px';
  });
});

// ===== TABS =====
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');

  if (tab === 'penalty') drawGoal();
  if (tab === 'chat' && chatHistory.length === 0) {
    sendFirstMessage();
  }
}

// ===== CHAT =====
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  const sender = role === 'bot' ? '⚽ Triondão' : '🧤 Você';
  div.innerHTML = `<div class="sender">${sender}</div><div class="bubble">${formatText(text)}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function showTyping() {
  const div = document.createElement('div');
  div.className = 'msg bot';
  div.id = 'typing-msg';
  div.innerHTML = `<div class="sender">⚽ Triondão</div><div class="typing-indicator"><span></span><span></span><span></span></div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById('typing-msg');
  if (el) el.remove();
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  addMessage(text, 'user');
  playSound('send');

  chatHistory.push({ role: 'user', content: text });

  setTriondaoState('thinking');
  showSpeechBubble('Hmm... 🤔', null);
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory })
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      addMessage(data.error, 'bot');
      setTriondaoState('sad');
      showSpeechBubble('Ops! 😅', 3000);
    } else {
      chatHistory.push({ role: 'assistant', content: data.reply });
      addMessage(data.reply, 'bot');
      playSound('receive');
      setTriondaoState('celebrating');
      showSpeechBubble('Golaço! ⚽', 2000);
      setTimeout(() => setTriondaoState('bouncing'), 2000);
    }
  } catch (err) {
    removeTyping();
    addMessage('Eita! Perdi a bola... Tenta de novo! 😅', 'bot');
    setTriondaoState('sad');
    showSpeechBubble('Erro! 😵', 3000);
    setTimeout(() => setTriondaoState('bouncing'), 3000);
  }
}

function sendFirstMessage() {
  chatHistory = [{ role: 'user', content: 'Olá! Me conta uma curiosidade sobre a Copa do Mundo!' }];
  setTriondaoState('thinking');
  showSpeechBubble('Pensando... 🤔');
  showTyping();

  fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: chatHistory })
  })
    .then(r => r.json())
    .then(data => {
      removeTyping();
      if (data.reply) {
        chatHistory.push({ role: 'assistant', content: data.reply });
        addMessage(data.reply, 'bot');
        playSound('receive');
        setTriondaoState('bouncing');
        showSpeechBubble('Fala, craque! ⚽', 3000);
      }
    })
    .catch(() => {
      removeTyping();
      addMessage('Fala, craque! ⚽ Eu sou o Triondão! Pergunta qualquer coisa sobre Copa do Mundo! 🏆', 'bot');
      setTriondaoState('bouncing');
    });
}

// ===== VOICE INPUT =====
function toggleVoice() {
  const btn = document.getElementById('btn-mic');
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showSpeechBubble('Seu navegador não suporta voz 😢', 3000);
    return;
  }

  if (isRecording) {
    recognition.stop();
    btn.classList.remove('recording');
    isRecording = false;
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    chatInput.value = text;
    btn.classList.remove('recording');
    isRecording = false;
    showSpeechBubble('Ouvi você! 👂', 2000);
    sendMessage();
  };

  recognition.onerror = () => {
    btn.classList.remove('recording');
    isRecording = false;
    showSpeechBubble('Não entendi... 😅', 2000);
  };

  recognition.onend = () => {
    btn.classList.remove('recording');
    isRecording = false;
  };

  recognition.start();
  btn.classList.add('recording');
  isRecording = true;
  showSpeechBubble('Estou ouvindo! 🎙️', null);
}

// ===== QUIZ DA COPA =====
// O banco de 100 perguntas agora vem do arquivo questions.js
// window.all100Questions

let quizState = { current: 0, score: 0, questions: [], answered: false };

function updateHistoryUI() {
  const games = localStorage.getItem('triondao_quiz_games') || 0;
  const totalScore = localStorage.getItem('triondao_quiz_total_score') || 0;
  if(document.getElementById('total-games')) document.getElementById('total-games').textContent = games;
  if(document.getElementById('total-score')) document.getElementById('total-score').textContent = totalScore;
}

function startQuiz() {
  playSound('whistle');
  // Sorteia 5 perguntas do banco de 100
  const allQ = window.all100Questions || [];
  quizState.questions = [...allQ].sort(() => Math.random() - 0.5).slice(0, 5);
  
  quizState.current = 0;
  quizState.score = 0;
  quizState.answered = false;
  document.getElementById('score').textContent = '0';
  document.getElementById('q-number').textContent = '0';
  document.getElementById('quiz-result').classList.add('hidden');
  document.getElementById('btn-start-quiz').textContent = '🔄 Recomeçar';
  document.getElementById('quiz-history').classList.add('hidden'); // Esconde histórico durante o jogo
  
  setTriondaoState('bouncing');
  showSpeechBubble('Bora jogar! 🏆 Sorteei 5 perguntas craque!', 2000);
  showQuizQuestion();
  updateHistoryUI();
}

function showQuizQuestion() {
  const q = quizState.questions[quizState.current];
  document.getElementById('q-number').textContent = quizState.current + 1;
  document.getElementById('quiz-question').textContent = q.q;
  quizState.answered = false;

  const optionsDiv = document.getElementById('quiz-options');
  optionsDiv.innerHTML = '';

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.onclick = () => answerQuiz(i);
    optionsDiv.appendChild(btn);
  });
}

function answerQuiz(index) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = quizState.questions[quizState.current];
  const buttons = document.querySelectorAll('.quiz-option');

  buttons[q.answer].classList.add('correct');

  if (index === q.answer) {
    quizState.score++;
    document.getElementById('score').textContent = quizState.score;
    playSound('correct');
    setTriondaoState('celebrating');
    showSpeechBubble('GOOOL! ⚽🎉', 2000);
  } else {
    buttons[index].classList.add('wrong');
    playSound('wrong');
    setTriondaoState('sad');
    showSpeechBubble('Quase! 😅', 2000);
  }

  // Show fact
  const factDiv = document.createElement('div');
  factDiv.style.cssText = 'margin-top:12px; padding:10px; background:rgba(255,215,0,0.15); border-radius:10px; font-size:0.9em; color:#ffd700;';
  factDiv.textContent = '💡 ' + q.fact;
  document.getElementById('quiz-options').appendChild(factDiv);
  setTimeout(() => {
    quizState.current++;
    if (quizState.current < quizState.questions.length) {
      showQuizQuestion();
      setTriondaoState('bouncing');
    } else {
      endQuiz();
    }
  }, 3500);
}

function endQuiz() {
  const result = document.getElementById('quiz-result');
  result.classList.remove('hidden');
  document.getElementById('quiz-history').classList.remove('hidden');
  
  const pct = (quizState.score / quizState.questions.length) * 100;

  // Salva no Histórico
  const prevGames = parseInt(localStorage.getItem('triondao_quiz_games') || 0);
  const prevScore = parseInt(localStorage.getItem('triondao_quiz_total_score') || 0);
  localStorage.setItem('triondao_quiz_games', prevGames + 1);
  localStorage.setItem('triondao_quiz_total_score', prevScore + quizState.score);
  updateHistoryUI();

  let emoji, msg;
  if (pct === 100) { emoji = '🏆👑'; msg = 'PERFEITO! Você é um CRAQUE da Copa!'; }
  else if (pct >= 80) { emoji = '⚽🌟'; msg = 'Muito bem! Você manda bem demais!'; }
  else if (pct >= 60) { emoji = '🎯'; msg = 'Boa tentativa! Vamos estudar mais?'; }
  else { emoji = '📚'; msg = 'Bora aprender mais sobre as Copas!'; }

  result.innerHTML = `
    <h2>${emoji}</h2>
    <p style="font-size:1.3em; font-weight:900; color:#ffd700;">${quizState.score}/${quizState.questions.length} acertos!</p>
    <p>${msg}</p>
  `;

  document.getElementById('quiz-question').textContent = 'Quiz finalizado! Veja seu histórico acima.';
  document.getElementById('quiz-options').innerHTML = '';

  if (pct >= 80) {
    setTriondaoState('celebrating');
    showSpeechBubble('Craque demais! 🏆', 3000);
    launchConfetti();
    playSound('correct');
  } else {
    setTriondaoState('bouncing');
    showSpeechBubble('Na próxima você brilha! ⭐', 3000);
  }
}

// ===== PENALTY GAME =====
const canvas = document.getElementById('penalty-canvas');
const ctx = canvas.getContext('2d');

let penaltyState = {
  active: false,
  shots: 0,
  saves: 0,
  goalsAgainst: 0,
  ballPos: null,
  keeperPos: null,
  animating: false,
  maxShots: 10
};

function drawGoal() {
  ctx.clearRect(0, 0, 600, 400);

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 180);
  skyGrad.addColorStop(0, '#87CEEB');
  skyGrad.addColorStop(1, '#B0E0E6');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 600, 180);

  // Grass
  const grassGrad = ctx.createLinearGradient(0, 180, 0, 400);
  grassGrad.addColorStop(0, '#2d8a2d');
  grassGrad.addColorStop(1, '#1a5e1a');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, 180, 600, 220);

  // Grass stripes
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 10; i++) {
    if (i % 2 === 0) ctx.fillRect(0, 180 + i * 22, 600, 22);
  }

  // Goal net (behind posts)
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(120, 60, 360, 160);

  // Net lines
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  for (let x = 120; x <= 480; x += 20) {
    ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 220); ctx.stroke();
  }
  for (let y = 60; y <= 220; y += 20) {
    ctx.beginPath(); ctx.moveTo(120, y); ctx.lineTo(480, y); ctx.stroke();
  }

  // Goal posts
  ctx.fillStyle = '#fff';
  ctx.fillRect(115, 55, 8, 170); // left post
  ctx.fillRect(477, 55, 8, 170); // right post
  ctx.fillRect(115, 55, 370, 8); // crossbar

  // Post shine
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fillRect(117, 55, 3, 170);
  ctx.fillRect(479, 55, 3, 170);

  // Penalty spot
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(300, 330, 4, 0, Math.PI * 2);
  ctx.fill();

  // Goalkeeper (idle)
  if (!penaltyState.animating) {
    drawKeeper(300, 195, '#ffd700');
  }

  // Instructions when not active
  if (!penaltyState.active && penaltyState.shots === 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(150, 120, 300, 50);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText('Clique para defender o chute!', 300, 150);
    ctx.textAlign = 'start';
  }
}

function drawKeeper(x, y, color) {
  // Body
  ctx.fillStyle = color;
  ctx.fillRect(x - 15, y - 25, 30, 35);

  // Head
  ctx.fillStyle = '#ffcc99';
  ctx.beginPath();
  ctx.arc(x, y - 35, 12, 0, Math.PI * 2);
  ctx.fill();

  // Gloves
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(x - 20, y - 15, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 20, y - 15, 7, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.fillStyle = '#333';
  ctx.fillRect(x - 10, y + 10, 8, 18);
  ctx.fillRect(x + 2, y + 10, 8, 18);
}

function drawKeeperDiving(x, y, direction) {
  ctx.save();
  ctx.translate(x, y);
  if (direction === 'left') ctx.scale(-1, 1);

  // Diving body
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.ellipse(0, -5, 25, 15, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#ffcc99';
  ctx.beginPath();
  ctx.arc(20, -15, 11, 0, Math.PI * 2);
  ctx.fill();

  // Stretched glove
  ctx.fillStyle = '#ff6600';
  ctx.beginPath();
  ctx.arc(35, -20, 8, 0, Math.PI * 2);
  ctx.fill();

  // Other glove
  ctx.beginPath();
  ctx.arc(-10, -15, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBall(x, y, size) {
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Pentagon pattern
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

function startPenalty() {
  penaltyState = { active: true, shots: 0, saves: 0, goalsAgainst: 0, ballPos: null, keeperPos: null, animating: false, maxShots: 10 };
  document.getElementById('saves').textContent = '0';
  document.getElementById('goals-against').textContent = '0';
  document.getElementById('total-shots').textContent = '0';
  document.getElementById('btn-start-penalty').textContent = '🔄 Recomeçar';
  document.getElementById('penalty-msg').textContent = 'Clique no lado do gol para onde você quer pular!';
  playSound('whistle');
  setTriondaoState('bouncing');
  showSpeechBubble('Bora defender! 🧤', 2000);
  drawGoal();
}

canvas.addEventListener('click', (e) => {
  if (!penaltyState.active || penaltyState.animating) return;
  if (penaltyState.shots >= penaltyState.maxShots) return;

  const rect = canvas.getBoundingClientRect();
  const scaleX = 600 / rect.width;
  const clickX = (e.clientX - rect.left) * scaleX;

  // Determine keeper dive direction
  let keeperTarget;
  if (clickX < 260) keeperTarget = 'left';
  else if (clickX > 340) keeperTarget = 'right';
  else keeperTarget = 'center';

  // Random ball direction (weighted to be EASIER)
  // Agora o goleiro tem 60% de chance de o chute ir para onde ele clicou!
  const rand = Math.random();
  let ballTarget;
  if (rand < 0.6) {
    ballTarget = keeperTarget; // Magnet effect!
  } else {
    const rand2 = Math.random();
    if (rand2 < 0.3) ballTarget = 'left';
    else if (rand2 < 0.6) ballTarget = 'right';
    else if (rand2 < 0.8) ballTarget = 'center';
    else ballTarget = 'miss';
  }

  penaltyState.animating = true;
  penaltyState.shots++;
  document.getElementById('total-shots').textContent = penaltyState.shots;
  playSound('kick');

  animatePenalty(keeperTarget, ballTarget);
});

function animatePenalty(keeperDir, ballDir) {
  let frame = 0;
  const totalFrames = 30;

  const ballStart = { x: 300, y: 330 };
  let ballEnd;
  switch (ballDir) {
    case 'left':  ballEnd = { x: 170 + Math.random() * 60, y: 100 + Math.random() * 80 }; break;
    case 'right': ballEnd = { x: 380 + Math.random() * 60, y: 100 + Math.random() * 80 }; break;
    case 'center': ballEnd = { x: 270 + Math.random() * 60, y: 100 + Math.random() * 60 }; break;
    case 'miss': ballEnd = { x: Math.random() > 0.5 ? 80 : 520, y: 40 + Math.random() * 50 }; break;
  }

  let keeperX;
  switch (keeperDir) {
    case 'left':  keeperX = 190; break;
    case 'right': keeperX = 410; break;
    case 'center': keeperX = 300; break;
  }

  const saved = ballDir !== 'miss' && keeperDir === ballDir;

  function animate() {
    frame++;
    const t = frame / totalFrames;
    const ease = 1 - Math.pow(1 - t, 3);

    drawGoal();

    // Ball position
    const bx = ballStart.x + (ballEnd.x - ballStart.x) * ease;
    const by = ballStart.y + (ballEnd.y - ballStart.y) * ease;
    const ballSize = 12 - t * 4;

    // Keeper diving
    const kx = 300 + (keeperX - 300) * ease;
    if (keeperDir === 'center') {
      drawKeeper(kx, 195, '#ffd700');
    } else {
      drawKeeperDiving(kx, 195, keeperDir);
    }

    drawBall(bx, by, ballSize);

    if (frame < totalFrames) {
      requestAnimationFrame(animate);
    } else {
      // Result
      setTimeout(() => {
        if (ballDir === 'miss') {
          document.getElementById('penalty-msg').textContent = '😂 Chutou pra fora! Nem precisou pular!';
          penaltyState.saves++;
          playSound('save');
          setTriondaoState('celebrating');
          showSpeechBubble('Chutou pra fora! 😂', 2000);
        } else if (saved) {
          penaltyState.saves++;
          document.getElementById('penalty-msg').textContent = '🧤 DEFESAÇA! Você pegou!';
          playSound('save');
          setTriondaoState('celebrating');
          showSpeechBubble('PEGOU! 🧤🔥', 2000);
          launchConfetti();
        } else {
          penaltyState.goalsAgainst++;
          document.getElementById('penalty-msg').textContent = '😩 GOOOL do adversário! Pulou pro lado errado!';
          playSound('goal');
          setTriondaoState('sad');
          showSpeechBubble('Gol... 😩', 2000);
        }

        document.getElementById('saves').textContent = penaltyState.saves;
        document.getElementById('goals-against').textContent = penaltyState.goalsAgainst;
        penaltyState.animating = false;

        if (penaltyState.shots >= penaltyState.maxShots) {
          endPenalty();
        } else {
          setTimeout(() => {
            drawGoal();
            setTriondaoState('bouncing');
          }, 1500);
        }
      }, 300);
    }
  }

  animate();
}

function endPenalty() {
  penaltyState.active = false;
  const pct = (penaltyState.saves / penaltyState.maxShots) * 100;

  let msg;
  if (pct >= 80) msg = '🏆 LENDA! Você é o novo Buffon! Defendeu quase tudo!';
  else if (pct >= 60) msg = '🧤 CRAQUE! Grandes defesas! Goleiro de Copa!';
  else if (pct >= 40) msg = '⚽ Boa tentativa! Continue treinando!';
  else msg = '📚 Precisa de mais treino! Bora de novo?';

  document.getElementById('penalty-msg').textContent = msg;

  if (pct >= 60) {
    setTriondaoState('celebrating');
    showSpeechBubble('Goleiro de Copa! 🧤🏆', 3000);
    launchConfetti();
  } else {
    setTriondaoState('bouncing');
    showSpeechBubble('Na próxima! 💪', 3000);
  }
}

// ===== CONFETTI =====
function launchConfetti() {
  const container = document.getElementById('confetti-container');
  const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#fff', '#2ecc71', '#e74c3c', '#3498db'];

  for (let i = 0; i < 50; i++) {
    const conf = document.createElement('div');
    conf.className = 'confetti';
    conf.style.left = Math.random() * 100 + '%';
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.animationDuration = (2 + Math.random() * 2) + 's';
    conf.style.animationDelay = Math.random() * 0.5 + 's';
    conf.style.width = (6 + Math.random() * 8) + 'px';
    conf.style.height = (6 + Math.random() * 8) + 'px';
    conf.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    container.appendChild(conf);

    setTimeout(() => conf.remove(), 4000);
  }
}

// ===== INIT =====
window.addEventListener('load', () => {
  setTriondaoState('bouncing');
  showSpeechBubble('Fala, craque! ⚽🏆', 4000);
  drawGoal();

  // Auto-start chat
  setTimeout(() => {
    if (document.querySelector('.tab[data-tab="chat"]').classList.contains('active')) {
      sendFirstMessage();
    }
  }, 500);
});

 / /   I n i c i a l i z a � � o 
 w i n d o w . a d d E v e n t L i s t e n e r ( ' l o a d ' ,   ( )   = >   { 
     u p d a t e H i s t o r y U I ( ) ; 
 } ) ;  
 