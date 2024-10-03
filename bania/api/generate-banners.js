// src/api/generate-banner.js
import { Configuration, OpenAIApi } from 'openai';
import { getStorage, ref, uploadString } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message, numTexts, imageUrl } = req.body;

    if (!message || !numTexts || !imageUrl) {
      return res.status(400).json({ message: 'Mensagem, número de textos e URL da imagem são obrigatórios.' });
    }

    try {
      const prompt = `
        Gere um layout de banner com base nos seguintes requisitos:
        - Número de textos: ${numTexts}
        - Texto: "${message}"
        - Posicione os textos de forma aleatória no banner.
        - Utilize estilos variados para cada texto (tamanho, cor, peso da fonte).
        - Forneça o resultado em formato JSON com propriedades: textPositions (array de objetos com text, left, top, fontSize, color, fontWeight).
      `;

      const gptResponse = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      });

      const content = gptResponse.data.choices[0].message.content;

      let bannerSpec;

      try {
        bannerSpec = JSON.parse(content);
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        return res.status(500).json({ message: 'Erro ao processar a resposta da GPT.' });
      }

      const storageRef = ref(storage, `layouts/banner_layout.json`);
      await uploadString(storageRef, JSON.stringify(bannerSpec), 'raw', {
        contentType: 'application/json',
      });

      res.status(200).json({ message: 'Layout gerado e salvo no Firebase Storage.' });
    } catch (error) {
      console.error("Erro na API do GPT:", error.response ? error.response.data : error.message);
      res.status(500).json({ message: 'Erro ao gerar o banner.' });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido. Use POST.' });
  }
}
