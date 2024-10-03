const { Configuration, OpenAIApi } = import('openai'); // Certifique-se de usar 'require' ou 'import' corretamente

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // Certifique-se de que a chave está disponível como variável de ambiente
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
        Os banners devem mesclar com a imagem fornecida: ${imageUrl}.
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

      const banners = bannersSpec.map((banner, index) => ({
        ...banner,
        imageUrl,
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
