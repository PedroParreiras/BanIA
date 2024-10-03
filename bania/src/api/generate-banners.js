// api/generate-banners.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
      const { imageUrl, message } = req.body;
  
      const gptResponse = await fetch('https://api.openai.com/v1/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer SUA_API_KEY_OPENAI`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          prompt: `Gere 10 banners com a imagem ${imageUrl} e a mensagem "${message}". Coloque as palavras em posições criativas e crie frases novas.`
        }),
      });
  
      const banners = await gptResponse.json();
      // Simulação do que seria retornado - Você deve ajustar ao real retorno do GPT
      res.status(200).json({ banners: banners.data });
    } else {
      res.status(405).json({ message: 'Método não permitido' });
    }
  }
  