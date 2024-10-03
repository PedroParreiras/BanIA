// src/App.js
import React, { useState } from 'react';
import { uploadImage } from './firebaseConfig';
import './App.css';

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
      const imageUrl = await uploadImage(image);

      const response = await fetch('/api/generate-banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, message }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar banners.');
      }

      const data = await response.json();
      setGeneratedBanners(data.banners);
    } catch (err) {
      console.error("Erro ao gerar banners:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>Gerador de Banners</h1>
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
        <input
          type="text"
          placeholder="Digite sua mensagem"
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
            <img src={banner.imageUrl} alt={`Banner ${index + 1}`} />
            <div
              className="banner-text"
              style={{
                top: banner.textPosition.top,
                left: banner.textPosition.left,
                fontSize: banner.textStyle.fontSize,
                fontWeight: banner.textStyle.fontWeight,
                color: banner.textStyle.color,
              }}
            >
              {banner.generatedText}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
