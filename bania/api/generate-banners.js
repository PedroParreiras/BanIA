const { Configuration, OpenAIApi } = require('openai');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadString } = require('firebase/storage');

// Configuração do Firebase
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
      // Gera layouts com o GPT
      const prompt = `
        Gera 5 layouts de banners com base em banners já feitos. 
        Cada layout deve ter entre 1 e ${numTexts} posições de texto randomizadas.
        O texto será a palavra: "${message}".
        Cada banner deve incluir diferentes posições de texto e estilos aleatórios, com tamanhos, cores e posições únicas para cada banner.
      `;

      const gptResponse = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      const content = gptResponse.data.choices[0].message.content;
      let bannersSpec;

      try {
        bannersSpec = JSON.parse(content);  // Garante que o JSON seja válido
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        return res.status(500).json({ message: 'Erro ao processar a resposta da GPT.' });
      }

      // Enviar layouts para o Firebase Storage
      const storageRef = ref(storage, `layouts/${Date.now()}_layouts.json`);
      await uploadString(storageRef, JSON.stringify(bannersSpec), 'raw', {
        contentType: 'application/json',
      });

      res.status(200).json({ message: 'Layouts gerados e salvos no Firebase Storage.' });
    } catch (error) {
      console.error("Erro na API do GPT:", error.response ? error.response.data : error.message);
      res.status(500).json({ message: 'Erro ao gerar banners.' });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido. Use POST.' });
  }
}
