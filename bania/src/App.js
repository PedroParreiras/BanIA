import React, { useState } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import './App.css';
import { uploadImage } from './firebaseConfig';

const storage = getStorage();  // Inicializa o Firebase Storage

const App = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [numTexts, setNumTexts] = useState(1);  // Número de textos a serem posicionados
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!image || !message || numTexts < 1 || numTexts > 3) {
      setError('Selecione uma imagem, insira uma mensagem e escolha entre 1 e 3 textos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Faz o upload da imagem para o Firebase Storage
      const imageUrl = await uploadImage(image);

      // Envia a mensagem para a API do GPT e salva os layouts no Firebase Storage
      const response = await fetch('/api/generate-banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, numTexts, imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      // Layouts gerados e salvos no Firebase
      const data = await response.json();
      console.log(data.message);  // Layouts gerados com sucesso

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCanvas = async () => {
    try {
      // Baixar a imagem do Firebase Storage
      const imageRef = ref(storage, `images/${image.name}`);
      const imageUrl = await getDownloadURL(imageRef);

      // Baixar os layouts salvos no Firebase Storage
      const layoutRef = ref(storage, 'layouts/unique_layouts.json');  // Use o nome gerado automaticamente na função da API
      const layoutUrl = await getDownloadURL(layoutRef);

      const layoutsResponse = await fetch(layoutUrl);
      const layouts = await layoutsResponse.json();

      // Criar o canvas e combinar a imagem com os textos
      layouts.forEach((banner, index) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = imageUrl;

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          // Desenha os textos nos locais gerados pelo GPT
          banner.textPositions.forEach((pos) => {
            ctx.font = `${banner.textStyles.fontWeight} ${banner.textStyles.fontSize}px Arial`;
            ctx.fillStyle = banner.textStyles.color;
            ctx.fillText(pos.text, pos.left, pos.top);
          });

          // Exibe ou faz download do canvas gerado
          const link = document.createElement('a');
          link.download = `banner_${index + 1}.png`;
          link.href = canvas.toDataURL();
          link.click();
        };
      });
    } catch (error) {
      console.error('Erro ao baixar e processar dados:', error);
    }
  };

  return (
    <div className="App">
      <h1>Gerador de Banners</h1>
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        <input
          type="text"
          placeholder="Digite sua palavra"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <select value={numTexts} onChange={(e) => setNumTexts(Number(e.target.value))}>
          <option value={1}>1 Texto</option>
          <option value={2}>2 Textos</option>
          <option value={3}>3 Textos</option>
        </select>
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Banners'}
        </button>
        <button onClick={generateCanvas}>Baixar Banners</button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default App;
