// App.js
import React, { useState } from 'react';
import { uploadImage } from './firebaseConfig';
import './App.css';

const App = () => {
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [generatedBanners, setGeneratedBanners] = useState([]);

  const handleUpload = async () => {
    if (image && message) {
      const imageUrl = await uploadImage(image);

      const response = await fetch('/api/generate-banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl, message }),
      });

      const data = await response.json();
      setGeneratedBanners(data.banners); // Recebe as especificações dos banners
    }
  };

  return (
    <div className="App">
      <h1>Gerador de Banners</h1>
      <input type="file" onChange={(e) => setImage(e.target.files[0])} />
      <input
        type="text"
        placeholder="Digite sua mensagem"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleUpload}>Gerar Banners</button>
      <div className="banners-container">
        {generatedBanners.map((banner, index) => (
          <div key={index} className="banner" style={{ position: 'relative', width: '300px', height: '200px', border: '1px solid #ccc', margin: '10px' }}>
            <img src={image ? URL.createObjectURL(image) : banner.imageUrl} alt={`Banner ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div
              style={{
                position: 'absolute',
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
