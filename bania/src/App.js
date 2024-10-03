import React, { useState } from 'react';
import './App.css';
import { uploadImage } from './firebaseConfig';

const App = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [generatedBanners, setGeneratedBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!image || !message) {
      setError('Por favor, selecione uma imagem e insira uma mensagem.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Faz o upload da imagem para o Firebase
      const imageUrl = await uploadImage(image);

      // Envia a palavra para a API GPT e recebe os layouts
      const response = await fetch('/api/generate-banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, message }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedBanners(data.banners); // Definir os banners gerados
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
    img.src = banner.imageUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Adiciona o texto ao canvas de acordo com a posição e estilo do layout
      ctx.font = `${banner.textStyle.fontWeight} ${banner.textStyle.fontSize}px Arial`;
      ctx.fillStyle = banner.textStyle.color;
      ctx.fillText(banner.generatedText, banner.textPosition.left, banner.textPosition.top);

      // Faz o download da imagem final
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
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Banners'}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="banners-container">
        {generatedBanners.map((banner, index) => (
          <div key={index} className="banner">
            <img src={banner.imageUrl} alt={`Banner ${index}`} />
            <button onClick={() => generateCanvas(banner)}>Download Banner {index + 1}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
