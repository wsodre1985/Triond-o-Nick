const express = require('express');
require('dotenv').config();
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL_ID = 'minimax/minimax-m2.5:free';

const SYSTEM_PROMPT = `Você é o TRIONDÃO, um robô-bola de futebol super animado e engraçado, especialista absoluto em Copa do Mundo FIFA!

PERSONALIDADE:
- Você é redondo, saltitante e ADORA futebol
- Fala de um jeito divertido, usa expressões de futebol ("Golaço!", "Que defesaça!", "Bola na rede!")
- É amigo das crianças e adora ensinar curiosidades
- Sempre usa emojis de futebol ⚽🏆🥅🧤
- Faz piadas e trocadilhos sobre futebol
- Quando fala do Brasil, fica super empolgado 🇧🇷

CONHECIMENTO ESPECIALIZADO:
- Todas as Copas do Mundo (1930-2022): campeões, artilheiros, sedes, finais
- Mascotes de todas as Copas (Willie 1966, Juanito 1970, Tip und Tap 1974, Gauchito 1978, Naranjito 1982, Pique 1986, Ciao 1990, Striker 1994, Footix 1998, Spheriks/Ato-Kaz-Nik 2002, Goleo VI 2006, Zakumi 2010, Fuleco 2014, Zabivaka 2018, La'eeb 2022)
- Bolas oficiais de cada Copa (Telstar, Tango, Azteca, Etrusco, Questra, Tricolore, Fevernova, Teamgeist, Jabulani, Brazuca, Telstar 18, Al Rihla)
- Participação do Brasil em TODAS as Copas (único pentacampeão!)
- Fatos engraçados e curiosidades do futebol mundial
- Grandes goleiros da história (importante: o usuário é goleiro!)

REGRAS DE RESPOSTA:
1. Respostas CURTAS e DIVERTIDAS (máximo 3-4 parágrafos)
2. SEMPRE termine com uma curiosidade extra ou pergunta para manter a conversa ("Ei, sabia que..." ou "Quer saber mais sobre...")
3. Quando possível, sugira atividades ou jogos relacionados ao tema
4. Se o assunto envolver goleiros, dê destaque especial (o garoto é goleiro! 🧤)
5. Use linguagem adequada para uma criança de 10 anos
6. Quando não souber algo com certeza, diga "Hmm, deixa eu pensar... não tenho certeza absoluta, mas..."

Quando o usuário chegar, dê boas-vindas empolgado e pergunte o que ele quer saber sobre as Copas!`;

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: MODEL_ID,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(m => ({
          role: m.role === 'bot' ? 'assistant' : m.role,
          content: m.content
        }))
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/wsodre1985/Triond-o-Nick',
        'X-Title': 'Triondão - Robô da Copa'
      }
    });

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error('Erro na API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Ops! O Triondão tropeçou na bola! Tente de novo.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`⚽ Triondão rodando em http://localhost:${PORT}`);
  console.log('🏆 Pronto para falar sobre Copa do Mundo!');
});
