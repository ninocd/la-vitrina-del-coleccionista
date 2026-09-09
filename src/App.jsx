import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Silueta vectorial por defecto si no hay imagen
const BarbieSilhouetteFallback = () => (
  <div className="w-full h-full bg-gradient-to-b from-gray-900 to-pink-950 flex flex-col items-center justify-center p-2 rounded-lg border border-pink-900/30">
    <svg className="w-12 h-12 text-pink-500/40 mb-1" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
    <span className="text-[9px] text-pink-400 font-bold uppercase tracking-wider text-center">Sin imagen</span>
  </div>
);

// Procesador de fondo blanco estilo estudio
const processWhiteStudioBackground = (base64Img) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Img;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width || 600;
      canvas.height = img.height || 800;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height * 0.85, 10,
        canvas.width / 2, canvas.height * 0.85, canvas.width * 0.4
      );
      gradient.addColorStop(0, 'rgba(210, 210, 210, 0.6)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(canvas.width / 2, canvas.height * 0.85, canvas.width * 0.35, canvas.height * 0.05, 0, 0, 2 * Math.PI);
      ctx.fill();

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => resolve(base64Img);
  });
};

function getBarbieLoreFallback(name, line, year) {
  return `Edición oficial de Mattel lanzada en ${year || 'año no especificado'}. Formó parte de la línea ${line || 'Colección General'}, siendo un elemento muy valorado por coleccionistas.`;
}

