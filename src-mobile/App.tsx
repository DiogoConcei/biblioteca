import React, { useState, useEffect } from 'react';

interface Chapter {
  id: number;
  name: string;
  isRead: boolean;
}

interface Serie {
  id: number;
  name: string;
  coverImage?: string;
}

interface ChapterContent {
  type: string;
  resources: string[];
  totalResources: number;
}

function App() {
  const [token, setToken] = useState('');
  const [host, setHost] = useState('');
  const [connected, setConnected] = useState(false);
  const [library, setLibrary] = useState<Serie[]>([]);
  
  // Navegação
  const [view, setView] = useState<'library' | 'series' | 'viewer'>('library');
  const [selectedSerie, setSelectedSerie] = useState<Serie | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(false);

  // Efeito para carregar parâmetros da URL (QR Code)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const urlHost = params.get('host');

    if (urlToken && urlHost) {
      setToken(urlToken);
      setHost(urlHost);
      autoConnect(urlHost, urlToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoConnect = async (h: string, t: string) => {
    try {
      const url = h.startsWith('http') ? h : `http://${h}`;
      const res = await fetch(`${url}/api/verify?token=${t}`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      
      if (res.ok) {
        setConnected(true);
        fetchLibrary(url, t);
      }
    } catch (err) {
      console.error('Falha na auto-conexão:', err);
    }
  };

  const toSafeBase64 = (str: string) => {
    if (!str) return '';
    try {
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

  const handleSerieClick = async (serie: Serie) => {
    setSelectedSerie(serie);
    setLoading(true);
    try {
      const baseUrl = host.startsWith('http') ? host : `http://${host}`;
      const res = await fetch(`${baseUrl}/api/series/${serie.id}/chapters?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
        setView('series');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = async (chapter: Chapter) => {
    if (!selectedSerie) return;
    setSelectedChapter(chapter);
    setLoading(true);
    try {
      const baseUrl = host.startsWith('http') ? host : `http://${host}`;
      const res = await fetch(`${baseUrl}/api/series/${selectedSerie.id}/chapters/${chapter.id}?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setChapterContent(data);
        setView('viewer');
        window.scrollTo(0, 0);
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.message || errorData.error || 'Erro desconhecido';
        alert(`Erro ao abrir capítulo: ${msg} (Status: ${res.status})`);
      }
    } catch (err) {
      console.error(err);
      alert(`Falha de conexão ao tentar abrir o capítulo: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  if (!connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px', padding: '20px' }}>
        <h1 style={{ color: '#8963ba', textAlign: 'center' }}>Biblioteca Web</h1>
        <p style={{ color: '#888', textAlign: 'center', marginBottom: '20px' }}>Aponte a câmera para o QR Code no Desktop ou preencha os dados abaixo.</p>
        <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '300px', marginTop: '10px' }}>
          <input 
            type="text" 
            placeholder="IP:Porta (ex: 192.168.0.10:3030)" 
            value={host} 
            onChange={e => setHost(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white', fontSize: '1rem' }}
          />
          <input 
            type="text" 
            placeholder="Token de Sessão" 
            value={token} 
            onChange={e => setToken(e.target.value)} 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#1a1a1a', color: 'white', fontSize: '1rem' }}
          />
          <button type="submit" style={{ padding: '12px', background: '#8963ba', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}>Conectar</button>
        </form>
      </div>
    );
  }

  const baseUrl = host.startsWith('http') ? host : `http://${host}`;

  // RENDERIZAÇÃO DA BIBLIOTECA
  if (view === 'library') {
    return (
      <div style={{ padding: '15px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Biblioteca</h1>
          <button onClick={() => { setConnected(false); setToken(''); }} style={{ background: 'transparent', color: '#ff4444', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>Sair</button>
        </header>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(105px, 1fr))', gap: '12px' }}>
          {library.map((item) => {
            const encodedPath = toSafeBase64(item.coverImage || '');
            const coverUrl = item.coverImage 
              ? `${baseUrl}/api/media/local?path=${encodeURIComponent(encodedPath)}&token=${token}`
              : null;

            return (
              <div 
                key={item.id} 
                onClick={() => handleSerieClick(item)}
                style={{ background: '#1a1a1a', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer' }}
              >
                <div style={{ width: '100%', aspectRatio: '2/3', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {coverUrl ? (
                    <img 
                      src={coverUrl} 
                      alt={item.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : <span style={{ color: '#444', fontSize: '0.8rem' }}>Sem Capa</span>}
                </div>
                <div style={{ padding: '8px' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 'bold', margin: 0, height: '2.4em', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.2' }}>
                    {item.name}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {loading && <p style={{ textAlign: 'center', marginTop: '20px', color: '#888' }}>Carregando...</p>}
      </div>
    );
  }

  // RENDERIZAÇÃO DOS CAPÍTULOS
  if (view === 'series' && selectedSerie) {
    return (
      <div style={{ padding: '20px' }}>
        <button onClick={() => setView('library')} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '8px', marginBottom: '20px', cursor: 'pointer' }}>← Voltar</button>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
           <div style={{ width: '100px', height: '140px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
              {selectedSerie.coverImage && (
                 <img src={`${baseUrl}/api/media/local?path=${encodeURIComponent(toSafeBase64(selectedSerie.coverImage))}&token=${token}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
           </div>
           <div>
              <h2 style={{ margin: 0 }}>{selectedSerie.name}</h2>
              <p style={{ color: '#888' }}>{chapters.length} Capítulos</p>
           </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {chapters.sort((a,b) => b.id - a.id).map((chapter: Chapter) => {
            const isNotDownloaded = !chapter.chapterPath || chapter.isDownloaded === 'not_downloaded';
            return (
              <div 
                key={chapter.id} 
                onClick={() => handleChapterClick(chapter)}
                style={{ background: '#1a1a1a', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontWeight: '500', color: isNotDownloaded ? '#bbb' : 'white' }}>{chapter.name}</span>
                  {isNotDownloaded && <span style={{ color: '#ffb74d', fontSize: '0.75rem' }}>⬇️ Requer download (pode demorar)</span>}
                </div>
                {chapter.isRead && <span style={{ color: '#4caf50', fontSize: '0.8rem', flexShrink: 0 }}>Lido</span>}
              </div>
            );
          })}
        </div>
        {loading && <p style={{ textAlign: 'center', marginTop: '20px' }}>Carregando conteúdo...</p>}
      </div>
    );
  }

  // RENDERIZAÇÃO DO VISUALIZADOR
  if (view === 'viewer' && selectedChapter && chapterContent) {
    const isBook = chapterContent.type === 'book';

    return (
      <div style={{ background: isBook ? '#f5f5f5' : '#000', minHeight: '100vh' }}>
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.9)', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', zIndex: 100, borderBottom: '1px solid #333' }}>
           <button onClick={() => setView('series')} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '5px' }}>←</button>
           <span style={{ color: 'white', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedChapter.name}</span>
        </div>
        
        <div style={{ paddingTop: '70px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isBook ? '30px' : '0', paddingBottom: '20px' }}>
          {chapterContent.resources.map((resource: string | { path: string }, idx) => {
            const url = typeof resource === 'string' ? resource : resource.path;
            const fullUrl = `${baseUrl}${url}`;

            if (isBook) {
              return (
                <div key={idx} style={{ width: '95%', maxWidth: '900px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.2)', border: '1px solid #ddd' }}>
                  <iframe 
                    src={fullUrl} 
                    title={`Página ${idx + 1}`}
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin"
                    style={{ width: '100%', height: '85vh', border: 'none' }}
                  />
                </div>
              );
            }

            return (
              <img 
                key={idx} 
                src={fullUrl} 
                alt={`Página ${idx + 1}`} 
                style={{ width: '100%', maxWidth: '850px', display: 'block' }} 
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                  console.error('Falha ao carregar página:', fullUrl);
                }}
              />
            );
          })}
        </div>
        
        <div style={{ padding: '40px 20px', textAlign: 'center', background: isBook ? '#eee' : 'transparent' }}>
           <button onClick={() => { setView('series'); window.scrollTo(0, 0); }} style={{ background: '#8963ba', color: 'white', border: 'none', padding: '14px 40px', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(137, 99, 186, 0.4)' }}>Concluir Leitura</button>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
