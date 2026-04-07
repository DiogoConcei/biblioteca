import React, { useState } from 'react';

function App() {
  const [token, setToken] = useState('');
  const [host, setHost] = useState('');
  const [connected, setConnected] = useState(false);
  const [library, setLibrary] = useState<{ id: number; name: string; coverImage?: string }[]>([]);

  // Função para converter string Unicode em Base64 de forma segura no navegador
  const toSafeBase64 = (str: string) => {
    if (!str) return '';
    try {
      // Primeiro codifica para UTF-8, depois escapa para que btoa aceite
      const utf8Bytes = new TextEncoder().encode(str);
      let binary = '';
      utf8Bytes.forEach(byte => { binary += String.fromCharCode(byte); });
      return btoa(binary);
    } catch (e) {
      console.error('Erro ao codificar caminho:', e);
      return '';
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = host.startsWith('http') ? host : `http://${host}`;
      const res = await fetch(`${url}/api/verify?token=${token}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        setConnected(true);
        fetchLibrary(url, token);
      } else {
        alert('Falha na conexão. Verifique o Token e Host.');
      }
    } catch (err) {
      alert('Erro de conexão: ' + err);
    }
  };

  const fetchLibrary = async (url: string, jwt: string) => {
    try {
      const res = await fetch(`${url}/api/library`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLibrary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (connected) {
    const baseUrl = host.startsWith('http') ? host : `http://${host}`;
    return (
      <div style={{ padding: '20px' }}>
        <h1>Minha Biblioteca</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '15px' }}>
          {library.map((item) => {
            const encodedPath = toSafeBase64(item.coverImage || '');
            return (
              <div key={item.id} style={{ background: '#1e1e1e', borderRadius: '8px', padding: '10px' }}>
                {item.coverImage && (
                  <img 
                    src={`${baseUrl}/api/media/local?path=${encodedPath}&token=${token}`} 
                    alt={item.name} 
                    style={{ width: '100%', height: '180px', borderRadius: '4px', objectFit: 'cover' }} 
                    onError={(e) => { 
                      console.error('Erro ao carregar imagem:', item.coverImage);
                      e.currentTarget.style.display = 'none'; 
                    }}
                  />
                )}
                <p style={{ 
                  fontSize: '0.9rem', 
                  marginTop: '10px', 
                  height: '2.4rem', 
                  overflow: 'hidden', 
                  display: '-webkit-box', 
                  WebkitLineClamp: 2, 
                  WebkitBoxOrient: 'vertical' 
                }}>
                  {item.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px' }}>
      <h1>Conectar</h1>
      <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '300px' }}>
        <input 
          type="text" 
          placeholder="IP:Porta (ex: 192.168.0.10:3030)" 
          value={host} 
          onChange={e => setHost(e.target.value)} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #333', background: '#222', color: 'white' }}
        />
        <input 
          type="text" 
          placeholder="Token de Sessão" 
          value={token} 
          onChange={e => setToken(e.target.value)} 
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #333', background: '#222', color: 'white' }}
        />
        <button type="submit" style={{ padding: '10px', background: '#8963ba', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Conectar</button>
      </form>
    </div>
  );
}

export default App;
