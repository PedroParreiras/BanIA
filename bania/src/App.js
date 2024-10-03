import React, { useState } from 'react';
import './App.css';
import { uploadImage } from './firebaseConfig';

const App = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [numTexts, setNumTexts] = useState(1);  // Número de textos a serem posicionados
  const [generatedBanners, setGeneratedBanners] = useState([]);
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
      // Faz o upload da imagem para o Firebase
      const imageUrl = await uploadImage(image);

      // Envia a mensagem para a API do GPT e recebe os layouts
      const response = await fetch('/api/generate-banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, numTexts }),  // Envia o número de textos para a API
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedBanners(data.banners);  // Recebe os layouts do GPT

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCanvas = (banner) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.src = URL.createObjectURL(image);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Desenha os textos gerados pelo GPT no canvas
      banner.textPositions.forEach((pos) => {
        ctx.font = `${banner.textStyles.fontWeight} ${banner.textStyles.fontSize}px Arial`;
        ctx.fillStyle = banner.textStyles.color;
        ctx.fillText(pos.text, pos.left, pos.top);
      });

      // Faz o download da imagem final com o texto
      const link = document.createElement('a');
      link.download = `banner_${banner.id}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
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
      </div>
      {error && <p className="error">{error}</p>}
      <div className="banners-container">
        {generatedBanners.map((banner) => (
          <div key={banner.id} className="banner">
            <img src={URL.createObjectURL(image)} alt={`Banner ${banner.id}`} />
            <button onClick={() => generateCanvas(banner)}>Download Banner {banner.id}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
