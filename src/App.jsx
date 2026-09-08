import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DEFAULT_BARBIE_SILHOUETTE = 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&q=80&w=600';

// Función de respaldo por si el campo 'lore' está vacío en la base de datos
function getBarbieLore(name, line, year) {
  return `Edición oficial de Mattel lanzada en ${year || 'año no especificado'}. Formó parte de la línea ${line || 'Colección General'}, siendo un elemento muy valorado por coleccionistas por su acabado detallado e impacto cultural.`;
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
  const [activeTab, setActiveTab] = useState('catalog'); // 'vitrina', 'scan', 'catalog', 'best_price'

  // Datos
  const [masterCatalog, setMasterCatalog] = useState([]);
  const [myCollection, setMyCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Filtros del Catálogo
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [selectedEraFilter, setSelectedEraFilter] = useState('Todas');

  // Modal y Formularios
  const [activeModal, setActiveModal] = useState(null);
  const [editingLoreItem, setEditingLoreItem] = useState(null);
  const [adminLoreForm, setAdminLoreForm] = useState({ lore: '', collection_line: '', release_year: '' });
  const [userBarbieForm, setUserBarbieForm] = useState({
    quantity: 1,
    condition: 'NFRB (Caja Original Precintada)',
    customPrice: '',
    serialNumber: '',
    notes: ''
  });

  // Estado del Escáner
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedImageBase64, setScannedImageBase64] = useState(null);
  const [debugError, setDebugError] = useState(null);

  // Moneda
  const [currency, setCurrency] = useState('EUR');
  const exchangeRateUSD = 1.08;

  useEffect(() => {
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

  // 1. CARGA DEL CATÁLOGO MAESTRO (PRIORIDAD ABSOLUTA AL LORE DE SUPABASE)
  async function fetchMasterCatalog() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('barbies_master')
        .select('*')
        .order('release_year', { ascending: true });

      if (error) throw error;

      const catalog = (data || []).map((item) => {
        const estimatedPrice = calculateDynamicPrice(item);
        
        // REGLA DE ORO: Si Supabase tiene datos en la columna 'lore', SE USAN ESOS.
        const loreText = (item.lore && item.lore.trim() !== '') 
          ? item.lore 
          : getBarbieLore(item.name, item.collection_line, item.release_year);

        const cleanImageUrl = (!item.image_url || item.image_url.includes('unsplash')) 
          ? DEFAULT_BARBIE_SILHOUETTE 
          : item.image_url;

        return { 
          ...item, 
          image_url: cleanImageUrl, 
          estimated_min_price: estimatedPrice, 
          lore: loreText 
        };
      });

      setMasterCatalog(catalog);
    } catch (e) {
      console.error("Error al cargar el catálogo:", e);
    } finally {
      setLoading(false);
    }
  }

  // 2. CARGA DE LA VITRINA DEL USUARIO
  async function fetchUserData(userId) {
    try {
      const { data: colData } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', userId);

      if (colData) {
        setMyCollection(colData.map(item => ({
          ...item,
          userInstanceId: item.id,
          lore: item.lore || getBarbieLore(item.name, item.collection_line, item.release_year),
          image_url: (!item.image_url || item.image_url.includes('unsplash')) ? DEFAULT_BARBIE_SILHOUETTE : item.image_url
        })));
      }

      const { data: wishData } = await supabase
        .from('user_wishlists')
        .select('barbie_master_id')
        .eq('user_id', userId);

      if (wishData) setWishlist(wishData.map(w => w.barbie_master_id));
    } catch (e) {
      console.error("Error al cargar datos del usuario:", e);
    }
  }

  // 3. EDITAR Y GUARDAR HISTORIA (ADMIN PERMANENTE EN SUPABASE)
  const handleOpenEditLore = (barbie) => {
    setEditingLoreItem(barbie);
    setAdminLoreForm({
      lore: barbie.lore || '',
      collection_line: barbie.collection_line || '',
      release_year: barbie.release_year || ''
    });
  };

  const handleSaveAdminLore = async (e) => {
    e.preventDefault();
    if (!editingLoreItem) return;

    const updatedLore = adminLoreForm.lore;
    const updatedLine = adminLoreForm.collection_line;
    const updatedYear = Number(adminLoreForm.release_year);

    // Guardar en user_collections si es un objeto de la vitrina
    if (editingLoreItem.userInstanceId) {
      await supabase
        .from('user_collections')
        .update({ 
          lore: updatedLore, 
          notes: `[HISTORIA OFICIAL]: ${updatedLore}`, 
          collection_line: updatedLine, 
          release_year: updatedYear 
        })
        .eq('id', editingLoreItem.userInstanceId);

      setMyCollection(prev => prev.map(item => 
        item.userInstanceId === editingLoreItem.userInstanceId 
          ? { ...item, lore: updatedLore, collection_line: updatedLine, release_year: updatedYear }
          : item
      ));
    }

    // Guardar en barbies_master (Catálogo Maestro Global)
    if (editingLoreItem.id) {
      await supabase
        .from('barbies_master')
        .update({ 
          lore: updatedLore, 
          collection_line: updatedLine, 
          release_year: updatedYear 
        })
        .eq('id', editingLoreItem.id);

      setMasterCatalog(prev => prev.map(item => 
        item.id === editingLoreItem.id 
          ? { ...item, lore: updatedLore, collection_line: updatedLine, release_year: updatedYear }
          : item
      ));
    }

    setEditingLoreItem(null);
  };

  // 4. AGREGAR DE CATÁLOGO A MI VITRINA (TRASLADA HISTORIA EXACTA)
  const handleAddToMyVitrina = async (e) => {
    e.preventDefault();
    if (!activeModal?.barbie || !session) return;

    const barbieSource = activeModal.barbie;
    const finalLore = (barbieSource.lore && barbieSource.lore.trim() !== '')
      ? barbieSource.lore
      : getBarbieLore(barbieSource.name, barbieSource.collection_line, barbieSource.release_year);

    let finalPriceInEUR = barbieSource.estimated_min_price || calculateDynamicPrice(barbieSource);
    if (userBarbieForm.customPrice) {
      const parsedCustom = parseFloat(userBarbieForm.customPrice);
      finalPriceInEUR = currency === 'USD' ? parsedCustom / exchangeRateUSD : parsedCustom;
    }

    const payload = {
      user_id: session.user.id,
      barbie_master_id: barbieSource.id || null,
      name: barbieSource.name,
      collection_line: barbieSource.collection_line,
      release_year: Number(barbieSource.release_year),
      estimated_min_price: Number(finalPriceInEUR),
      image_url: barbieSource.image_url || DEFAULT_BARBIE_SILHOUETTE,
      quantity: Math.max(1, Number(userBarbieForm.quantity || 1)),
      condition: userBarbieForm.condition,
      serial_number: userBarbieForm.serialNumber || 'Sin registrar',
      lore: finalLore,
      notes: userBarbieForm.notes 
        ? `${userBarbieForm.notes}\n\n[HISTORIA OFICIAL]: ${finalLore}` 
        : `[HISTORIA OFICIAL]: ${finalLore}`
    };

    const { error } = await supabase.from('user_collections').insert([payload]);
    if (!error) {
      fetchUserData(session.user.id);
      setActiveModal(null);
      setUserBarbieForm({ quantity: 1, condition: 'NFRB (Caja Original Precintada)', customPrice: '', serialNumber: '', notes: '' });
    } else {
      console.error("Error al añadir a la vitrina:", error);
    }
  };

  // 5. ESCÁNER DE IMAGEN IA CON GEMINI-3.6-FLASH
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
            setDebugError(`Error al interpretar respuesta de la IA: ${rawText}`);
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

  // FILTRADO DEL CATÁLOGO POR BÚSQUEDA Y ÉPOCAS
  const filteredMasterCatalog = masterCatalog.filter((barbie) => {
    const matchesSearch = 
      barbie.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      (barbie.collection_line && barbie.collection_line.toLowerCase().includes(catalogSearchTerm.toLowerCase()));

    const year = Number(barbie.release_year);
    let matchesEra = true;

    if (selectedEraFilter === 'Vintage (1959-1989)') {
      matchesEra = year >= 1959 && year <= 1989;
    } else if (selectedEraFilter === 'Modern / Y2K (1990-2009)') {
      matchesEra = year >= 1990 && year <= 2009;
    } else if (selectedEraFilter === 'Contemporánea (2010-Presente)') {
      matchesEra = year >= 2010;
    }

    return matchesSearch && matchesEra;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-12">
      {/* HEADER PRINCIPAL */}
      <header className="bg-gray-900 border-b border-pink-900/40 p-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-pink-600 text-white font-black rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-lg shadow-pink-600/30">
              V
            </div>
            <div>
              <h1 className="text-xl font-black text-pink-500 tracking-wide">
                LA VITRINA <span className="text-white text-xs font-normal">DEL COLECCIONISTA DE BARBIE</span>
              </h1>
              <p className="text-xs text-gray-400">BARBIE COLLECTION & APP • CATÁLOGO Y GESTIÓN DE ACTIVOS</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
              className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full text-xs font-bold text-pink-400 hover:bg-gray-700 transition"
            >
              🌐 {currency === 'EUR' ? 'ES | € EUR' : 'US | $ USD'}
            </button>
          </div>
        </div>
      </header>

      {/* NAVEGACIÓN PRINCIPAL */}
      <nav className="bg-gray-900/80 border-b border-gray-800 py-3 sticky top-[73px] z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-center gap-2 px-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('vitrina')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${activeTab === 'vitrina' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Mi Vitrina ({myCollection.length})
          </button>
          <button 
            onClick={() => setActiveTab('scan')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${activeTab === 'scan' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            📷 Captura de Barbie
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition ${activeTab === 'catalog' ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            Catálogo ({masterCatalog.length})
          </button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 mt-6">

        {/* TAB: CATÁLOGO MAESTRO */}
        {activeTab === 'catalog' && (
          <section>
            {/* CONTROLES DE FILTRADO */}
            <div className="bg-gray-900 p-4 rounded-xl mb-6 border border-pink-900/40 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
              <div className="w-full md:w-1/2">
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o línea de colección..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="w-full md:w-1/2 flex items-center justify-end gap-2">
                <label className="text-xs font-bold text-pink-400 whitespace-nowrap">Época:</label>
                <select
                  value={selectedEraFilter}
                  onChange={(e) => setSelectedEraFilter(e.target.value)}
                  className="w-full md:w-auto bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                >
                  <option value="Todas">Todas las Épocas</option>
                  <option value="Vintage (1959-1989)">Vintage (1959 - 1989)</option>
                  <option value="Modern / Y2K (1990-2009)">Modern / Y2K (1990 - 2009)</option>
                  <option value="Contemporánea (2010-Presente)">Contemporánea (2010 - Presente)</option>
                </select>
              </div>
            </div>

            {/* GRILLA DE TARJETAS DEL CATÁLOGO */}
            {loading ? (
              <div className="text-center py-12 text-pink-400 font-bold animate-pulse">Cargando catálogo oficial...</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredMasterCatalog.map((barbie) => (
                  <div key={barbie.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-pink-500/50 transition flex flex-col justify-between">
                    <div>
                      <div className="h-64 bg-gray-950 p-4 flex items-center justify-center relative">
                        <img src={barbie.image_url} alt={barbie.name} className="max-h-full object-contain rounded-lg" />
                        <span className="absolute top-3 right-3 bg-pink-950/80 border border-pink-500/40 text-pink-300 text-xs px-2 py-1 rounded-md font-bold">
                          {barbie.release_year}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-pink-400 font-bold uppercase tracking-wider">{barbie.collection_line}</p>
                        <h3 className="font-bold text-lg text-white mt-1 leading-snug">{barbie.name}</h3>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-3">{barbie.lore}</p>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-800/80 bg-gray-900/50 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold">Valor Estimado</p>
                        <p className="text-pink-400 font-extrabold text-base">
                          {currency === 'EUR' ? `${barbie.estimated_min_price} €` : `${Math.round(barbie.estimated_min_price * exchangeRateUSD)} $`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenEditLore(barbie)}
                          className="bg-gray-800 hover:bg-gray-700 text-xs p-2 rounded-lg text-gray-300 font-bold transition"
                          title="Editar Historia como Admin"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => setActiveModal({ type: 'add_to_vitrina', barbie })}
                          className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-3 py-2 rounded-lg font-bold transition"
                        >
                          + Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB: ESCÁNER / CAPTURA */}
        {activeTab === 'scan' && (
          <section className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-extrabold text-pink-500 text-center mb-2">Escáner de Catalogación IA</h2>
            <p className="text-xs text-gray-400 text-center mb-6">Fotografía la Barbie o su caja para identificar modelo, época e historial de mercado con Gemini 3.6-flash.</p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 bg-gray-950">
              <label className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 py-3 rounded-xl cursor-pointer transition shadow-lg shadow-pink-600/30">
                📷 Tomar Foto / Abrir Cámara
                <input type="file" accept="image/*" capture="environment" onChange={handleScanImage} className="hidden" />
              </label>

              {scannedImageBase64 && (
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-400 mb-2">PREVISUALIZACIÓN:</p>
                  <img src={scannedImageBase64} alt="Captura" className="max-h-64 rounded-lg border border-gray-800 mx-auto" />
                </div>
              )}
            </div>

            {scanning && (
              <div className="mt-6 p-4 bg-gray-950 rounded-xl border border-pink-900/50 text-center text-pink-400 font-bold text-sm animate-pulse">
                Procesando imagen con Gemini 3.6-flash vía Serverless...
              </div>
            )}

            {debugError && (
              <div className="mt-6 p-4 bg-red-950/60 border border-red-800 text-red-300 rounded-xl text-xs font-mono">
                <strong>⚠️ DIAGNÓSTICO:</strong>
                <p className="mt-1">{debugError}</p>
              </div>
            )}

            {scanResult && scanResult.primary_match && (
              <div className="mt-6 bg-gray-950 border border-pink-600/40 rounded-xl p-5">
                <span className="bg-pink-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">Resultado Detectado</span>
                <h3 className="text-xl font-black text-white mt-2">{scanResult.primary_match.name}</h3>
                <p className="text-xs text-pink-400 font-bold">{scanResult.primary_match.collection_line} ({scanResult.primary_match.release_year})</p>
                <p className="text-xs text-gray-300 mt-3">{scanResult.primary_match.lore}</p>

                <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Valor Estimado de Mercado</p>
                    <p className="text-lg font-bold text-pink-400">{scanResult.primary_match.estimated_min_price} €</p>
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
                    className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition"
                  >
                    Guardar en Mi Vitrina
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB: MI VITRINA */}
        {activeTab === 'vitrina' && (
          <section>
            <h2 className="text-xl font-bold text-white mb-4">Mi Colección Personal ({myCollection.length})</h2>
            {myCollection.length === 0 ? (
              <div className="text-center py-12 bg-gray-900 rounded-2xl border border-gray-800 text-gray-400">
                Aún no tienes muñecas registradas en tu Vitrina. Añádelas desde el Catálogo o usa el Escáner.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {myCollection.map((item) => (
                  <div key={item.userInstanceId} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="h-64 bg-gray-950 p-4 flex items-center justify-center relative">
                        <img src={item.image_url} alt={item.name} className="max-h-full object-contain rounded-lg" />
                        <span className="absolute top-3 left-3 bg-gray-800 text-gray-300 text-[10px] px-2 py-1 rounded font-bold">
                          {item.condition}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-pink-400 font-bold uppercase">{item.collection_line}</p>
                        <h3 className="font-bold text-lg text-white mt-1">{item.name}</h3>
                        <p className="text-xs text-gray-400 mt-2 line-clamp-3">{item.lore}</p>
                      </div>
                    </div>
                    <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex justify-between items-center">
                      <p className="text-pink-400 font-bold">{item.estimated_min_price} €</p>
                      <button 
                        onClick={() => handleOpenEditLore(item)}
                        className="bg-gray-800 text-xs px-3 py-1.5 rounded-lg text-gray-300 font-bold hover:bg-gray-700"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </main>

      {/* MODAL: EDITAR HISTORIA ADMIN */}
      {editingLoreItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full">
            <h3 className="text-lg font-bold text-pink-500 mb-2">Editar Historia Oficial (Admin)</h3>
            <p className="text-xs text-gray-400 mb-4">{editingLoreItem.name}</p>

            <form onSubmit={handleSaveAdminLore} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Línea de Colección:</label>
                <input
                  type="text"
                  value={adminLoreForm.collection_line}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, collection_line: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Año de Lanzamiento:</label>
                <input
                  type="number"
                  value={adminLoreForm.release_year}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, release_year: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Historia / Lore Permanente:</label>
                <textarea
                  rows="5"
                  value={adminLoreForm.lore}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, lore: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingLoreItem(null)}
                  className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Guardar Permanente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AÑADIR A VITRINA */}
      {activeModal?.type === 'add_to_vitrina' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-pink-500 mb-1">Añadir a Mi Vitrina</h3>
            <p className="text-xs text-gray-400 mb-4">{activeModal.barbie.name}</p>

            <form onSubmit={handleAddToMyVitrina} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Estado de Conservación:</label>
                <select
                  value={userBarbieForm.condition}
                  onChange={(e) => setUserBarbieForm({ ...userBarbieForm, condition: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                >
                  <option value="NFRB (Caja Original Precintada)">NFRB (Caja Precintada)</option>
                  <option value="MIB (En Caja Excelente)">MIB (En Caja Excelente)</option>
                  <option value="Loose (Fuera de Caja con Accesorios)">Loose (Con Accesorios)</option>
                  <option value="Restaurada / Custom">Restaurada / Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Número de Serie (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej. MAT-1959-001"
                  value={userBarbieForm.serialNumber}
                  onChange={(e) => setUserBarbieForm({ ...userBarbieForm, serialNumber: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="bg-gray-800 text-gray-300 px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-sm font-bold"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}