const { Configuration, OpenAIApi } = require('openai'); // Use require se a import não estiver funcionando

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { imageUrl, message } = req.body;

    if (!imageUrl || !message) {
      return res.status(400).json({ message: 'Imagem e mensagem são obrigatórias.' });
    }

    try {
      const prompt = `
        Crie 10 especificações para banners usando a seguinte imagem e mensagem.
        - Imagem: ${imageUrl}
        - Mensagem: "${message}"
        
        Para cada banner, forneça:
        1. Posição da imagem (ex: centro, canto superior esquerdo, etc.)
        2. Posição e estilo do texto (ex: abaixo da imagem, fonte grande e negrito, etc.)
        3. Texto gerado baseado na mensagem fornecida.
      `;

      const gptResponse = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      const content = gptResponse.data.choices[0].message.content;

      let bannersSpec;
      try {
        bannersSpec = JSON.parse(content);
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        return res.status(500).json({ message: 'Erro ao processar a resposta da GPT.' });
      }

      res.status(200).json({ banners: bannersSpec });
    } catch (error) {
      console.error("Erro na API do GPT:", error.response ? error.response.data : error.message);
      res.status(500).json({ message: 'Erro ao gerar banners.' });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido. Use POST.' });
  }
}
