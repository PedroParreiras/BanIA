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
    console.log('handleUpload initiated');
    if (!image || !message || numTexts < 1 || numTexts > 2) {
      setError('Selecione uma imagem, insira uma mensagem e escolha entre 1 e 2 textos.');
      console.error('Validation failed: Missing image, message, or invalid number of texts');
      return;
    }

    setError('');
    setLoading(true);
    console.log('Uploading image to Firebase Storage');

    try {
      const imageUrl = await uploadImage(image);
      console.log('Image uploaded successfully:', imageUrl);

      console.log('Sending request to generate-banner API');
      const response = await fetch('/api/generate-banner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, numTexts, imageUrl }),
      });

      console.log('Response from generate-banner API:', response);

      if (!response.ok) {
        throw new Error(`Erro HTTP! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data.message);

    } catch (error) {
      setError(error.message);
      console.error('Error during handleUpload:', error);
    } finally {
      setLoading(false);
      console.log('handleUpload completed');
    }
  };

  const generateCanvas = async () => {
    console.log('generateCanvas initiated');
    try {
      console.log('Fetching image URL from Firebase Storage');
      const imageRef = ref(storage, `images/${image.name}`);
      const imageUrl = await getDownloadURL(imageRef);
      console.log('Image URL fetched:', imageUrl);

      console.log('Fetching layout URL from Firebase Storage');
      const layoutRef = ref(storage, 'layouts/banner_layout.json');
      const layoutUrl = await getDownloadURL(layoutRef);
      console.log('Layout URL fetched:', layoutUrl);

      console.log('Fetching banner specifications from layout URL');
      const layoutsResponse = await fetch(layoutUrl);
      const bannerSpec = await layoutsResponse.json();
      console.log('Banner specifications:', bannerSpec);

      console.log('Creating canvas for banner');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const img = new Image();
      img.src = imageUrl;

      img.onload = () => {
        console.log('Image loaded into canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        console.log('Drawing texts on canvas');
        bannerSpec.textPositions.forEach((pos) => {
          console.log('Drawing text:', pos.text, 'at', pos.left, pos.top);
          ctx.font = `${pos.fontWeight} ${pos.fontSize}px Arial`;
          ctx.fillStyle = pos.color;
          ctx.fillText(pos.text, pos.left, pos.top);
        });

        console.log('Converting canvas to PNG and initiating download');
        const link = document.createElement('a');
        link.download = `banner.png`;
        link.href = canvas.toDataURL();
        link.click();
        console.log('Banner downloaded');
      };

      img.onerror = (err) => {
        console.error('Error loading image:', err);
      };

    } catch (error) {
      console.error('Error during generateCanvas:', error);
    } finally {
      console.log('generateCanvas completed');
    }
  };

  return (
    <div className="App">
      <h1>Gerador de Banner</h1>
      <div className="upload-section">
        <input type="file" accept="image/*" onChange={(e) => {
          console.log('Image selected:', e.target.files[0]);
          setImage(e.target.files[0]);
        }} />
        <input
          type="text"
          placeholder="Digite sua palavra"
          value={message}
          onChange={(e) => {
            console.log('Message input changed:', e.target.value);
            setMessage(e.target.value);
          }}
        />
        <select value={numTexts} onChange={(e) => {
          console.log('Number of texts selected:', e.target.value);
          setNumTexts(Number(e.target.value));
        }}>
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
