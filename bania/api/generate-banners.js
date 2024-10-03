const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message, numTexts } = req.body;  // Recebe o número de textos a serem posicionados (até 3)

    if (!message || !numTexts) {
      return res.status(400).json({ message: 'Mensagem e número de textos são obrigatórios.' });
    }

    try {
      const prompt = `
        Gera 5 layouts de banners com base em banners já criados. 
        Cada layout deve ter entre 1 e ${numTexts} posições de texto randomizadas.
        O texto será a palavra: "${message}".
        Cada banner deve incluir diferentes posições de texto e estilos aleatórios, com tamanhos, cores e posições únicas para cada banner.
        Retorne no seguinte formato para cada banner:
        {
          "textPositions": [
            { "top": "randomizado", "left": "randomizado", "text": "Texto 1" },
            { "top": "randomizado", "left": "randomizado", "text": "Texto 2" }
          ],
          "textStyles": { "fontSize": "aleatório", "fontWeight": "aleatório", "color": "aleatório" }
        }
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

      // Adiciona um ID único para cada layout
      const banners = bannersSpec.map((banner, index) => ({
        ...banner,
        id: index + 1,
      }));

      res.status(200).json({ banners });
    } catch (error) {
      console.error("Erro na API do GPT:", error.response ? error.response.data : error.message);
      res.status(500).json({ message: 'Erro ao gerar banners.' });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido. Use POST.' });
  }
}
