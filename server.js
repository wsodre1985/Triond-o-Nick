const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

// Carregamento manual do .env para evitar falhas do dotenvx/powershell
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.join('=').replace(/[\r\s"']/g, '').trim();
        }
    });
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const MODEL_ID = 'minimax/minimax-m2.5:free'; // Slug para MiniMax M2.5 Free
const PORT = process.env.PORT || 3000;

async function testConnection() {
    console.log(`\n🚀 Iniciando Triondão...`);
    if (!OPENROUTER_API_KEY) {
        console.error('❌ ERRO: Chave OPENROUTER_API_KEY não encontrada no arquivo .env!');
        return;
    }

    console.log(`📡 Validando chave: ${OPENROUTER_API_KEY.substring(0, 15)}...`);

    try {
        const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
            headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}` }
        });
        console.log('✅ Chave validada com sucesso na OpenRouter!');
    } catch (error) {
        console.error('❌ Erro na OpenRouter:', error.response ? error.response.data : error.message);
    }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: MODEL_ID,
      messages: [
        { role: 'system', content: 'Você é o Triondão, o robô-bola da Copa do Mundo!' },
        ...messages.map(m => ({
          role: m.role === 'bot' ? 'assistant' : m.role,
          content: m.content
        }))
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-OpenRouter-Title': 'Triondao'
      }
    });

    if (response.data && response.data.choices) {
      res.json({ reply: response.data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'Resposta vazia' });
    }
  } catch (error) {
    console.error('Erro no Chat:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Erro na IA' });
  }
});

app.listen(PORT, () => {
  console.log(`\n⚽ TRIONDÃO EM CAMPO!`);
  console.log(`🔗 http://localhost:${PORT}`);
  testConnection();
});
