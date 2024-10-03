const { Configuration, OpenAIApi } = require('openai');

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
        Gera 5 layouts de banner usando a palavra "${message}". 
        Cada layout deve incluir a posição do texto, tamanho da fonte, cor e outras propriedades visuais. 
        Os banners devem mesclar com a imagem fornecida: ${imageUrl}
        O layout deve ser retornado em JSON no formato:
        {
          "textPosition": { "top": "50px", "left": "100px" },
          "textStyle": { "fontSize": "24px", "fontWeight": "bold", "color": "#FFFFFF" },
          "generatedText": "Texto gerado"
        }
      `;

      const gptResponse = await openai.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
      });

      const content = gptResponse.data.choices[0].message.content;

      let bannersSpec;
      try {
        bannersSpec = JSON.parse(content);
      } catch (jsonError) {
        console.error("Erro ao parsear JSON:", jsonError);
        return res.status(500).json({ message: 'Erro ao processar a resposta da GPT.' });
      }

      // Mapeia os banners para incluir o URL da imagem
      const banners = bannersSpec.map((banner, index) => ({
        ...banner,
        imageUrl,
        id: index + 1, // Adiciona um ID único para cada banner
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
