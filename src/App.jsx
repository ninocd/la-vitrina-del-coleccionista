import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Silueta vectorial elegante por defecto si no hay imagen
const BarbieSilhouetteFallback = () => (
  <div className="w-full h-full bg-gradient-to-b from-gray-900 via-gray-950 to-pink-950/40 flex flex-col items-center justify-center p-2 rounded-lg border border-pink-900/20">
    <svg className="w-10 h-10 text-pink-500/30 mb-1" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
    </svg>
    <span className="text-[8px] text-pink-400/70 font-semibold tracking-widest uppercase text-center">Sin imagen</span>
  </div>
);

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

  // Estado Formulario de Autenticación
  const [authMode, setAuthMode] = useState('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [authMsg, setAuthMsg] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Estado Cambio de Contraseña de Usuario
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState({ error: null, success: null, loading: false });

  // Datos
  const [masterCatalog, setMasterCatalog] = useState([]);
  const [myCollection, setMyCollection] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Interfaz móvil / pública / scroll
  const [showMobileMetrics, setShowMobileMetrics] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // INSPECTOR DE VITRINA Y ESTADO DE PUERTAS CON ZOOM INTERACTIVO
  const [showVitrinaDoorsModal, setShowVitrinaDoorsModal] = useState(false);
  const [doorsOpened, setDoorsOpened] = useState(false);
  const [selectedVitrinaDoll, setSelectedVitrinaDoll] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Perfiles de Coleccionistas Reales
  const betaTesters = [
    { id: 1, handle: "@chicledefresadolls", role: "Especialista en Fotografía & Curaduría", badge: "Verified Collector", avatar: "✦" },
    { id: 2, handle: "@barbiedecoleccionenespanol", role: "Historiador de Lore & Ediciones Vintage", badge: "Vintage Archivist", avatar: "✧" },
    { id: 3, handle: "@pm_collectibles", role: "Analista de Mercado & NFRB/MIB", badge: "Market Specialist", avatar: "❖" }
  ];

  // Filtros de Búsqueda
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
  const [vitrinaSearchTerm, setVitrinaSearchTerm] = useState('');
  const [selectedEraFilter, setSelectedEraFilter] = useState('Todas');

  // Modales y Formularios
  const [editingLoreItem, setEditingLoreItem] = useState(null);
  const [editingPriceItem, setEditingPriceItem] = useState(null);
  const [newPriceValue, setNewPriceValue] = useState('');
  const [comparePriceItem, setComparePriceItem] = useState(null);
  const [adminLoreForm, setAdminLoreForm] = useState({ name: '', lore: '', collection_line: '', release_year: '' });
  const [activeModal, setActiveModal] = useState(null);
  const [userBarbieForm, setUserBarbieForm] = useState({
    quantity: 1,
    condition: 'NFRB (Caja Original Precintada)'
  });

  // Escáner IA
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scannedImageBase64, setScannedImageBase64] = useState(null);
  const [debugError, setDebugError] = useState(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Moneda
  const [currency, setCurrency] = useState('EUR');
  const exchangeRateUSD = 1.08;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchData(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchData(session.user.id);
      } else {
        setMyCollection([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchData(userId) {
    setLoading(true);
    try {
      if (!supabase) return;

      const { data: masterData, error: masterErr } = await supabase
        .from('barbies_master')
        .select('*')
        .order('release_year', { ascending: true });

      if (masterErr) console.error("Error cargando barbies_master:", masterErr);

      const catalogMap = {};
      const catalog = (masterData || []).map((item) => {
        const estimatedPrice = item.estimated_min_price ?? calculateDynamicPrice(item);
        const loreText = (item.lore && item.lore.trim() !== '') 
          ? item.lore 
          : getBarbieLoreFallback(item.name, item.collection_line, item.release_year);

        const validImage = (item.image_url && !item.image_url.includes('unsplash')) ? item.image_url : null;

        const processed = { 
          ...item, 
          image_url: validImage,
          estimated_min_price: estimatedPrice, 
          lore: loreText 
        };

        catalogMap[item.id] = processed;
        return processed;
      });

      setMasterCatalog(catalog);

      const currentUserId = userId || session?.user?.id;
      if (!currentUserId) {
        setMyCollection([]);
        return;
      }

      const { data: colData, error: colErr } = await supabase
        .from('user_collection')
        .select('*')
        .eq('user_id', currentUserId);

      if (colErr) console.error("Error cargando user_collection:", colErr);

      if (colData) {
        const userItems = colData.map(item => {
          const matchedMaster = catalogMap[item.barbie_id] || {};
          return {
            ...matchedMaster,
            ...item,
            userInstanceId: item.id,
            name: matchedMaster.name || item.name || 'Barbie Colección',
            collection_line: matchedMaster.collection_line || item.collection_line || 'Mattel',
            release_year: matchedMaster.release_year || item.release_year || 2000,
            estimated_min_price: matchedMaster.estimated_min_price || item.estimated_min_price || 35,
            lore: matchedMaster.lore || item.lore || getBarbieLoreFallback(matchedMaster.name, matchedMaster.collection_line, matchedMaster.release_year),
            image_url: matchedMaster.image_url || item.image_url || null,
            condition: item.condition || 'NIB'
          };
        });

        setMyCollection(userItems);
      }
    } catch (e) {
      console.error("Error general en fetchData:", e);
    } finally {
      setLoading(false);
    }
  }

  // MANEJO DE CAMBIO DE CONTRASEÑA EN SUPABASE
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordStatus({ error: null, success: null, loading: true });

    if (newPassword.length < 6) {
      setPasswordStatus({ error: "La contraseña debe tener al menos 6 caracteres.", success: null, loading: false });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: "Las contraseñas no coinciden.", success: null, loading: false });
      return;
    }

    if (!supabase) {
      setPasswordStatus({ error: "Supabase no está disponible.", success: null, loading: false });
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordStatus({ error: `Error: ${error.message}`, success: null, loading: false });
    } else {
      setPasswordStatus({ error: null, success: "¡Contraseña actualizada con éxito!", loading: false });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ error: null, success: null, loading: false });
      }, 2000);
    }
  };

  // LOG IN / REGISTRO
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError("Supabase no está configurado correctamente.");
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);
    setAuthMsg('');

    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        setAuthError("Correo o contraseña incorrectos.");
        setAuthSubmitting(false);
      } else {
        setAuthSubmitting(false);
        setAuthEmail('');
        setAuthPassword('');
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
      });

      if (error) {
        setAuthError(`Error en registro: ${error.message}`);
        setAuthSubmitting(false);
      } else {
        setAuthSubmitting(false);
        if (data?.user?.identities?.length === 0) {
          setAuthError("Este correo ya está registrado. Por favor, inicia sesión.");
        } else {
          setAuthMsg("¡Cuenta creada correctamente! Ya puedes iniciar sesión.");
          setAuthMode('login');
          setAuthPassword('');
        }
      }
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setMyCollection([]);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleOpenVitrinaDoll = (barbie) => {
    setSelectedVitrinaDoll(barbie);
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
    setDoorsOpened(false);
    setShowVitrinaDoorsModal(true);
    setTimeout(() => {
      setDoorsOpened(true);
    }, 150);
  };

  const handleCloseVitrinaDoll = () => {
    setDoorsOpened(false);
    setTimeout(() => {
      setShowVitrinaDoorsModal(false);
      setSelectedVitrinaDoll(null);
      setZoomScale(1);
      setZoomPosition({ x: 0, y: 0 });
    }, 450);
  };

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.5, 3));
  const handleZoomOut = () => {
    setZoomScale(prev => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setZoomPosition({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoomScale(1);
    setZoomPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - zoomPosition.x, y: e.clientY - zoomPosition.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    setZoomPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleOpenEditLore = (barbie) => {
    setEditingLoreItem(barbie);
    setAdminLoreForm({
      name: barbie.name || '',
      lore: barbie.lore || '',
      collection_line: barbie.collection_line || '',
      release_year: barbie.release_year || ''
    });
  };

  const handleSaveAdminLore = async (e) => {
    e.preventDefault();
    if (!editingLoreItem) return;

    const updatedName = adminLoreForm.name.trim();
    const updatedLore = adminLoreForm.lore;
    const updatedLine = adminLoreForm.collection_line;
    const updatedYear = Number(adminLoreForm.release_year);

    const masterId = editingLoreItem.barbie_id || editingLoreItem.barbie_master_id || editingLoreItem.id;

    if (masterId && supabase) {
      const { error: masterErr } = await supabase
        .from('barbies_master')
        .update({ 
          name: updatedName,
          lore: updatedLore, 
          collection_line: updatedLine, 
          release_year: updatedYear 
        })
        .eq('id', masterId);

      if (masterErr) console.error("Error al actualizar barbies_master:", masterErr);
    }

    await fetchData(session?.user?.id);
    setEditingLoreItem(null);
  };

  const handleOpenEditPrice = (barbie) => {
    setEditingPriceItem(barbie);
    setNewPriceValue(barbie.estimated_min_price || '');
  };

  const handleSavePrice = async (e) => {
    e.preventDefault();
    if (!editingPriceItem) return;

    const priceNum = Number(newPriceValue);
    if (isNaN(priceNum) || priceNum < 0) {
      alert("Por favor introduce un precio válido.");
      return;
    }

    const masterId = editingPriceItem.barbie_id || editingPriceItem.id;

    if (masterId && supabase) {
      const { error } = await supabase
        .from('barbies_master')
        .update({ estimated_min_price: priceNum })
        .eq('id', masterId);

      if (error) {
        console.error("Error al actualizar precio en Supabase:", error);
        alert(`Error al guardar el precio: ${error.message}`);
      }
    }

    await fetchData(session?.user?.id);
    setEditingPriceItem(null);
    setNewPriceValue('');
  };

  const handleDeleteFromVitrina = async (userInstanceId) => {
    if (!window.confirm("¿Seguro que deseas quitar esta Barbie de tu vitrina?")) return;

    if (supabase) {
      const { error } = await supabase
        .from('user_collection')
        .delete()
        .eq('id', userInstanceId);

      if (error) {
        console.error("Error al eliminar de user_collection:", error);
        alert(`Error al eliminar: ${error.message}`);
        return;
      }
    }

    setMyCollection(prev => prev.filter(item => item.userInstanceId !== userInstanceId));
  };

  const handleDeleteFromCatalog = async (masterId) => {
    if (!window.confirm("¿Seguro que deseas borrar esta Barbie del Catálogo Maestro?")) return;

    setMasterCatalog(prev => prev.filter(item => item.id !== masterId));
    setMyCollection(prev => prev.filter(item => item.barbie_id !== masterId));

    if (supabase) {
      try {
        await supabase
          .from('user_collection')
          .delete()
          .eq('barbie_id', masterId);

        const { error: masterErr } = await supabase
          .from('barbies_master')
          .delete()
          .eq('id', masterId);

        if (masterErr) {
          console.error("Error directo de Supabase:", masterErr);
          alert(`Aviso de Supabase: ${masterErr.message}.`);
          await fetchData(session?.user?.id);
        }
      } catch (err) {
        console.error("Excepción en borrado:", err);
        await fetchData(session?.user?.id);
      }
    }
  };

  const handleSaveDirectToCatalog = async () => {
    if (!scanResult?.primary_match) return;

    const match = scanResult.primary_match;

    const payloadMaster = {
      name: match.name || 'Barbie Desconocida',
      collection_line: match.collection_line || 'Edición Especial',
      release_year: Number(match.release_year) || new Date().getFullYear(),
      lore: match.lore || match.description || getBarbieLoreFallback(match.name, match.collection_line, match.release_year),
      estimated_min_price: Number(match.estimated_min_price) || 35,
      image_url: scannedImageBase64 || null
    };

    if (supabase) {
      const { error } = await supabase.from('barbies_master').insert([payloadMaster]);
      if (error) {
        console.error("Error al guardar en barbies_master:", error);
        setDebugError(`Error guardando en catálogo: ${error.message}`);
        return;
      }
    } else {
      setMasterCatalog(prev => [...prev, { ...payloadMaster, id: Date.now() }]);
    }

    await fetchData(session?.user?.id);
    setScanResult(null);
    setScannedImageBase64(null);
    setSaveSuccessMsg('¡Barbie guardada con éxito en el Catálogo Maestro!');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
    setActiveTab('catalog');
  };

  const handleAddToMyVitrina = async (e) => {
    e.preventDefault();
    if (!activeModal?.barbie) return;

    const barbieSource = activeModal.barbie;
    const condClean = userBarbieForm.condition ? userBarbieForm.condition.split(' ')[0] : 'NIB';

    if (supabase && session?.user?.id) {
      const payload = {
        user_id: session.user.id,
        barbie_id: barbieSource.id,
        quantity: Math.max(1, Number(userBarbieForm.quantity || 1)),
        condition: condClean
      };

      const { error } = await supabase.from('user_collection').insert([payload]);

      if (error) {
        console.error("Error al insertar en user_collection:", error);
        alert(`No se pudo añadir a la vitrina: ${error.message}`);
        return;
      } else {
        await fetchData(session.user.id);
      }
    } else {
      setMyCollection(prev => [...prev, { ...barbieSource, userInstanceId: Date.now(), quantity: 1, condition: condClean }]);
    }

    setActiveModal(null);
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
        const MAX_DIMENSION = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const fullBase64 = canvas.toDataURL('image/jpeg', 0.5);
        setScannedImageBase64(fullBase64);
        const base64Data = fullBase64.split(',')[1];

        const promptInstruction = `Identifica la Barbie que aparece en esta foto para un catálogo oficial.
Devuelve EXCLUSIVAMENTE un JSON válido con esta estructura:
{
  "primary_match": {
    "name": "Nombre completo del modelo o personaje",
    "collection_line": "Línea oficial o temática de Mattel",
    "release_year": 2000,
    "estimated_min_price": 45,
    "lore": "Redacta una historia rica e informativa estructurada para coleccionistas. Incluye: 1) Detalles del vestuario y paleta de colores. 2) Concepto estético o inspiración. 3) Molde facial/escultura de rostro usado y estética de maquillaje. 4) Accesorios y extras incluidos."
  }
}`;

        const response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64Data, 
            mimeType: 'image/jpeg',
            prompt: promptInstruction
          })
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
    const userId = session?.user?.id || 'default-user';
    return `${window.location.origin}/?vitrina=${userId}`;
  };

  const getShareText = () => {
    return `Te invito a explorar mi colección oficial de Barbie en La Vitrina.\n\n` +
      `✦ Piezas catalogadas: ${myCollection.length}\n` +
      `✦ Valor estimado: ${totalCollectionValueEUR.toLocaleString()} €\n\n` +
      `Ver colección: ${getPublicVitrinaUrl()}`;
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(getPublicVitrinaUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const filteredMyCollection = myCollection.filter((barbie) => {
    const nameMatch = (barbie.name || '').toLowerCase().includes(vitrinaSearchTerm.toLowerCase());
    const lineMatch = (barbie.collection_line || '').toLowerCase().includes(vitrinaSearchTerm.toLowerCase());
    return nameMatch || lineMatch;
  });

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

  // PANTALLA DE LOG IN / REGISTRO SI NO HAY SESIÓN
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 font-sans flex flex-col justify-center items-center px-4">
        <div className="max-w-sm w-full bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-600 via-pink-500 to-pink-700"></div>

          <div className="text-center mb-6">
            <div className="bg-gradient-to-tr from-pink-700 to-pink-500 text-white font-black rounded-xl w-12 h-12 flex items-center justify-center text-xl shadow-lg shadow-pink-600/30 mx-auto mb-3">
              V
            </div>
            <h1 className="text-base font-black tracking-widest text-pink-500 uppercase">LA VITRINA</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 tracking-wider uppercase font-semibold">Plataforma de Coleccionismo</p>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-gray-950 p-1 rounded-xl mb-5 border border-gray-800/80">
            <button
              onClick={() => { setAuthMode('login'); setAuthError(null); setAuthMsg(''); }}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${authMode === 'login' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(null); setAuthMsg(''); }}
              className={`py-1.5 text-xs font-bold rounded-lg transition ${authMode === 'register' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Registrarse
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-800/80 text-red-300 text-xs rounded-xl font-medium">
              {authError}
            </div>
          )}

          {authMsg && (
            <div className="mb-4 p-3 bg-green-950/80 border border-green-800/80 text-green-300 text-xs rounded-xl font-medium">
              {authMsg}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Correo Electrónico:</label>
              <input
                type="email"
                placeholder="usuario@lavitrina.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-pink-500 transition"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Contraseña:</label>
              <input
                type="password"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-pink-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white text-xs font-bold py-3 rounded-xl transition shadow-lg shadow-pink-600/20 disabled:opacity-50 mt-2"
            >
              {authSubmitting 
                ? 'Procesando...' 
                : (authMode === 'login' ? 'Entrar a La Vitrina' : 'Crear Cuenta')}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-800 text-center">
            <p className="text-[10px] text-gray-500">Acceso seguro mediante Supabase Auth.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-24 pt-2 relative">
      
      {/* CABECERA MÓVIL */}
      <header className="bg-gray-900/90 border-b border-pink-900/30 px-3.5 py-2.5 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-pink-700 to-pink-500 text-white font-black rounded-lg w-8 h-8 flex items-center justify-center text-sm shadow-md shadow-pink-600/20">
              V
            </div>
            <div>
              <h1 className="text-xs font-black tracking-widest text-pink-500 uppercase leading-none">LA VITRINA</h1>
              <p className="text-[9px] text-gray-400 font-medium tracking-wide leading-none mt-0.5 truncate max-w-[110px]">
                {session?.user?.email?.split('@')[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowMobileMetrics(!showMobileMetrics)}
              className="bg-gray-800/80 border border-gray-700/80 text-pink-400 text-[11px] px-2 py-1 rounded-lg font-bold flex items-center gap-1 transition hover:bg-gray-800"
            >
              <span className="text-gray-400 font-normal">Valor:</span> {currency === 'EUR' ? `${totalCollectionValueEUR.toLocaleString()} €` : `${Math.round(totalCollectionValueEUR * exchangeRateUSD).toLocaleString()} $`}
            </button>

            {/* BOTÓN CAMBIAR CONTRASEÑA */}
            <button
              onClick={() => setShowPasswordModal(true)}
              className="bg-gray-800/80 border border-gray-700/80 text-yellow-400 hover:text-yellow-300 text-xs p-1.5 rounded-lg transition"
              title="Cambiar Contraseña"
            >
              🔑
            </button>

            <button
              onClick={handleLogout}
              className="bg-gray-800/80 border border-gray-700/80 text-gray-400 hover:text-red-400 text-xs px-2 py-1 rounded-lg transition font-bold flex items-center gap-1"
              title="Cerrar Sesión"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </div>

        {showMobileMetrics && (
          <div className="mt-2 pt-2 border-t border-gray-800 grid grid-cols-3 gap-2 text-center text-xs animate-fadeIn">
            <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Valor Estimado</p>
              <p className="font-extrabold text-pink-400 mt-0.5">
                {currency === 'EUR' ? `${totalCollectionValueEUR.toLocaleString()} €` : `${Math.round(totalCollectionValueEUR * exchangeRateUSD).toLocaleString()} $`}
              </p>
            </div>
            <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">En Vitrina</p>
              <p className="font-extrabold text-white mt-0.5">{myCollection.length} uds.</p>
            </div>
            <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
              <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Deseadas</p>
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
            <div className="sticky top-12 z-30 bg-gray-900/95 backdrop-blur-md p-2 rounded-xl mb-3 border border-pink-900/30 flex items-center gap-2 shadow-lg">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Filtrar en mi Vitrina..."
                  value={vitrinaSearchTerm}
                  onChange={(e) => setVitrinaSearchTerm(e.target.value)}
                  className="w-full bg-gray-800/90 border border-gray-700/80 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-pink-500/80"
                />
                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button 
                onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
                className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-pink-400 px-2.5 py-1.5 rounded-lg font-bold shrink-0 transition"
              >
                {currency === 'EUR' ? '€ EUR' : '$ USD'}
              </button>
            </div>

            {filteredMyCollection.length === 0 ? (
              <div className="text-center py-12 bg-gray-900/60 rounded-xl border border-gray-800/80 text-gray-400 text-xs px-4">
                {vitrinaSearchTerm ? 'No se encontraron coincidencias en tu vitrina.' : 'Aún no tienes muñecas en tu Vitrina. Explora el Catálogo Maestro para añadirlas.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMyCollection.map((item) => (
                  <div key={item.userInstanceId || item.id} className="bg-gray-900/90 border border-gray-800/90 rounded-xl overflow-hidden flex flex-col justify-between group relative">
                    <div>
                      <div 
                        onClick={() => handleOpenVitrinaDoll(item)}
                        className="h-44 bg-white p-2 flex items-center justify-center relative cursor-pointer overflow-hidden border-b border-gray-800/80"
                        style={{ perspective: '600px' }}
                      >
                        <div className="absolute top-0 w-24 h-24 bg-pink-500/10 rounded-full blur-lg pointer-events-none"></div>

                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="max-h-full object-contain rounded-md transition duration-500 group-hover:scale-105 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] z-10" />
                        ) : (
                          <BarbieSilhouetteFallback />
                        )}

                        <div className="absolute bottom-2 w-3/4 h-1 bg-gradient-to-r from-transparent via-pink-400/30 to-transparent rounded-full blur-[1px]"></div>

                        <div 
                          className="absolute top-0 left-0 w-1/2 h-full bg-pink-400/10 border-r border-gray-300/40 backdrop-blur-[1px] transition-transform duration-500 ease-in-out origin-left flex items-center justify-end pr-1 pointer-events-none z-20 group-hover:-rotate-y-100"
                          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                        >
                          <div className="w-1 h-8 bg-gray-400/50 rounded-full shadow"></div>
                        </div>

                        <div 
                          className="absolute top-0 right-0 w-1/2 h-full bg-pink-400/10 border-l border-gray-300/40 backdrop-blur-[1px] transition-transform duration-500 ease-in-out origin-right flex items-center justify-start pl-1 pointer-events-none z-20 group-hover:rotate-y-100"
                          style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
                        >
                          <div className="w-1 h-8 bg-gray-400/50 rounded-full shadow"></div>
                        </div>

                        <span className="absolute top-1.5 left-1.5 bg-gray-900/90 text-gray-300 text-[8px] px-1.5 py-0.5 rounded font-bold z-30 tracking-wider">
                          {item.condition || 'NIB'}
                        </span>
                      </div>

                      <div className="p-2.5">
                        <p className="text-[9px] text-pink-400 font-bold uppercase truncate tracking-wider">{item.collection_line}</p>
                        <h3 
                          onClick={() => handleOpenVitrinaDoll(item)}
                          className="font-bold text-xs text-white leading-tight line-clamp-1 cursor-pointer hover:text-pink-400 transition"
                        >
                          {item.name}
                        </h3>
                        <p 
                          onClick={() => handleOpenVitrinaDoll(item)}
                          className="text-[10px] text-gray-400 mt-1 line-clamp-2 cursor-pointer hover:text-gray-200"
                        >
                          {item.lore}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-2 border-t border-gray-800/80 bg-gray-950/80 flex items-center justify-between">
                      <span className="text-pink-400 font-extrabold text-xs">{item.estimated_min_price} €</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleOpenEditPrice(item)}
                          className="bg-gray-800 text-yellow-400 text-[10px] p-1.5 rounded hover:bg-gray-700 transition"
                          title="Cambiar Precio"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleOpenEditLore(item)}
                          className="bg-gray-800 text-gray-300 text-[10px] p-1.5 rounded hover:bg-gray-700 transition"
                          title="Editar Nombre e Historia"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteFromVitrina(item.userInstanceId)}
                          className="bg-red-950/60 text-red-400 border border-red-900/50 text-[10px] p-1.5 rounded hover:bg-red-900/80 transition"
                          title="Eliminar de Mi Vitrina"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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
          <section className="max-w-md mx-auto bg-gray-900/90 border border-gray-800 rounded-xl p-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-pink-500 tracking-wider uppercase text-center mb-1">Escáner de Catalogación IA</h2>
            <p className="text-[11px] text-gray-400 text-center mb-4">Fotografía la Barbie para encuadrarla, identificarla y registrarla automáticamente.</p>

            {saveSuccessMsg && (
              <div className="mb-3 p-2 bg-green-950/80 border border-green-600 text-green-300 text-xs text-center rounded-lg font-bold">
                {saveSuccessMsg}
              </div>
            )}

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700/80 rounded-xl p-5 bg-gray-950">
              <label className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-500 hover:to-pink-400 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer transition shadow-lg shadow-pink-600/20 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Tomar Foto con la Cámara
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleScanImage} 
                  className="hidden" 
                />
              </label>

              {scannedImageBase64 && (
                <div className="mt-3 text-center">
                  <p className="text-[9px] text-gray-400 mb-1 font-bold">Vista previa:</p>
                  <img src={scannedImageBase64} alt="Captura" className="max-h-48 rounded-lg border border-gray-800 mx-auto bg-white p-1 object-contain" />
                </div>
              )}
            </div>

            {scanning && (
              <div className="mt-4 p-3 bg-gray-950 rounded-lg border border-pink-900/40 text-center text-pink-400 font-bold text-xs animate-pulse">
                Identificando modelo y redactando historia documental...
              </div>
            )}

            {debugError && (
              <div className="mt-4 p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-[10px] font-mono">
                {debugError}
              </div>
            )}

            {scanResult && scanResult.primary_match && (
              <div className="mt-4 bg-gray-950 border border-pink-600/40 rounded-xl p-4">
                <span className="bg-pink-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">Identificada</span>
                <h3 className="text-sm font-black text-white mt-1">{scanResult.primary_match.name}</h3>
                <p className="text-[10px] text-pink-400 font-bold mb-2">{scanResult.primary_match.collection_line} ({scanResult.primary_match.release_year})</p>
                <p className="text-[11px] text-gray-300 leading-relaxed bg-gray-900/80 p-2.5 rounded-lg border border-gray-800 max-h-44 overflow-y-auto mb-3">
                  {scanResult.primary_match.lore}
                </p>

                <div className="pt-2 border-t border-gray-800 flex justify-between items-center">
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase font-bold">Valor Estimado</p>
                    <p className="text-sm font-bold text-pink-400">{scanResult.primary_match.estimated_min_price} €</p>
                  </div>
                  <button 
                    onClick={handleSaveDirectToCatalog}
                    className="bg-pink-600 hover:bg-pink-500 text-white text-xs px-3.5 py-2 rounded-lg font-bold transition shadow-md flex items-center gap-1.5"
                  >
                    Guardar en Catálogo Maestro
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* TAB: CATÁLOGO MAESTRO */}
        {activeTab === 'catalog' && (
          <section>
            <div className="sticky top-12 z-30 bg-gray-900/95 backdrop-blur-md p-2.5 rounded-xl mb-3 border border-pink-900/30 flex flex-col gap-2 shadow-lg">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Buscar en el catálogo general..."
                  value={catalogSearchTerm}
                  onChange={(e) => setCatalogSearchTerm(e.target.value)}
                  className="w-full bg-gray-800/90 border border-gray-700/80 text-white rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-pink-500/80"
                />
                <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Época:</span>
                <select
                  value={selectedEraFilter}
                  onChange={(e) => setSelectedEraFilter(e.target.value)}
                  className="bg-gray-800 border border-gray-700/80 text-white rounded-md px-2 py-1 text-[11px]"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredMasterCatalog.map((barbie) => {
                  const isWishlisted = wishlist.some(item => item.id === barbie.id);
                  return (
                    <div key={barbie.id} className="bg-gray-900 border border-gray-800/90 rounded-xl overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="h-40 bg-white p-2 flex items-center justify-center relative">
                          {barbie.image_url ? (
                            <img src={barbie.image_url} alt={barbie.name} className="max-h-full object-contain rounded-md filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                          ) : (
                            <BarbieSilhouetteFallback />
                          )}
                          <span className="absolute top-1.5 right-1.5 bg-gray-900/90 text-pink-300 text-[8px] px-1.5 py-0.5 rounded font-bold tracking-wider">
                            {barbie.release_year}
                          </span>
                          <button 
                            onClick={() => toggleWishlist(barbie)}
                            className={`absolute top-1.5 left-1.5 p-1 rounded-full text-xs transition ${isWishlisted ? 'bg-pink-600 text-white' : 'bg-gray-900/80 text-gray-400'}`}
                          >
                            {isWishlisted ? '✦' : '✧'}
                          </button>
                        </div>
                        <div className="p-2">
                          <p className="text-[9px] text-pink-400 font-bold uppercase truncate tracking-wider">{barbie.collection_line}</p>
                          <h3 className="font-bold text-xs text-white leading-tight line-clamp-1">{barbie.name}</h3>
                          <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{barbie.lore}</p>
                        </div>
                      </div>

                      <div className="p-2 border-t border-gray-800/80 bg-gray-950/80 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-pink-400 font-extrabold text-xs">{barbie.estimated_min_price} €</span>
                          <button 
                            onClick={() => setComparePriceItem(barbie)}
                            className="bg-gray-800 text-[10px] px-2 py-0.5 rounded text-pink-300 font-bold hover:bg-gray-700 transition"
                          >
                            Mercados
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleOpenEditPrice(barbie)}
                            className="bg-gray-800 text-yellow-400 text-[10px] p-1.5 rounded font-bold w-1/4 flex justify-center hover:bg-gray-700 transition"
                            title="Editar Precio"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleOpenEditLore(barbie)}
                            className="bg-gray-800 text-gray-300 text-[10px] p-1.5 rounded font-bold w-1/4 flex justify-center hover:bg-gray-700 transition"
                            title="Editar Nombre e Historia"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteFromCatalog(barbie.id)}
                            className="bg-red-950/60 text-red-400 border border-red-900/50 text-[10px] p-1.5 rounded font-bold w-1/4 flex justify-center hover:bg-red-900/80 transition"
                            title="Borrar del Catálogo Maestro"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => setActiveModal({ type: 'add_to_vitrina', barbie })}
                            className="bg-pink-600 text-white text-[11px] font-bold py-1 rounded w-1/4 hover:bg-pink-500 flex items-center justify-center transition"
                            title="Añadir a Vitrina"
                          >
                            +
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
            <h2 className="text-sm font-extrabold text-pink-500 tracking-wider uppercase mb-1">Anuncios de Venta</h2>
            <p className="text-[11px] text-gray-400 mb-4">Copia textos optimizados para Vinted, Wallapop y eBay.</p>

            {myCollection.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No tienes muñecas en tu Vitrina para vender.</p>
            ) : (
              <div className="space-y-3">
                {myCollection.map((item) => (
                  <div key={item.userInstanceId || item.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800 text-xs">
                    <h3 className="font-bold text-white">{item.name}</h3>
                    <p className="text-[10px] text-pink-400">{item.collection_line} ({item.release_year})</p>

                    <button 
                      onClick={() => navigator.clipboard.writeText(`Barbie ${item.name} (${item.release_year}) - Estado: ${item.condition}. ${item.lore}`)}
                      className="mt-2.5 w-full bg-pink-600 hover:bg-pink-500 text-white text-[11px] font-bold py-1.5 rounded transition flex items-center justify-center gap-1.5"
                    >
                      Copiar Anuncio Optimizado
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
            <h2 className="text-sm font-extrabold text-pink-500 tracking-wider uppercase mb-1">Red de Curadores</h2>
            <p className="text-[11px] text-gray-400 mb-4">Perfiles de coleccionistas y colaboradores comprobados.</p>
            
            <div className="space-y-3">
              {betaTesters.map((tester) => (
                <div key={tester.id} className="bg-gray-950 p-3 rounded-lg border border-gray-800 flex items-center gap-3">
                  <div className="w-9 h-9 bg-pink-950/80 border border-pink-500/30 rounded-full flex items-center justify-center text-sm font-bold text-pink-400">
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

      {/* BOTÓN FLOTANTE "VOLVER ARRIBA" */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 right-4 bg-gray-900/90 hover:bg-pink-600 text-gray-200 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-full shadow-xl border border-gray-700/80 hover:border-pink-500 z-40 transition-all flex items-center gap-1 backdrop-blur-md"
          title="Volver arriba"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          Subir
        </button>
      )}

      {/* MODAL CAMBIAR CONTRASEÑA */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-pink-900/50 rounded-2xl p-5 max-w-xs w-full relative shadow-2xl">
            <button 
              onClick={() => { setShowPasswordModal(false); setPasswordStatus({ error: null, success: null, loading: false }); }}
              className="absolute top-3 right-3 text-gray-400 hover:text-white font-bold text-xs"
            >
              ✕
            </button>
            
            <h3 className="text-sm font-black text-pink-500 mb-1 flex items-center gap-1.5">
              <span>🔑</span> Cambiar Contraseña
            </h3>
            <p className="text-[10px] text-gray-400 mb-4">Actualiza tu clave de acceso para tu cuenta beta.</p>

            {passwordStatus.error && (
              <div className="mb-3 p-2 bg-red-950/80 border border-red-800 text-red-300 text-[10px] rounded-lg">
                {passwordStatus.error}
              </div>
            )}

            {passwordStatus.success && (
              <div className="mb-3 p-2 bg-green-950/80 border border-green-800 text-green-300 text-[10px] rounded-lg text-center font-bold">
                {passwordStatus.success}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">Nueva Contraseña:</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">Confirmar Contraseña:</label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="bg-gray-800 text-gray-300 px-3 py-2 rounded-xl font-bold text-xs hover:bg-gray-700 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordStatus.loading}
                  className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl font-bold text-xs transition shadow-md disabled:opacity-50"
                >
                  {passwordStatus.loading ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3D INSPECTOR */}
      {showVitrinaDoorsModal && selectedVitrinaDoll && (
        <div 
          onClick={handleCloseVitrinaDoll}
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative w-full max-w-sm bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 border-2 border-pink-900/60 rounded-2xl overflow-hidden shadow-2xl p-3 my-auto max-h-[88vh] flex flex-col justify-between"
          >
            <button 
              onClick={handleCloseVitrinaDoll}
              className="absolute top-2 right-2 text-gray-300 hover:text-white font-black text-xs bg-gray-900/90 rounded-full w-7 h-7 flex items-center justify-center z-50 border border-gray-700 shadow-md transition hover:bg-pink-600"
            >
              ✕
            </button>

            <div className="absolute top-2 left-2 z-40 flex items-center gap-1 bg-gray-900/80 backdrop-blur-md border border-gray-700/80 p-1 rounded-lg shadow-md">
              <button 
                onClick={handleZoomIn} 
                className="bg-gray-800 hover:bg-pink-600 text-white font-bold text-xs px-2 py-0.5 rounded transition"
                title="Acercar"
              >
                +
              </button>
              <button 
                onClick={handleZoomOut} 
                className="bg-gray-800 hover:bg-pink-600 text-white font-bold text-xs px-2 py-0.5 rounded transition"
                title="Alejar"
              >
                -
              </button>
              {zoomScale > 1 && (
                <button 
                  onClick={handleResetZoom} 
                  className="bg-pink-950 text-pink-300 font-bold text-[9px] px-1.5 py-0.5 rounded border border-pink-700/50 hover:bg-pink-900 transition"
                >
                  Reset
                </button>
              )}
            </div>

            <div 
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative w-full h-64 bg-white rounded-xl overflow-hidden border border-pink-500/30 flex items-center justify-center mb-3 shrink-0 ${zoomScale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
              style={{ perspective: '900px' }}
            >
              <div className="absolute top-0 w-28 h-28 bg-pink-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div 
                className="z-10 h-56 p-1 flex items-center justify-center transition-transform duration-150 ease-out"
                style={{
                  transform: `scale(${zoomScale}) translate(${zoomPosition.x / zoomScale}px, ${zoomPosition.y / zoomScale}px)`
                }}
              >
                {selectedVitrinaDoll.image_url ? (
                  <img 
                    src={selectedVitrinaDoll.image_url} 
                    alt={selectedVitrinaDoll.name} 
                    className="max-h-full object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] select-none pointer-events-none" 
                  />
                ) : (
                  <BarbieSilhouetteFallback />
                )}
              </div>

              <div className="absolute bottom-3 w-3/4 h-1.5 bg-gradient-to-r from-transparent via-pink-400/30 to-transparent rounded-full blur-[1px]"></div>

              <div 
                className="absolute top-0 left-0 w-1/2 h-full bg-pink-400/10 border-r border-gray-300/40 backdrop-blur-[2px] transition-transform duration-500 ease-in-out origin-left flex items-center justify-end pr-1.5 pointer-events-none z-20"
                style={{ 
                  transform: doorsOpened ? 'rotateY(-110deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden'
                }}
              >
                <div className="w-1 h-10 bg-gray-400/50 rounded-full shadow-md"></div>
              </div>

              <div 
                className="absolute top-0 right-0 w-1/2 h-full bg-pink-400/10 border-l border-gray-300/40 backdrop-blur-[2px] transition-transform duration-500 ease-in-out origin-right flex items-center justify-start pl-1.5 pointer-events-none z-20"
                style={{ 
                  transform: doorsOpened ? 'rotateY(110deg)' : 'rotateY(0deg)',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden'
                }}
              >
                <div className="w-1 h-10 bg-gray-400/50 rounded-full shadow-md"></div>
              </div>
            </div>

            <div className="text-left bg-gray-950/90 p-2.5 rounded-xl border border-pink-900/40 overflow-y-auto max-h-36">
              <span className="text-[8px] text-pink-400 font-extrabold uppercase tracking-widest">{selectedVitrinaDoll.collection_line} ({selectedVitrinaDoll.release_year})</span>
              <h3 className="text-xs font-black text-white mt-0.5 leading-snug">{selectedVitrinaDoll.name}</h3>
              <p className="text-[10px] text-gray-300 mt-1 leading-relaxed">{selectedVitrinaDoll.lore}</p>
              
              <div className="mt-2 pt-2 border-t border-gray-800 flex justify-between items-center text-[11px]">
                <span className="text-gray-400">Estado: <strong className="text-white">{selectedVitrinaDoll.condition || 'NIB'}</strong></span>
                <span className="text-pink-400 font-extrabold">{selectedVitrinaDoll.estimated_min_price} €</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 z-50 backdrop-blur-lg px-2 py-2">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('vitrina')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${activeTab === 'vitrina' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>Vitrina</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('scan')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${activeTab === 'scan' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Escáner</span>
          </button>

          <button 
            onClick={() => setActiveTab('catalog')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${activeTab === 'catalog' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>Catálogo</span>
          </button>

          <button 
            onClick={() => setActiveTab('sales')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${activeTab === 'sales' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>Ventas</span>
          </button>

          <button 
            onClick={() => setActiveTab('community')}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition ${activeTab === 'community' ? 'text-pink-500' : 'text-gray-400 hover:text-gray-200'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5 5 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>Red</span>
          </button>
        </div>
      </nav>

      {/* MODAL: EDITAR PRECIO */}
      {editingPriceItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-xs w-full">
            <h3 className="text-sm font-bold text-pink-500 mb-1">Editar Precio Estimado</h3>
            <p className="text-[10px] text-gray-400 mb-3">{editingPriceItem.name}</p>

            <form onSubmit={handleSavePrice} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Precio Estimado (€):</label>
                <input
                  type="number"
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingPriceItem(null)}
                  className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded font-bold text-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR HISTORIA / NOMBRE / LÍNEA */}
      {editingLoreItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-sm w-full">
            <h3 className="text-sm font-bold text-pink-500 mb-1">Editar Registro</h3>
            <p className="text-[10px] text-gray-400 mb-3">Modifica la información registrada de la muñeca.</p>

            <form onSubmit={handleSaveAdminLore} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Nombre de la Barbie:</label>
                <input
                  type="text"
                  value={adminLoreForm.name}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs focus:outline-none focus:border-pink-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Línea de Colección:</label>
                <input
                  type="text"
                  value={adminLoreForm.collection_line}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, collection_line: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Año de Lanzamiento:</label>
                <input
                  type="number"
                  value={adminLoreForm.release_year}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, release_year: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded p-1.5 text-xs focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Historia / Lore:</label>
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
                  Guardar
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
            <h3 className="text-sm font-bold text-pink-500 mb-1">Comparar Mercado</h3>
            <p className="text-[11px] text-gray-400 mb-3">{comparePriceItem.name}</p>

            <div className="space-y-1.5 text-xs">
              {Object.entries(getMarketSearchUrls(comparePriceItem.name)).map(([platform, url]) => (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-gray-950 p-2 rounded border border-gray-800 text-[11px] font-bold text-white uppercase hover:border-pink-500/50 transition"
                >
                  <span>{platform}</span>
                  <span className="text-pink-400 text-xs">➔</span>
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
            <p className="text-[11px] text-gray-400 mb-3">Enlace público a tu colección.</p>

            <div className="space-y-2 text-xs">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-green-950/60 border border-green-800/80 p-2 rounded text-[11px] font-bold text-green-300"
              >
                <span>WhatsApp</span>
                <span>Enviar ➔</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-sky-950/60 border border-sky-800/80 p-2 rounded text-[11px] font-bold text-sky-300"
              >
                <span>X (Twitter)</span>
                <span>Postear ➔</span>
              </a>

              <button
                onClick={handleCopyShareLink}
                className="w-full text-center bg-gray-800 border border-gray-700 p-2 rounded text-[11px] font-bold text-gray-200 mt-1 hover:bg-gray-700 transition"
              >
                {copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace Directo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR REGISTRO A MI VITRINA */}
      {activeModal?.type === 'add_to_vitrina' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 max-w-xs w-full">
            <h3 className="text-sm font-bold text-pink-500 mb-1">Añadir a Mi Vitrina</h3>
            <p className="text-[10px] text-gray-400 mb-3">{activeModal.barbie.name}</p>

            <form onSubmit={handleAddToMyVitrina} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-gray-300 block mb-0.5">Estado de Conservación:</label>
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