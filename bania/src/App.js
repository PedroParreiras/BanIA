// src/App.js
import React, { useState } from 'react';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import './App.css';
import { uploadImage } from './firebaseConfig';

const storage = getStorage();

const App = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [numTexts, setNumTexts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpload = async () => {
    if (!image || !message || numTexts < 1 || numTexts > 2) {
      setError('Selecione uma imagem, insira uma mensagem e escolha entre 1 e 2 textos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const imageUrl = await uploadImage(image);

      const response = await fetch('/api/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, numTexts, imageUrl }),
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data.message);

    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateCanvas = async () => {
    try {
      const imageRef = ref(storage, `images/${image.name}`);
      const imageUrl = await getDownloadURL(imageRef);

      const layoutRef = ref(storage, 'layouts/banner_layout.json');
      const layoutUrl = await getDownloadURL(layoutRef);

      const layoutsResponse = await fetch(layoutUrl);
      const bannerSpec = await layoutsResponse.json();

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        bannerSpec.textPositions.forEach((pos) => {
          ctx.font = `${pos.fontWeight} ${pos.fontSize}px Arial`;
          ctx.fillStyle = pos.color;
          ctx.fillText(pos.text, pos.left, pos.top);
        });

        const link = document.createElement('a');
        link.download = `banner.png`;
        link.href = canvas.toDataURL();
        link.click();
      };
    } catch (error) {
      console.error('Erro ao baixar e processar dados:', error);
    }
  };

  return (
    <div className="App">
      <h1>Gerador de Banner</h1>
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
        </select>
        <button onClick={handleUpload} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar Banner'}
        </button>
        <button onClick={generateCanvas}>Baixar Banner</button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default App;