function calculateDynamicPrice(item) {
  const basePrice = item.estimated_min_price || 35;
  const year = Number(item.release_year) || 2000;
  const ageMultiplier = Math.max(1, (2026 - year) * 0.08);
  return Math.round(basePrice * ageMultiplier);
}

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vitrina');

  // Datos
  const [masterCatalog, setMasterCatalog] = useState([]);
  const [myCollection, setMyCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Interfaz
  const [showMobileMetrics, setShowMobileMetrics] = useState(false);
  const [isVitrinaPublic, setIsVitrinaPublic] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Perfiles de Coleccionistas Reales
  const betaTesters = [
    { id: 1, handle: "@chicledefresadolls", role: "Especialista en Fotografía & Curaduría", badge: "Verified Collector", avatar: "🎀" },
    { id: 2, handle: "@barbiedecoleccionenespanol", role: "Historiador de Lore & Ediciones Vintage", badge: "Vintage Archivist", avatar: "👑" },
    { id: 3, handle: "@pm_collectibles", role: "Analista de Mercado & NFRB/MIB", badge: "Market Specialist", avatar: "💎" }
  ];

  // Filtros
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [selectedEraFilter, setSelectedEraFilter] = useState('Todas');

  // Modales y Form
  const [editingLoreItem, setEditingLoreItem] = useState(null);
  const [certificateItem, setCertificateItem] = useState(null);
  const [comparePriceItem, setComparePriceItem] = useState(null);
  const [adminLoreForm, setAdminLoreForm] = useState({ lore: '', collection_line: '', release_year: '' });
  const [activeModal, setActiveModal] = useState(null);
  const [userBarbieForm, setUserBarbieForm] = useState({
    quantity: 1,
    condition: 'NFRB (Caja Original Precintada)',
    customPrice: '',
    serialNumber: '',
    notes: ''
  });

  // Escáner IA (gemini-3.6-flash)
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedImageBase64, setScannedImageBase64] = useState(null);
  const [debugError, setDebugError] = useState(null);

  // Moneda
  const [currency, setCurrency] = useState('EUR');
  const exchangeRateUSD = 1.08;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });

    fetchMasterCatalog();

    return () => subscription.unsubscribe();
  }, []);

  // Cargar Catálogo Maestro
  async function fetchMasterCatalog() {
    setLoading(true);
    try {
      if (!supabase) return;

      const { data, error } = await supabase
        .from('barbies_master')
        .select('*')
        .order('release_year', { ascending: true });

      if (error) {
        console.error("Error cargando barbies_master:", error);
        return;
      }

      const catalog = (data || []).map((item) => {
        const estimatedPrice = calculateDynamicPrice(item);
        const loreText = (item.lore && item.lore.trim() !== '') 
          ? item.lore 
          : getBarbieLoreFallback(item.name, item.collection_line, item.release_year);

        const validImage = (item.image_url && !item.image_url.includes('unsplash')) ? item.image_url : null;

        return { 
          ...item, 
          image_url: validImage,
          estimated_min_price: estimatedPrice, 
          lore: loreText 
        };
      });

      setMasterCatalog(catalog);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Cargar Vitrina del Usuario
  async function fetchUserData(userId) {
    if (!supabase) return;
    try {
      const { data: colData } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', userId);

      if (colData) {
        setMyCollection(colData.map(item => ({
          ...item,
          userInstanceId: item.id,
          lore: item.lore || getBarbieLoreFallback(item.name, item.collection_line, item.release_year),
          image_url: (item.image_url && !item.image_url.includes('unsplash')) ? item.image_url : null
        })));
      }
    } catch (e) {
      console.error(e);
    }
  }

  const totalCollectionValueEUR = myCollection.reduce((acc, item) => {
    const qty = item.quantity || 1;
    const price = item.estimated_min_price || 0;
    return acc + (price * qty);
  }, 0);

  const toggleWishlist = (barbie) => {
    setWishlist(prev => {
      const exists = prev.some(item => item.id === barbie.id);
      if (exists) return prev.filter(item => item.id !== barbie.id);
      return [...prev, barbie];
    });
  };

  const handleOpenEditLore = (barbie) => {
    setEditingLoreItem(barbie);
    setAdminLoreForm({
      lore: barbie.lore || '',
      collection_line: barbie.collection_line || '',
      release_year: barbie.release_year || ''
    });
  };

  // GUARDADO PERMANENTE Y CORREGIDO EN SUPABASE
  const handleSaveAdminLore = async (e) => {
    e.preventDefault();
    if (!editingLoreItem) return;

    const updatedLore = adminLoreForm.lore;
    const updatedLine = adminLoreForm.collection_line;
    const updatedYear = Number(adminLoreForm.release_year);

    // 1. Guardar en la vitrina del usuario (si la pieza viene de user_collections)
    if (editingLoreItem.userInstanceId && supabase) {
      const { error: userErr } = await supabase
        .from('user_collections')
        .update({ 
          lore: updatedLore, 
          collection_line: updatedLine, 
          release_year: updatedYear,
          notes: `[HISTORIA OFICIAL]: ${updatedLore}` 
        })
        .eq('id', editingLoreItem.userInstanceId);

      if (userErr) console.error("Error al actualizar user_collections:", userErr);

      setMyCollection(prev => prev.map(item => 
        item.userInstanceId === editingLoreItem.userInstanceId 
          ? { ...item, lore: updatedLore, collection_line: updatedLine, release_year: updatedYear }
          : item
      ));
    }

    // 2. Guardar en el catálogo maestro (barbies_master)
    const masterId = editingLoreItem.barbie_master_id || editingLoreItem.id;
    if (masterId && supabase) {
      const { error: masterErr } = await supabase
        .from('barbies_master')
        .update({ 
          lore: updatedLore, 
          collection_line: updatedLine, 
          release_year: updatedYear 
        })
        .eq('id', masterId);

      if (masterErr) console.error("Error al actualizar barbies_master:", masterErr);

      setMasterCatalog(prev => prev.map(item => 
        item.id === masterId 
          ? { ...item, lore: updatedLore, collection_line: updatedLine, release_year: updatedYear }
          : item
      ));
    }

    setEditingLoreItem(null);
  };

  const handleAddToMyVitrina = async (e) => {
    e.preventDefault();
    if (!activeModal?.barbie) return;

    const barbieSource = activeModal.barbie;
    const finalLore = (barbieSource.lore && barbieSource.lore.trim() !== '')
      ? barbieSource.lore
      : getBarbieLoreFallback(barbieSource.name, barbieSource.collection_line, barbieSource.release_year);

    let finalPriceInEUR = barbieSource.estimated_min_price || calculateDynamicPrice(barbieSource);
    if (userBarbieForm.customPrice) {
      const parsedCustom = parseFloat(userBarbieForm.customPrice);
      finalPriceInEUR = currency === 'USD' ? parsedCustom / exchangeRateUSD : parsedCustom;
    }

    let processedImage = barbieSource.image_url || null;
    if (processedImage && processedImage.startsWith('data:image')) {
      processedImage = await processWhiteStudioBackground(processedImage);
    }

    const payload = {
      user_id: session?.user?.id || 'guest',
      barbie_master_id: barbieSource.id || null,
      name: barbieSource.name,
      collection_line: barbieSource.collection_line,
      release_year: Number(barbieSource.release_year),
      estimated_min_price: Number(finalPriceInEUR),
      image_url: processedImage,
      quantity: Math.max(1, Number(userBarbieForm.quantity || 1)),
      condition: userBarbieForm.condition,
      serial_number: userBarbieForm.serialNumber || `MAT-${barbieSource.release_year || '2026'}-${Math.floor(Math.random()*899+100)}`,
      lore: finalLore,
      notes: userBarbieForm.notes 
        ? `${userBarbieForm.notes}\n\n[HISTORIA OFICIAL]: ${finalLore}` 
        : `[HISTORIA OFICIAL]: ${finalLore}`
    };

    if (supabase && session) {
      await supabase.from('user_collections').insert([payload]);
      fetchUserData(session.user.id);
    } else {
      setMyCollection(prev => [...prev, { ...payload, userInstanceId: Date.now() }]);
    }

    setActiveModal(null);
    setScanResult(null);
    setScannedImageBase64(null);
    setUserBarbieForm({ quantity: 1, condition: 'NFRB (Caja Original Precintada)', customPrice: '', serialNumber: '', notes: '' });
    setActiveTab('vitrina');
  };

  const handleScanImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setScanning(true);
    setScanResult(null);
    setDebugError(null);

    try {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const fullBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setScannedImageBase64(fullBase64);
        const base64Data = fullBase64.split(',')[1];

        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType: 'image/jpeg' })
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          setDebugError(`Error en servidor: ${data.error}`);
          setScanning(false);
          return;
        }

        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (rawText) {
          try {
            const cleanedJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(cleanedJson);
            setScanResult(parsedResult);
          } catch (jsonErr) {
            setDebugError(`Error de interpretación: ${rawText}`);
          }
        } else {
          setDebugError("La IA no devolvió un resultado utilizable.");
        }
        setScanning(false);
      };
    } catch (err) {
      setDebugError(`Fallo de conexión: ${err.message}`);
      setScanning(false);
    }
  };

  const getMarketSearchUrls = (barbieName) => {
    const query = encodeURIComponent(`Barbie ${barbieName}`);
    return {
      vinted: `https://www.vinted.es/vetements?search_text=${query}`,
      wallapop: `https://es.wallapop.com/app/search?keywords=${query}`,
      ebay: `https://www.ebay.es/sch/i.html?_nkw=${query}`,
      amazon: `https://www.amazon.es/s?k=${query}`,
      catawiki: `https://www.catawiki.com/es/s?q=${query}`
    };
  };

  const getPublicVitrinaUrl = () => {
    const userId = session?.user?.id || 'demo';
    return `${window.location.origin}/?vitrina=${userId}`;
  };

  const getShareText = () => {
    return `¡Te invito a ver mi colección oficial de Barbie en La Vitrina del Coleccionista! 🎀\n\n` +
      `📊 Piezas catalogadas: ${myCollection.length}\n` +
      `💰 Valor estimado: ${totalCollectionValueEUR.toLocaleString()} €\n\n` +
      `Descubre mi colección aquí: ${getPublicVitrinaUrl()}`;
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(getPublicVitrinaUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredMasterCatalog = masterCatalog.filter((barbie) => {
    const nameMatch = (barbie.name || '').toLowerCase().includes(catalogSearchTerm.toLowerCase());
    const lineMatch = (barbie.collection_line || '').toLowerCase().includes(catalogSearchTerm.toLowerCase());
    const matchesSearch = nameMatch || lineMatch;

    const year = Number(barbie.release_year) || 0;
    let matchesEra = true;

    if (selectedEraFilter === 'Vintage (1959-1989)') matchesEra = year >= 1959 && year <= 1989;
    if (selectedEraFilter === 'Modern / Y2K (1990-2009)') matchesEra = year >= 1990 && year <= 2009;
    if (selectedEraFilter === 'Contemporánea (2010-Presente)') matchesEra = year >= 2010;

    return matchesSearch && matchesEra;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-24 pt-2">
      
      {/* CABECERA MÓVIL */}
      <header className="bg-gray-900/90 border-b border-pink-900/40 px-3 py-2 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-pink-600 text-white font-black rounded-full w-8 h-8 flex items-center justify-center text-base shadow-md shadow-pink-600/30">
              V
            </div>
            <div>
              <h1 className="text-sm font-black text-pink-500 tracking-wide leading-none">LA VITRINA</h1>
              <p className="text-[9px] text-gray-400 leading-none mt-0.5">COLLECTIONS & APP</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileMetrics(!showMobileMetrics)}
              className="bg-gray-800 border border-gray-700 text-pink-400 text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
            >
              📊 {currency === 'EUR' ? `${totalCollectionValueEUR}€` : `${Math.round(totalCollectionValueEUR * exchangeRateUSD)}$`}
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-pink-950 border border-pink-600/50 text-pink-300 text-xs p-1.5 rounded-lg"
              title="Compartir Vitrina"
            >
              🌐
            </button>
          </div>
        </div>

        {/* MÉTRICAS COMPACTAS DESPLEGABLES */}
        {showMobileMetrics && (
          <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-3 gap-2 text-center text-xs animate-fadeIn">
            <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-400 uppercase font-bold">Valor Total</p>
              <p className="font-extrabold text-pink-400 mt-0.5">
                {currency === 'EUR' ? `${totalCollectionValueEUR.toLocaleString()} €` : `${Math.round(totalCollectionValueEUR * exchangeRateUSD).toLocaleString()} $`}
              </p>
            </div>
            <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-400 uppercase font-bold">En Vitrina</p>
              <p className="font-extrabold text-white mt-0.5">{myCollection.length} uds.</p>
            </div>
            <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-400 uppercase font-bold">Wishlist</p>
              <p className="font-extrabold text-pink-300 mt-0.5">{wishlist.length} pcs.</p>
            </div>
          </div>
        )}
      </header>

      {/* VISTA PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-3 mt-3">

        {/* TAB: MI VITRINA */}
        {activeTab === 'vitrina' && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-white">Mi Colección ({myCollection.length})</h2>
              <button 
                onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
                className="text-[10px] bg-gray-900 border border-gray-700 text-pink-400 px-2 py-1 rounded-md font-bold"
              >
                {currency === 'EUR' ? 'Moneda: €' : 'Moneda: $'}
              </button>
            </div>

            {myCollection.length === 0 ? (
              <div className="text-center py-10 bg-gray-900 rounded-xl border border-gray-800 text-gray-400 text-xs px-4">
                Aún no tienes muñecas en tu Vitrina. Usa el catálogo o el escáner para añadir la primera.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {myCollection.map((item) => (
                  <div key={item.userInstanceId} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="h-40 bg-gray-950 p-2 flex items-center justify-center relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="max-h-full object-contain rounded-md" />
                        ) : (
                          <BarbieSilhouetteFallback />
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-gray-900/90 text-gray-300 text-[8px] px-1.5 py-0.5 rounded font-bold">
                          {item.condition ? item.condition.split(' ')[0] : 'NFRB'}
                        </span>
                      </div>
                      <div className="p-2.5">
                        <p className="text-[9px] text-pink-400 font-bold uppercase truncate">{item.collection_line}</p>
                        <h3 className="font-bold text-xs text-white leading-tight line-clamp-1">{item.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{item.lore}</p>
                      </div>
                    </div>
                    <div className="p-2 border-t border-gray-800 bg-gray-950 flex items-center justify-between">
                      <span className="text-pink-400 font-extrabold text-xs">{item.estimated_min_price} €</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setCertificateItem(item)}
                          className="bg-pink-950 text-pink-300 text-[10px] p-1 rounded font-bold"
                          title="Certificado"
                        >
                          📜
                        </button>
                        <button 
                          onClick={() => handleOpenEditLore(item)}
                          className="bg-gray-800 text-gray-300 text-[10px] p-1 rounded font-bold"
                          title="Editar Historia"
                        >
                          ✏️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB: ESCÁNER */}
        {activeTab === 'scan' && (
          <section className="max-w-md mx-auto bg-gray-900 border border-gray-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-base font-extrabold text-pink-500 text-center mb-1">Escáner de Catalogación IA</h2>
            <p className="text-[11px] text-gray-400 text-center mb-4">Fotografía la Barbie para identificarla y guardarla con acabado de estudio.</p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-4 bg-gray-950">
              <label className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-pink-600/30">
                📷 Abrir Cámara / Foto
                <input type="file" accept="image/*" capture="environment" onChange={handleScanImage} className="hidden" />
              </label>

              {scannedImageBase64 && (
                <div className="mt-3 text-center">
                  <img src={scannedImageBase64} alt="Captura" className="max-h-48 rounded-lg border border-gray-800 mx-auto" />
                </div>
              )}
            </div>

            {scanning && (
              <div className="mt-4 p-3 bg-gray-950 rounded-lg border border-pink-900/50 text-center text-pink-400 font-bold text-xs animate-pulse">
                Identificando modelo con Gemini 3.6-flash...
              </div>
            )}

            {debugError && (
              <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-[10px] font-mono">
                {debugError}
              </div>
            )}

            {scanResult && scanResult.primary_match && (
              <div className="mt-4 bg-gray-950 border border-pink-600/40 rounded-xl p-4">
                <span className="bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Identificada</span>
                <h3 className="text-sm font-black text-white mt-1">{scanResult.primary_match.name}</h3>
                <p className="text-[10px] text-pink-400 font-bold">{scanResult.primary_match.collection_line} ({scanResult.primary_match.release_year})</p>

                <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase font-bold">Estimación</p>
                    <p className="text-sm font-bold text-pink-400">{scanResult.primary_match.estimated_min_price} €</p>
                  </div>
                  <button 
                    onClick={() => setActiveModal({ 
                      type: 'add_to_vitrina', 
                      barbie: {
                        name: scanResult.primary_match.name,
                        collection_line: scanResult.primary_match.collection_line,
                        release_year: scanResult.primary_match.release_year,
                        estimated_min_price: scanResult.primary_match.estimated_min_price,
                        lore: scanResult.primary_match.lore,
                        image_url: scannedImageBase64
                      }
                    })}
                    className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition shadow-md"
                  >
                    ✨ Guardar
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB: CATÁLOGO MAESTRO */}
        {activeTab === 'catalog' && (
          <section>
            <div className="bg-gray-900 p-2.5 rounded-xl mb-3 border border-pink-900/40 flex flex-col gap-2">
              <input
                type="text"
                placeholder="🔍 Buscar Barbie o línea..."
                value={catalogSearchTerm}
                onChange={(e) => setCatalogSearchTerm(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-pink-500"
              />

              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-pink-400 uppercase">Época:</span>
                <select
                  value={selectedEraFilter}
                  onChange={(e) => setSelectedEraFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-md px-2 py-1 text-[11px]"
                >
                  <option value="Todas">Todas las Épocas</option>
                  <option value="Vintage (1959-1989)">Vintage (1959-89)</option>
                  <option value="Modern / Y2K (1990-2009)">Modern/Y2K (1990-09)</option>
                  <option value="Contemporánea (2010-Presente)">Contemporánea (2010+)</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-pink-400 font-bold text-xs animate-pulse">Cargando catálogo...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredMasterCatalog.map((barbie) => {
                  const isWishlisted = wishlist.some(item => item.id === barbie.id);
                  return (
                    <div key={barbie.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="h-40 bg-gray-950 p-2 flex items-center justify-center relative">
                          {barbie.image_url ? (
                            <img src={barbie.image_url} alt={barbie.name} className="max-h-full object-contain rounded-md" />
                          ) : (
                            <BarbieSilhouetteFallback />
                          )}
                          <span className="absolute top-1.5 right-1.5 bg-pink-950/90 text-pink-300 text-[8px] px-1.5 py-0.5 rounded font-bold">
                            {barbie.release_year}
                          </span>
                          <button 
                            onClick={() => toggleWishlist(barbie)}
                            className={`absolute top-1.5 left-1.5 p-1 rounded-full text-xs transition ${isWishlisted ? 'bg-pink-600 text-white' : 'bg-gray-900/80 text-gray-400'}`}
                          >
                            {isWishlisted ? '💖' : '🤍'}
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-[9px] text-pink-400 font-bold uppercase truncate">{barbie.collection_line}</p>
                          <h3 className="font-bold text-xs text-white leading-tight line-clamp-1">{barbie.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{barbie.lore}</p>
                        </div>
                      </div>

                      <div className="p-2 border-t border-gray-800/80 bg-gray-950 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-pink-400 font-extrabold text-xs">{barbie.estimated_min_price} €</span>
                          <button 
                            onClick={() => setComparePriceItem(barbie)}
                            className="bg-gray-800 text-[10px] px-1.5 py-0.5 rounded text-pink-300 font-bold"
                          >
                            🔍 Precios
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEditLore(barbie)}
                            className="bg-gray-800 text-gray-300 text-[10px] p-1 rounded font-bold w-1/3 flex justify-center"
                            title="Editar Historia"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => setActiveModal({ type: 'add_to_vitrina', barbie })}
                            className="bg-pink-600 text-white text-[10px] font-bold py-1 rounded w-2/3"
                          >
                            + Añadir
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB: MARKETPLACE */}
        {activeTab === 'sales' && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-base font-bold text-pink-500 mb-1">Anuncios de Venta</h2>
            <p className="text-[11px] text-gray-400 mb-4">Copia textos optimizados para Vinted, Wallapop y eBay.</p>

            {myCollection.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tienes muñecas en tu Vitrina para vender.</p>
            ) : (
              <div className="space-y-3">
                {myCollection.map((item) => (
                  <div key={item.userInstanceId} className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs">
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <p className="text-[10px] text-pink-400">{item.collection_line} ({item.release_year})</p>

                    <button 
                      onClick={() => navigator.clipboard.writeText(`Barbie ${item.name} (${item.release_year}) - Estado: ${item.condition}. ${item.lore}`)}
                      className="mt-2 w-full bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold py-1.5 rounded transition"
                    >
                      📋 Copiar Texto de Anuncio
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB: COMUNIDAD */}
        {activeTab === 'community' && (
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h2 className="text-base font-bold text-pink-500 mb-1">Coleccionistas Beta</h2>
            <p className="text-[11px] text-gray-400 mb-4">Perfiles de curadores y colaboradores.</p>
            
            <div className="space-y-3">
              {betaTesters.map((tester) => (
                <div key={tester.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-950/80 border border-pink-500/40 rounded-full flex items-center justify-center text-lg">
                    {tester.avatar}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-pink-400 text-xs">{tester.handle}</h3>
                    <p className="text-[10px] text-gray-300">{tester.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* NAVEGACIÓN INFERIOR FIJA */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 z-50 backdrop-blur-lg px-2 py-1.5">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('vitrina')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${activeTab === 'vitrina' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <span className="text-base">💎</span>
            <span>Vitrina</span>
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${activeTab === 'scan' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <span className="text-base">📷</span>
            <span>Escáner</span>
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${activeTab === 'catalog' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <span className="text-base">📖</span>
            <span>Catálogo</span>
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${activeTab === 'sales' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <span className="text-base">🏷️</span>
            <span>Ventas</span>
          </button>
          <button 
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${activeTab === 'community' ? 'text-pink-500' : 'text-gray-400'}`}
          >
            <span className="text-base">👥</span>
            <span>Red</span>
          </button>
        </div>
      </nav>

      {/* MODAL: EDITAR HISTORIA / LORE (ADMIN) */}
      {editingLoreItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-sm w-full">
            <h3 className="text-sm font-bold text-pink-500 mb-1">Editar Historia de Barbie</h3>
            <p className="text-[10px] text-gray-400 mb-3">{editingLoreItem.name}</p>

            <form onSubmit={handleSaveAdminLore} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Línea de Colección:</label>
                <input
                  type="text"
                  value={adminLoreForm.collection_line}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, collection_line: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Año de Lanzamiento:</label>
                <input
                  type="number"
                  value={adminLoreForm.release_year}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, release_year: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Historia / Lore Permanente:</label>
                <textarea
                  rows="5"
                  value={adminLoreForm.lore}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, lore: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingLoreItem(null)}
                  className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded font-bold text-xs"
                >
                  Guardar Permanente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRECIOS MULTISITIO */}
      {comparePriceItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-xs w-full relative">
            <button 
              onClick={() => setComparePriceItem(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-pink-500 mb-1">Precios en Mercado</h3>
            <p className="text-[11px] text-gray-400 mb-3">{comparePriceItem.name}</p>

            <div className="space-y-1.5 text-xs">
              {Object.entries(getMarketSearchUrls(comparePriceItem.name)).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800 text-[11px] font-bold text-white uppercase hover:border-pink-500/50"
                >
                  <span>{platform}</span>
                  <span className="text-pink-400">Buscar ➔</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPARTIR EN REDES */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-xs w-full relative">
            <button 
              onClick={() => setShowShareModal(false)}
              className="absolute top-2 right-2 text-gray-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
            <h3 className="text-sm font-bold text-pink-500 mb-1">Compartir Vitrina</h3>
            <p className="text-[11px] text-gray-400 mb-3">Publica tu colección en redes sociales.</p>

            <div className="space-y-2 text-xs">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-green-950/60 border border-green-800 p-2 rounded text-[11px] font-bold text-green-300"
              >
                <span>WhatsApp</span>
                <span>Enviar ➔</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-sky-950/60 border border-sky-800 p-2 rounded text-[11px] font-bold text-sky-300"
              >
                <span>X (Twitter)</span>
                <span>Postear ➔</span>
              </a>

              <button
                onClick={handleCopyShareLink}
                className="w-full text-center bg-gray-800 border border-gray-700 p-2 rounded text-[11px] font-bold text-gray-200 mt-1"
              >
                {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace Directo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR REGISTRO */}
      {activeModal?.type === 'add_to_vitrina' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-xs w-full">
            <h3 className="text-sm font-bold text-pink-500 mb-1">Añadir a Mi Vitrina</h3>
            <p className="text-[10px] text-gray-400 mb-3">{activeModal.barbie.name}</p>

            <form onSubmit={handleAddToMyVitrina} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Estado:</label>
                <select
                  value={userBarbieForm.condition}
                  onChange={(e) => setUserBarbieForm({ ...userBarbieForm, condition: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5"
                >
                  <option value="NFRB (Caja Original Precintada)">NFRB (Caja Precintada)</option>
                  <option value="MIB (En Caja Excelente)">MIB (En Caja Excelente)</option>
                  <option value="Loose (Fuera de Caja con Accesorios)">Loose (Con Accesorios)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 text-white px-3 py-1.5 rounded font-bold"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}