import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import LandingPage from './LandingPage'

const supabaseUrl = 'https://ytrxlbhcfxnwfqttupvw.supabase.co'
const supabaseAnonKey = 'sb_publishable_drgo1aaGYqTmdHOaCIA1CQ_Z3ngfXeD'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const DEFAULT_BARBIE_SILHOUETTE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='100%' height='100%' fill='%23ec4899'><rect width='200' height='200' fill='%2318181b'/><circle cx='100' cy='100' r='85' fill='%2327272a' stroke='%23ec4899' stroke-width='3'/><path d='M115,45 C100,45 88,55 85,68 C80,66 75,68 72,72 C68,78 70,86 75,90 C70,95 68,102 70,108 C73,115 80,118 85,116 C88,122 95,126 102,125 C100,132 98,142 122,122 C128,118 132,110 130,102 C128,95 122,90 118,90 C122,82 120,72 114,66 C120,60 122,50 115,45 Z' fill='%23f472b6' opacity='0.9'/><path d='M100,158 C120,158 135,148 140,138 C128,144 112,145 100,140 C88,145 72,144 60,138 C65,148 80,158 100,158 Z' fill='%23ec4899'/></svg>";

const processImageWithWhiteBackgroundAndBase = (base64Img, condition = '', box = null) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = base64Img;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = 800;
      canvas.height = 1000;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let srcX = 0;
      let srcY = 0;
      let srcW = img.width;
      let srcH = img.height;

      if (box && Array.isArray(box) && box.length === 4) {
        const [ymin, xmin, ymax, xmax] = box;
        srcX = (xmin / 1000) * img.width;
        srcY = (ymin / 1000) * img.height;
        srcW = ((xmax - xmin) / 1000) * img.width;
        srcH = ((ymax - ymin) / 1000) * img.height;
      }

      const isLoose = condition.toLowerCase().includes('loose') || condition.toLowerCase().includes('sin caja');

      if (isLoose) {
        const centerX = canvas.width / 2;
        const baseY = canvas.height - 100;

        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 12, 190, 38, 0, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.07)';
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(centerX, baseY, 170, 32, 0, 0, 2 * Math.PI);
        ctx.fillStyle = '#FAFAFA';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#EC4899';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(centerX, baseY);
        ctx.lineTo(centerX, baseY - 380);
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#E4E4E7';
        ctx.stroke();

        const padding = 100;
        const maxHeight = canvas.height - padding * 2 - 40;
        const scale = Math.min(maxHeight / srcH, (canvas.width - padding) / srcW);
        const renderW = srcW * scale;
        const renderH = srcH * scale;
        const renderX = (canvas.width - renderW) / 2;
        const renderY = baseY - renderH + 10;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, renderX, renderY, renderW, renderH);
      } else {
        const padding = 80;
        const maxHeight = canvas.height - padding * 2;
        const scale = Math.min(maxHeight / srcH, (canvas.width - padding) / srcW);
        const renderW = srcW * scale;
        const renderH = srcH * scale;
        const renderX = (canvas.width - renderW) / 2;
        const renderY = (canvas.height - renderH) / 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
        ctx.fillRect(renderX + 12, renderY + renderH - 6, renderW - 24, 12);

        ctx.drawImage(img, srcX, srcY, srcW, srcH, renderX, renderY, renderW, renderH);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
  });
};

export default function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('vitrina');
  const [masterCatalog, setMasterCatalog] = useState([]);
  const [myCollection, setMyCollection] = useState([]);
  const [, setWishlist] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [shareImageRights, setShareImageRights] = useState(true);

  const [lang, setLang] = useState('ES'); 
  const [currency, setCurrency] = useState('EUR'); 
  const exchangeRateUSD = 1.08; 

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [activeModal, setActiveModal] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null); 
  const [expandedInfoItem, setExpandedInfoItem] = useState(null); 
  const [expandedCards, setExpandedCards] = useState({}); 

  const [editingLoreItem, setEditingLoreItem] = useState(null);
  const [adminLoreForm, setAdminLoreForm] = useState({ lore: '', collection_line: '', release_year: '' });

  const [editingPriceId, setEditingPriceId] = useState(null);
  const [tempPriceValue, setTempPriceValue] = useState('');

  const [userBarbieForm, setUserBarbieForm] = useState({ 
    quantity: 1, 
    condition: 'NFRB (Caja Original Precintada)', 
    customPrice: '',
    serialNumber: '', 
    notes: '',
    allowPublicMedia: true
  });

  const [calcData, setCalcData] = useState({
    salePrice: 50,
    purchasePrice: 30,
    shippingCost: 3.5,
    packagingCost: 1.5,
    platform: 'vinted'
  });

  const [adCopyText, setAdCopyText] = useState('');
  const [copiedStatus, setCopiedStatus] = useState(false);
  
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [scannedImageBase64, setScannedImageBase64] = useState(null);

  const t = {
    ES: {
      title: "LA VITRINA",
      subTitle: "del Coleccionista de Barbie",
      tagline: "BARBIE COLLECTION & APP • CATÁLOGO Y GESTIÓN DE ACTIVOS",
      portfolio: "Mi Vitrina",
      scanner: "Captura de Barbie",
      directory: "Los Coleccionistas",
      alerts: "Al Mejor Precio",
      catalog: "Catálogo",
      calc: "Vender",
      report: "Informes y Certificados",
      logout: "Salir",
      navTotal: "VALOR ESTIMADO:",
      activePortfolio: "Portafolio Activo",
      hoverTip: "• Pasa el cursor sobre la vitrina para abrir las puertas de cristal",
      openShowcase: "✨ Abrir Vitrina",
      history: "📜 Historia, Molde & Detalles Periciales:",
      moreInfo: "🔍 Lupa de Aumento",
      expandCard: "▼ Ampliar Ficha Completa",
      collapseCard: "▲ Contraer Ficha",
      assessedValue: "Valor Tasado:",
      generateSheet: "Generar Ficha",
      delete: "Eliminar",
      dirTitle: "Los Coleccionistas",
      dirSubtitle: "Red internacional de archivos privados, vitrinas verificadas y divulgadores de la comunidad Barbie.",
      founderBadge: "★ Club de los 50",
      viewInsta: "📸 Ver en Instagram"
    },
    EN: {
      title: "THE SHOWCASE",
      subTitle: "Barbie Collector Vault",
      tagline: "BARBIE COLLECTION & APP • CATALOG & ASSET MANAGEMENT",
      portfolio: "My Showcase",
      scanner: "Barbie Capture",
      directory: "The Collectors",
      alerts: "Best Prices",
      catalog: "Catalog",
      calc: "Sell",
      report: "Reports & Certificates",
      logout: "Log out",
      navTotal: "TOTAL ESTIMATED VALUE:",
      activePortfolio: "Active Portfolio",
      hoverTip: "• Hover over the showcase to open glass doors",
      openShowcase: "✨ Open Showcase",
      history: "📜 History, Sculpt & Lore:",
      moreInfo: "🔍 Magnifying Glass",
      expandCard: "▼ Expand Full File",
      collapseCard: "▲ Collapse File",
      assessedValue: "Estimated Value:",
      generateSheet: "Export Listing",
      delete: "Delete",
      dirTitle: "The Collectors Directory",
      dirSubtitle: "Official network of verified showcases, private vaults, and Barbie community creators.",
      founderBadge: "★ 50 Club Founder",
      viewInsta: "📸 View on Instagram"
    }
  }[lang];

  const directoryMembers = [
    {
      handle: "@chicledefresadolls",
      country: "🇪🇸 España",
      specialty: "Barbie Vintage 90s & Ediciones NRFB",
      bio: "Coleccionista de Barbie noventera y ediciones limitadas. Divulgación sobre conservación y restauración de prendas vintage.",
      instagram: "https://instagram.com/chicledefresadolls",
      initials: "CD",
      color: "from-pink-600 to-rose-500",
      sharedPhotos: 18
    },
    {
      handle: "@barbiedecoleccionenespanol",
      country: "🇪🇸 España / LatAm",
      specialty: "Divulgación de Historia, Variantes Congost & Curaduría",
      bio: "Comunidad dedicada a la historia, moldes faciales (SuperStar/Steffie) y documentación de catálogo en idioma español.",
      instagram: "https://instagram.com/barbiedecoleccionenespanol",
      initials: "BC",
      color: "from-rose-600 to-pink-500",
      sharedPhotos: 42
    },
    {
      handle: "@pm_collectibles",
      country: "🇺🇸 USA",
      specialty: "Barbie Signature, Silkstone & High-End Vault",
      bio: "Curating rare Silkstone, Bob Mackie design, and prototype Barbie dolls since 2012.",
      instagram: "https://instagram.com/pm_collectibles",
      initials: "PM",
      color: "from-purple-600 to-pink-600",
      sharedPhotos: 31
    }
  ];

  const formatPrice = (valInEUR) => {
    const numeric = Number(valInEUR) || 0;
    if (currency === 'USD') {
      return `$${(numeric * exchangeRateUSD).toFixed(2)}`;
    }
    return `€${numeric.toFixed(2)}`;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
      else { setMyCollection([]); setWishlist([]); }
    });

    fetchMasterCatalog();
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) fetchUserData(session.user.id);
  }, [session]);

  async function fetchUserData(userId) {
    const { data: colData } = await supabase.from('user_collections').select('*').eq('user_id', userId);
    if (colData) setMyCollection(colData.map(item => ({ 
      ...item, 
      userInstanceId: item.id,
      image_url: (!item.image_url || item.image_url.includes('unsplash')) ? DEFAULT_BARBIE_SILHOUETTE : item.image_url
    })));

    const { data: wishData } = await supabase.from('user_wishlists').select('barbie_master_id').eq('user_id', userId);
    if (wishData) setWishlist(wishData.map(w => w.barbie_master_id));
  }

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthLoading(true);

    const cleanEmail = authForm.email.trim().toLowerCase();

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: authForm.password,
        });
        if (error) setAuthError(error.message);
        else if (data?.session) setShowAuthModal(false);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: authForm.password,
        });
        if (error) setAuthError(error.message);
        else {
          if (data?.user && !data?.session) setAuthSuccessMsg('Confirmación enviada por email. Verifica tu bandeja.');
          else if (data?.session) setShowAuthModal(false);
        }
      }
    } catch (err) {
      setAuthError('Ocurrió un error inesperado.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const toggleCardExpansion = (id) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdatePriceInVitrina = async (instanceId, newPrice) => {
    const numericPrice = parseFloat(newPrice);
    if (isNaN(numericPrice) || numericPrice < 0) return;

    const priceInEUR = currency === 'USD' ? numericPrice / exchangeRateUSD : numericPrice;

    const { error } = await supabase
      .from('user_collections')
      .update({ estimated_min_price: priceInEUR })
      .eq('id', instanceId);

    if (!error) {
      setMyCollection(prev => prev.map(item => 
        item.userInstanceId === instanceId ? { ...item, estimated_min_price: priceInEUR } : item
      ));
      setEditingPriceId(null);
    }
  };

  const handleSaveAdminLore = async (e) => {
    e.preventDefault();
    if (!editingLoreItem) return;

    const updatedLore = adminLoreForm.lore;
    const updatedLine = adminLoreForm.collection_line;
    const updatedYear = Number(adminLoreForm.release_year);

    // A) Si estamos editando una muñeca que está en "Mi Vitrina" (user_collections)
    if (editingLoreItem.userInstanceId) {
      const { error: userColErr } = await supabase
        .from('user_collections')
        .update({ 
          lore: updatedLore, 
          notes: `[HISTORIA OFICIAL]: ${updatedLore}`, 
          collection_line: updatedLine, 
          release_year: updatedYear 
        })
        .eq('id', editingLoreItem.userInstanceId);

      if (!userColErr) {
        setMyCollection(prev => prev.map(item => 
          item.userInstanceId === editingLoreItem.userInstanceId 
            ? { ...item, lore: updatedLore, collection_line: updatedLine, release_year: updatedYear, notes: `[HISTORIA OFICIAL]: ${updatedLore}` }
            : item
        ));
      }
    }

    // B) Si estamos editando el Catálogo Maestro global (barbies_master)
    if (editingLoreItem.id) {
      const { error: masterErr } = await supabase
        .from('barbies_master')
        .update({ 
          lore: updatedLore,
          collection_line: updatedLine, 
          release_year: updatedYear 
        })
        .eq('id', editingLoreItem.id);

      if (!masterErr) {
        setMasterCatalog(prev => prev.map(item => 
          item.id === editingLoreItem.id 
            ? { ...item, lore: updatedLore, collection_line: updatedLine, release_year: updatedYear } 
            : item
        ));
      }
    }

    setEditingLoreItem(null);
  };

  const getBarbieLore = (name, line, year) => {
    const loreDatabase = {
      "Barbie Fashionistas con Diabetes Tipo 1": "Lanzada en la icónica línea de Inclusión Social de Mattel. Esta edición histórica incorpora un monitor continuo de glucosa (CGM) detallado en el brazo y bomba de insulina. Diseñada en colaboración estricta con expertos médicos y la comunidad para fomentar la representación en la infancia. Molde facial: Millie (2013). Cuerpo articulado con tono de piel pálido cálido.",
      "Barbie Fashionistas con Síndrome de Down": "Hito histórico en la marca creado junto a la National Down Syndrome Society (NDSS). Su vestido azul y amarillo incorpora mariposas (símbolos de concienciación). Incluye ortesis en tobillos/pies, torso adaptado y collar con tres chevrones representando la trisomía del cromosoma 21. Molde facial específico diseñado exclusivamente para este modelo.",
      "Barbie Western Stampede 1980 (Edición Americana vs. Europea Congost)": "Existen dos tirajes históricos muy codiciados: la versión oficial americana fabricada en Filipinas/Taiwán y la versión española licenciada por Congost/Eulalia Mateo. La variante europea destaca por un labial rosa más vivo, ojos de mayor contraste y sombreros rígidos de polímero denso. Para muchos peritos, la versión europea posee un acabado estético superior.",
      "Totally Hair Barbie (1992 Vintage)": "Lanzada en 1992, es la muñeca Barbie más vendida de la historia de Mattel (+10 millones de unidades). Diseñada por Carol Spencer con estampado psicodélico estilo Pucci y melena hasta los tobillos con gel de peinado incluido. Molde facial: SuperStar (1976).",
      "Holiday Barbie 1988": "Inauguró la icónica saga 'Happy Holidays'. Primera edición Collector en vestir vestido de tul rojo con encaje blanco, convirtiéndose en objeto de especulación en el mercado secundario vintage.",
      "Bob Mackie Gold Illusion Barbie": "Creación del célebre diseñador de Hollywood Bob Mackie (1990). Destaca por sus bordados a mano de lentejuelas doradas sobre tela translúcida y tocado monumental. Molde facial: Mackie (1991).",
      "SuperStar Barbie 1977": "Revolucionó la marca a finales de los 70 introduciendo el rostro sonriente Superstar de Joyce Clark. Reflejaba el glamur de la época Disco con vestido rosa satinado y estola de plumas.",
      "Karl Lagerfeld Barbie": "Limitada a 990 unidades (2014). Homenaje al director creativo de Chanel con su característico traje negro entallado, camisa de cuello alto y gafas oscuras."
    };

    if (loreDatabase[name]) return loreDatabase[name];

    if (line?.toLowerCase().includes('fashionistas')) {
      return `Perteneciente a la revolucionaria línea Fashionistas de Mattel enfocada en inclusión social, diversidad corporal (Curvy, Petite, Tall) y visibilización (sillas de ruedas, prótesis, vitíligo y dispositivos de salud). Preserva el compromiso cultural moderno.`;
    }
    if (Number(year) < 1990) {
      return `Pieza clásica de la era Vintage/Mod. Presenta variantes regionales codiciadas entre la distribución estadounidense y la fabricación en España (Congost/Eulalia Mateo) o Italia. Marcas de registro en espalda/glúteos.`;
    }
    return `Ejemplar catalogado de la línea '${line || 'Barbie Signature'}'. Preserva la narrativa estilística, estética de la época, molde facial característico y valor patrimonial de Mattel.`;
  };

  const getConservationGuide = (year) => {
    if (Number(year) < 1990) {
      return {
        storage: "Ambientes entre 18°C-21°C con 40-50% de humedad relativa. Evitar vitrinas con luz solar directa o halógenos.",
        maintenance: "RETIRO DE PENDIENTES OBLIGATORIO: Los metales provocan la reacción química 'Green Ear' (manchas verdes de sulfato). Limpiar vinilo pegajoso con alcohol isopropílico de 70°.",
        patentMark: "Sello de patente típico: © 1966 Mattel Inc. / Made in Japan, Taiwan o Malaysia en la nuca o cadera."
      };
    }
    return {
      storage: "Almacenar en vertical sobre soporte de péndulo o en caja original protegida de polvo.",
      maintenance: "Para cabellos sintéticos encrespados, sumergir en agua templada con suavizante y peinar de abajo a arriba. Lavado de ropa solo a mano con jabón neutro.",
      patentMark: "Sello de patente típico: © Mattel Inc. / Made in Indonesia o China en la nuca/espalda."
    };
  };

  const calculateDynamicPrice = (item) => {
    const name = item.name || '';
    const line = (item.collection_line || '').toLowerCase();
    const year = Number(item.release_year) || 2020;

    const exactCatalogPrices = {
      "Barbie Fashionistas con Diabetes Tipo 1": 26,
      "Barbie Fashionistas con Síndrome de Down": 32,
      "Barbie Western Stampede 1980 (Edición Americana vs. Europea Congost)": 140,
      "Barbie The Movie (Vestido Rosa Guinga)": 48,
      "Totally Hair Barbie (1992 Vintage)": 115,
      "Holiday Barbie 1988": 145,
      "Bob Mackie Gold Illusion Barbie": 390,
      "SuperStar Barbie 1977": 165,
      "Karl Lagerfeld Barbie": 1850
    };

    if (exactCatalogPrices[name]) return exactCatalogPrices[name];

    if (line.includes('signature') || line.includes('collector') || line.includes('silkstone')) {
      return year < 2000 ? 180 : 95;
    }
    if (line.includes('fashionistas') || line.includes('extra')) {
      return 24;
    }
    if (year < 1980) return 190;
    if (year < 1990) return 120;
    return 38;
  };

  async function fetchMasterCatalog() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('barbies_master')
        .select('*')
        .order('release_year', { ascending: true });

      const catalog = (data || []).map((item) => {
        const estimatedPrice = calculateDynamicPrice(item);
        
        // REGLA DE ORO: Si existe lore guardado en la BD (editado por el admin), SE USA ESE.
        // Solo si la casilla en Supabase está vacía o es null, genera una por defecto.
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
      console.error("Error al cargar catálogo maestro:", e);
    } finally {
      setLoading(false);
    }
  }

  // MANEJADOR DE ESCÁNER VÍA VERCEL SERVERLESS API
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
        // Redimensionar imagen a máx 800px para acelerar el procesamiento de la IA
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
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: 'image/jpeg'
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
            setDebugError(`Error al interpretar respuesta: ${rawText}`);
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

  const handleAddToMyVitrina = async (e) => {
    e.preventDefault();
    if (!activeModal?.barbie || !session) return;

    let finalImageUrl = activeModal.barbie.image_url || DEFAULT_BARBIE_SILHOUETTE;
    if (scannedImageBase64) {
      finalImageUrl = await processImageWithWhiteBackgroundAndBase(
        scannedImageBase64, 
        userBarbieForm.condition,
        scanResult?.box_2d || null
      );
    }

    const finalLore = activeModal.barbie.lore || getBarbieLore(activeModal.barbie.name, activeModal.barbie.collection_line, activeModal.barbie.release_year);
    
    let finalPriceInEUR = activeModal.barbie.estimated_min_price || calculateDynamicPrice(activeModal.barbie);
    if (userBarbieForm.customPrice) {
      const parsedCustom = parseFloat(userBarbieForm.customPrice);
      finalPriceInEUR = currency === 'USD' ? parsedCustom / exchangeRateUSD : parsedCustom;
    }

    const payload = {
      user_id: session.user.id,
      barbie_master_id: activeModal.barbie.id || null,
      name: activeModal.barbie.name,
      collection_line: activeModal.barbie.collection_line,
      release_year: Number(activeModal.barbie.release_year),
      estimated_min_price: Number(finalPriceInEUR),
      image_url: finalImageUrl,
      quantity: Math.max(1, Number(userBarbieForm.quantity || 1)),
      condition: userBarbieForm.condition,
      serial_number: userBarbieForm.serialNumber || 'Sin registrar',
      notes: userBarbieForm.notes ? `${userBarbieForm.notes}\n\n[HISTORIA OFICIAL]: ${finalLore}` : `[HISTORIA OFICIAL]: ${finalLore}`
    };

    const { error } = await supabase.from('user_collections').insert([payload]);
    if (!error) {
      fetchUserData(session.user.id);
      setActiveModal(null);
      setScannedImageBase64(null);
      setUserBarbieForm({ quantity: 1, condition: 'NFRB (Caja Original Precintada)', customPrice: '', serialNumber: '', notes: '', allowPublicMedia: true });
    }
  };

  const handleRemoveFromVitrina = async (instanceId) => {
    if (!session) return;
    const { error } = await supabase.from('user_collections').delete().eq('id', instanceId);
    if (!error) setMyCollection(myCollection.filter(c => c.userInstanceId !== instanceId));
  };

  const generateAdCopy = (barbie) => {
    const text = `${barbie.name.toUpperCase()}\n\n` +
      `Línea de Colección: ${barbie.collection_line || 'Collector'}\n` +
      `Año de Lanzamiento: ${barbie.release_year}\n` +
      `Estado de Conservación: ${barbie.condition || 'NFRB (Precintado)'}\n` +
      `Número COA: ${barbie.serial_number || 'Verificado'}\n\n` +
      `DESCRIPCIÓN Y FICHA TÉCNICA:\n${barbie.notes || 'Ejemplar procedente de colección privada, preservado en ambiente libre de humedad y luz UV.'}\n\n` +
      `Envío asegurado con embalaje de alta protección para preservación de caja originaria.`;
    
    setAdCopyText(text);
    setActiveModal({ type: 'adGenerator', barbie });
  };

  const totalCollectionValueEUR = myCollection.reduce((acc, item) => {
    const price = Number(item.estimated_min_price) || calculateDynamicPrice(item);
    return acc + (price * Number(item.quantity || 1));
  }, 0);

  const getDeals = () => {
    const platforms = ['Vinted Europa', 'Wallapop España', 'Amazon España', 'eBay España'];
    return masterCatalog.slice(0, 4).map((barbie, idx) => {
      const avg = Number(barbie.estimated_min_price || calculateDynamicPrice(barbie));
      const query = encodeURIComponent(barbie.name);
      return {
        ...barbie,
        bargainPrice: Number((avg * 0.68).toFixed(2)),
        discountPercent: 32,
        platform: platforms[idx % platforms.length],
        searchUrl: `https://www.vinted.es/catalog?search_text=${query}`
      };
    });
  };

  const filteredCatalog = masterCatalog.filter(b => 
    (b.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (b.collection_line || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950 text-pink-300 text-sm font-mono font-bold">
        Cargando La Vitrina del Coleccionista de Barbie...
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <LandingPage 
          onOpenAuth={(mode, initialEmail = '') => {
            setAuthMode(mode);
            if (initialEmail) setAuthForm(prev => ({ ...prev, email: initialEmail }));
            setShowAuthModal(true);
          }} 
        />

        {showAuthModal && (
          <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md flex justify-center items-center p-4 z-50">
            <div className="bg-zinc-900 border border-pink-900/40 p-6 rounded-3xl max-w-sm w-full shadow-2xl relative text-zinc-100">
              <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xs font-mono">✕</button>
              <h3 className="text-sm font-bold text-white mb-4">
                {authMode === 'login' ? 'Acceso Miembros' : 'Registro de Licencia Beta'}
              </h3>
              
              {authError && <div className="bg-rose-950/60 border border-rose-800/50 text-rose-300 text-xs p-3 rounded-2xl mb-3">{authError}</div>}
              {authSuccessMsg && <div className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs p-3 rounded-2xl mb-3">{authSuccessMsg}</div>}

              <form onSubmit={handleAuth} className="space-y-3">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-mono">Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="correo@ejemplo.com" 
                    value={authForm.email} 
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-100 focus:outline-none focus:border-pink-500" 
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-mono">Contraseña</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="••••••••" 
                      value={authForm.password} 
                      onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                      className="w-full p-2.5 pr-10 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-100 focus:outline-none focus:border-pink-500" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      {showPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>

                <button type="submit" className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-2xl shadow-md transition mt-2">
                  {authLoading ? 'Procesando...' : (authMode === 'login' ? 'Iniciar Sesión' : 'Obtener Acceso Vitalicio')}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login');
                    setAuthError('');
                    setAuthSuccessMsg('');
                  }}
                  className="text-xs text-zinc-400 hover:text-pink-400 transition font-bold"
                >
                  {authMode === 'login' ? '¿Sin cuenta? Solicitar plaza' : '¿Ya registrado? Iniciar sesión'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 pb-12 font-sans">
      
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)} 
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-50 p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center">
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white font-mono text-xs bg-zinc-900 border border-zinc-700 px-3 py-1 rounded-lg"
            >
              ✕ Cerrar
            </button>
            <img 
              src={zoomedImage.url} 
              alt={zoomedImage.title} 
              className="max-h-[82vh] w-auto object-contain rounded-2xl shadow-2xl border border-zinc-800 bg-white" 
            />
            <p className="text-xs text-zinc-300 font-mono mt-3 text-center bg-zinc-900/90 px-4 py-2 rounded-xl border border-zinc-800">
              🔍 {zoomedImage.title}
            </p>
          </div>
        </div>
      )}

      {editingLoreItem && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-zinc-900 border border-pink-900/50 p-6 rounded-3xl max-w-xl w-full shadow-2xl text-zinc-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">✏️ Editar Historia y Ficha Técnica (Modo Admin)</h3>
              <button onClick={() => setEditingLoreItem(null)} className="text-zinc-400 font-mono text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveAdminLore} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] text-pink-400 font-mono uppercase mb-1">Línea de Colección</label>
                <input 
                  type="text" 
                  value={adminLoreForm.collection_line} 
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, collection_line: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] text-pink-400 font-mono uppercase mb-1">Año de Edición</label>
                <input 
                  type="number" 
                  value={adminLoreForm.release_year} 
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, release_year: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] text-pink-400 font-mono uppercase mb-1">Historia Extensa & Lore Pericial</label>
                <textarea 
                  rows="6"
                  value={adminLoreForm.lore}
                  onChange={(e) => setAdminLoreForm({ ...adminLoreForm, lore: e.target.value })}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-mono focus:border-pink-500 focus:outline-none"
                  placeholder="Añade detalles sobre moldes de cabeza, diseñador, tiraje o variantes..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingLoreItem(null)} className="px-3 py-2 text-zinc-400">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl shadow-md">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {expandedInfoItem && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md flex justify-center items-center p-4 z-50">
          <div className="bg-zinc-900 border border-pink-900/40 p-6 rounded-3xl max-w-2xl w-full shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setExpandedInfoItem(null)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white font-mono text-xs bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700"
            >
              ✕ Cerrar
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img src={expandedInfoItem.image_url} alt={expandedInfoItem.name} className="w-16 h-16 object-contain bg-white rounded-2xl p-1 border border-zinc-800" />
              <div>
                <span className="text-[10px] text-pink-400 font-mono font-bold uppercase block">{expandedInfoItem.collection_line} • {expandedInfoItem.release_year}</span>
                <h3 className="text-base font-bold text-white leading-tight">{expandedInfoItem.name}</h3>
                <span className="text-xs text-emerald-400 font-mono font-bold">Tasación Registrada: {formatPrice(expandedInfoItem.estimated_min_price)}</span>
              </div>
            </div>

            <div className="space-y-4 text-xs border-t border-zinc-800 pt-4">
              <div className="bg-zinc-950 p-4 rounded-2xl border border-pink-900/40 relative group overflow-hidden transition-all hover:border-pink-500 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-mono font-bold text-pink-400 uppercase text-[11px]">📜 Historia, Molde Facial & Variantes Regionales:</h4>
                  <span className="text-[10px] text-zinc-400 font-mono bg-pink-950/80 px-2 py-0.5 rounded-md border border-pink-800/50">🔍 Lupa Activa</span>
                </div>
                <p className="text-zinc-200 leading-relaxed text-xs sm:text-sm group-hover:scale-[1.02] transition-transform origin-top-left">
                  {expandedInfoItem.lore}
                </p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-amber-900/40 space-y-2 group transition-all hover:border-amber-500 hover:shadow-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono font-bold text-amber-400 uppercase text-[11px]">🛡️ Protocolo Pericial de Conservación & Cuidados:</h4>
                  <span className="text-[10px] text-zinc-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-800/50">🔎 Zoom Pericial</span>
                </div>
                <p className="text-zinc-200 group-hover:scale-[1.01] transition-transform"><strong>Almacenamiento:</strong> {expandedInfoItem.conservation.storage}</p>
                <p className="text-zinc-200 group-hover:scale-[1.01] transition-transform"><strong>Mantenimiento:</strong> {expandedInfoItem.conservation.maintenance}</p>
              </div>

              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <h4 className="font-mono font-bold text-zinc-400 uppercase text-[11px] mb-1">🔎 Marcas de Registro y Patentes (Mattel):</h4>
                <p className="text-zinc-300 font-mono text-[11px]">{expandedInfoItem.conservation.patentMark}</p>
              </div>
            </div>

            <button 
              onClick={() => setExpandedInfoItem(null)} 
              className="mt-6 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-2xl border border-zinc-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <header className="bg-zinc-900/90 border-b border-pink-950/50 sticky top-0 z-40 backdrop-blur-md shadow-sm print:hidden py-2">
        <div className="max-w-7xl mx-auto px-6 py-2 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 text-white flex items-center justify-center font-black text-xl shadow-md border border-pink-500/40">
              V
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-none">
                {t.title} <span className="text-pink-400 uppercase">{t.subTitle}</span>
              </h1>
              <span className="text-[11px] font-mono text-pink-300/90 font-bold tracking-widest mt-1">
                {t.tagline}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button 
                onClick={() => setLang(lang === 'ES' ? 'EN' : 'ES')}
                className="px-2 py-1 text-[11px] font-mono font-bold text-pink-300 hover:text-white transition"
              >
                🌐 {lang}
              </button>
              <span className="text-zinc-700 text-xs">|</span>
              <button 
                onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
                className="px-2 py-1 text-[11px] font-mono font-bold text-emerald-400 hover:text-white transition"
              >
                {currency === 'EUR' ? '€ EUR' : '$ USD'}
              </button>
            </div>

            <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800/80">
              <button 
                onClick={() => setCurrentView('vitrina')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${currentView === 'vitrina' ? 'bg-pink-950/80 text-pink-200 border border-pink-800/50 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {t.portfolio} ({myCollection.length})
              </button>
              <button 
                onClick={() => setCurrentView('scanner')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-1 ${currentView === 'scanner' ? 'bg-pink-600 text-white shadow-md' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                <span>📷</span> {t.scanner}
              </button>
              <button 
                onClick={() => setCurrentView('directorio')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${currentView === 'directorio' ? 'bg-pink-950/80 text-pink-300 border border-pink-800/50 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                🌐 {t.directory}
              </button>
              <button 
                onClick={() => setCurrentView('chollos')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${currentView === 'chollos' ? 'bg-pink-950/80 text-pink-300 border border-pink-800/50 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {t.alerts}
              </button>
              <button 
                onClick={() => setCurrentView('catalog')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition ${currentView === 'catalog' ? 'bg-pink-950/80 text-pink-200 border border-pink-800/50 shadow-xs' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                {t.catalog} ({masterCatalog.length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveModal({ type: 'calculator' })}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-3 py-2 rounded-xl border border-zinc-700 transition"
              >
                {t.calc}
              </button>
              <button 
                onClick={() => setActiveModal({ type: 'exportPDF' })}
                className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-md"
              >
                {t.report}
              </button>
              <button onClick={handleSignOut} className="text-zinc-400 hover:text-white text-xs px-2 py-2 font-bold">
                {t.logout}
              </button>
            </div>
          </div>

        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 mt-4 print:m-0 print:p-0">
        
        {currentView === 'vitrina' && (
          <div>
            <div className="mb-5 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">⚙️ Ajustes de Tu Vitrina:</span>
                
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isProfilePublic} 
                    onChange={(e) => setIsProfilePublic(e.target.checked)}
                    className="accent-pink-600 rounded"
                  />
                  Hacer mi Vitrina visible en Los Coleccionistas
                </label>

                <label className="flex items-center gap-2 text-xs text-pink-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={shareImageRights} 
                    onChange={(e) => setShareImageRights(e.target.checked)}
                    className="accent-pink-600 rounded"
                  />
                  Compartir fotos para uso de otros coleccionistas
                </label>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-pink-400 uppercase font-mono">{t.navTotal}</span>
                <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono bg-zinc-950 px-3 py-1 rounded-xl border border-zinc-800">
                  {formatPrice(totalCollectionValueEUR)}
                </span>
              </div>
            </div>

            {myCollection.length === 0 ? (
              <div className="bg-zinc-900 rounded-3xl p-10 text-center border border-zinc-800">
                <p className="text-xs text-zinc-500">No hay activos registrados en tu portafolio.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {myCollection.map((item) => {
                  const itemPriceEUR = Number(item.estimated_min_price) || calculateDynamicPrice(item);
                  const loreText = item.lore || getBarbieLore(item.name, item.collection_line, item.release_year);
                  const conservation = getConservationGuide(item.release_year);
                  const isExpanded = !!expandedCards[item.userInstanceId];
                  const isEditingPrice = editingPriceId === item.userInstanceId;

                  return (
                    <div key={item.userInstanceId} className="bg-zinc-900/90 rounded-3xl p-4 border border-zinc-800/80 flex flex-col justify-between transition-all hover:border-pink-900/50 hover:shadow-xl">
                      <div>
                        <div 
                          className="relative group cursor-pointer mb-3 overflow-hidden rounded-2xl bg-white p-2 border border-zinc-800/80 h-56 flex items-center justify-center"
                          style={{ perspective: '1000px' }}
                          onClick={() => setZoomedImage({ url: item.image_url, title: `${item.name} (${item.release_year})` })}
                        >
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-48 object-contain relative z-10 transition-transform duration-500 group-hover:scale-105" 
                          />

                          <div 
                            className="absolute top-0 left-0 w-1/2 h-full z-20 transition-transform duration-700 ease-out origin-left group-hover:rotate-y-[-110deg] flex items-center justify-end pr-1 border-r border-pink-500/30"
                            style={{ 
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 100%)',
                              boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)'
                            }}
                          >
                            <div className="w-1.5 h-6 bg-pink-500/80 rounded-full shadow-xs"></div>
                          </div>

                          <div 
                            className="absolute top-0 right-0 w-1/2 h-full z-20 transition-transform duration-700 ease-out origin-right group-hover:rotate-y-[110deg] flex items-center justify-start pl-1 border-l border-pink-500/30"
                            style={{ 
                              background: 'linear-gradient(225deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 100%)',
                              boxShadow: 'inset 0 0 10px rgba(255,255,255,0.2)'
                            }}
                          >
                            <div className="w-1.5 h-6 bg-pink-500/80 rounded-full shadow-xs"></div>
                          </div>

                          <div className="absolute bottom-2 z-10 opacity-80 group-hover:opacity-0 transition-opacity text-[9px] font-mono font-bold text-pink-300 bg-zinc-900/90 px-2 py-0.5 rounded-full border border-pink-800/50">
                            {t.openShowcase}
                          </div>
                        </div>

                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-pink-400 font-mono font-bold uppercase">{item.collection_line} • {item.release_year}</span>
                            <h3 className="font-bold text-sm text-white truncate">{item.name}</h3>
                          </div>
                          
                          <button 
                            onClick={() => {
                              setEditingLoreItem(item);
                              setAdminLoreForm({ lore: loreText, collection_line: item.collection_line || '', release_year: item.release_year || 1990 });
                            }}
                            className="text-[10px] bg-zinc-800 hover:bg-pink-950 text-pink-300 font-mono px-2 py-1 rounded-lg border border-zinc-700"
                            title="Editar Historia e Info Técnica como Admin"
                          >
                            ✏️ Editar Info
                          </button>
                        </div>

                        <div 
                          onClick={() => setExpandedInfoItem({ ...item, estimated_min_price: itemPriceEUR, lore: loreText, conservation })}
                          className="mt-2.5 p-3 bg-zinc-950/80 rounded-2xl border border-zinc-800/80 text-[11px] text-zinc-300 cursor-pointer hover:border-pink-900/50 transition relative group overflow-hidden"
                          style={{ perspective: '800px' }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] font-mono font-bold text-pink-400 uppercase tracking-wider block">{t.history}</span>
                            <span className="text-[9px] text-pink-300 font-mono group-hover:scale-105 transition-transform">{t.moreInfo}</span>
                          </div>

                          <p className={`leading-relaxed text-[11px] text-zinc-300 ${isExpanded ? '' : 'line-clamp-3'}`}>
                            {loreText}
                          </p>

                          <div 
                            className="absolute top-0 left-0 w-1/2 h-full z-10 transition-transform duration-500 ease-out origin-left group-hover:rotate-y-[-100deg]"
                            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(1px)' }}
                          ></div>
                          <div 
                            className="absolute top-0 right-0 w-1/2 h-full z-10 transition-transform duration-500 ease-out origin-right group-hover:rotate-y-[100deg]"
                            style={{ background: 'linear-gradient(225deg, rgba(236,72,153,0.1) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(1px)' }}
                          ></div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-zinc-950/90 rounded-2xl border border-amber-950/50 text-[10px] space-y-1.5 animate-fadeIn hover:scale-[1.02] transition-transform">
                            <span className="font-mono font-bold text-amber-400 uppercase block">🛡️ Conservación Preventiva:</span>
                            <p className="text-zinc-200"><strong>Almacenamiento:</strong> {conservation.storage}</p>
                            <p className="text-zinc-200"><strong>Mantenimiento:</strong> {conservation.maintenance}</p>
                            <p className="text-zinc-400 font-mono border-t border-zinc-800 pt-1"><strong>Sello:</strong> {conservation.patentMark}</p>
                          </div>
                        )}

                        <button 
                          onClick={() => toggleCardExpansion(item.userInstanceId)}
                          className="mt-2 text-[10px] text-zinc-400 hover:text-zinc-200 font-mono w-full text-center py-1 bg-zinc-950/40 rounded-xl border border-zinc-800/50"
                        >
                          {isExpanded ? t.collapseCard : t.expandCard}
                        </button>

                        <div className="mt-3 flex justify-between items-center bg-zinc-950/60 p-2 rounded-2xl border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-400 uppercase font-mono font-bold">{t.assessedValue}</span>

                          {isEditingPrice ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono text-emerald-400 font-bold">{currency === 'USD' ? '$' : '€'}</span>
                              <input 
                                type="number" 
                                autoFocus
                                value={tempPriceValue}
                                onChange={(e) => setTempPriceValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdatePriceInVitrina(item.userInstanceId, tempPriceValue);
                                  if (e.key === 'Escape') setEditingPriceId(null);
                                }}
                                className="w-16 p-1 bg-zinc-900 border border-pink-500 rounded-lg text-xs text-white font-mono"
                              />
                              <button 
                                onClick={() => handleUpdatePriceInVitrina(item.userInstanceId, tempPriceValue)}
                                className="bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                setEditingPriceId(item.userInstanceId);
                                const currentPriceFormatted = currency === 'USD' ? (itemPriceEUR * exchangeRateUSD).toFixed(2) : itemPriceEUR;
                                setTempPriceValue(currentPriceFormatted);
                              }}
                              className="text-xs font-bold text-emerald-400 font-mono hover:bg-zinc-800 px-2 py-0.5 rounded-lg transition flex items-center gap-1"
                            >
                              {formatPrice(itemPriceEUR)} <span className="text-[9px] text-zinc-500 font-normal">✏️</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800/80 flex justify-between items-center">
                        <button 
                          onClick={() => generateAdCopy(item)}
                          className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-2.5 py-1 rounded-xl transition border border-zinc-700"
                        >
                          {t.generateSheet}
                        </button>
                        <button 
                          onClick={() => handleRemoveFromVitrina(item.userInstanceId)}
                          className="text-[11px] text-pink-400 hover:text-pink-300 font-bold px-2 py-1"
                        >
                          {t.delete}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentView === 'scanner' && (
          <div className="max-w-xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-950/60 border border-pink-800/50 flex items-center justify-center text-pink-400 text-xl mx-auto mb-3">
                📸
              </div>
              <h2 className="text-base font-bold text-white">Captura de Barbie & Reconocimiento Pericial</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Aislamiento automático sobre fondo blanco con análisis de molde facial e inclusión.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-center">
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                id="cameraInput"
                className="hidden"
                onChange={handleScanImage}
              />

              <label 
                htmlFor="cameraInput"
                className="cursor-pointer block bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs py-4 px-6 rounded-2xl shadow-lg transition tracking-wide mb-3"
              >
                📷 Tomar Foto / Abrir Cámara
              </label>

              {scannedImageBase64 && (
                <div 
                  onClick={() => setZoomedImage({ url: scannedImageBase64, title: "Captura para Procesamiento de Vitrina" })}
                  className="my-4 p-2 bg-white rounded-2xl border border-zinc-800 inline-block cursor-zoom-in group"
                >
                  <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">Previsualización de la Foto Capturada:</span>
                  <img src={scannedImageBase64} alt="Previsualización" className="h-44 object-contain rounded-xl mx-auto transition group-hover:scale-105" />
                </div>
              )}

              {scanning && (
                <div className="mt-6 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs font-mono text-pink-400 animate-pulse font-bold">
                  Procesando imagen con Vertex AI vía Vercel Serverless...
                </div>
              )}

              {debugError && (
                <div className="mt-6 p-4 bg-rose-950/80 border border-rose-700 rounded-2xl text-left font-mono text-[11px] text-rose-200">
                  <strong className="block text-xs uppercase mb-1">⚠️ Diagnóstico:</strong>
                  {debugError}
                </div>
              )}

              {scanResult && !scanning && (
                <div className="mt-6 text-left space-y-4">
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-emerald-800/50">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase">✓ Opción Recomendada</span>
                      <span className="text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-mono uppercase">{scanResult.detected_era}</span>
                    </div>

                    <h3 className="font-bold text-sm text-white mt-1">{scanResult.primary_match.name}</h3>

                    {scanResult.primary_match.patent_marks && (
                      <div className="mt-2.5 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                        <strong className="text-amber-400 block mb-0.5 font-mono text-[10px]">🔎 Sellos de Patente Esperados (Espalda/Nuca):</strong>
                        <p className="font-mono text-[10px] text-zinc-200">{scanResult.primary_match.patent_marks}</p>
                      </div>
                    )}
                    
                    {scanResult.primary_match.lore && (
                      <div className="mt-2 p-2.5 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px] text-zinc-300">
                        <strong className="text-pink-400 block mb-0.5 font-mono text-[10px]">📜 Historia, Molde & Contexto:</strong>
                        <p className="leading-relaxed">{scanResult.primary_match.lore}</p>
                      </div>
                    )}

                    <div className="mt-2 text-xs text-zinc-400 space-y-1">
                      <p>Año de edición: <strong className="text-zinc-200">{scanResult.primary_match.release_year}</strong></p>
                      <p>Línea: <strong className="text-zinc-200">{scanResult.primary_match.collection_line}</strong></p>
                      <p>Tasación estimada: <strong className="text-emerald-400 font-mono">{formatPrice(scanResult.primary_match.estimated_min_price)}</strong></p>
                    </div>

                    <button 
                      onClick={() => {
                        setUserBarbieForm(prev => ({ ...prev, customPrice: scanResult.primary_match.estimated_min_price }));
                        setActiveModal({ type: 'add', barbie: scanResult.primary_match });
                      }}
                      className="mt-4 w-full bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs py-2.5 rounded-2xl transition shadow-md"
                    >
                      Registrar en Mi Vitrina con Fondo Blanco
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'directorio' && (
          <div className="max-w-5xl mx-auto">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl mb-6 text-center">
              <span className="text-[10px] font-mono font-bold bg-pink-950 border border-pink-800/50 text-pink-300 px-2.5 py-0.5 rounded-lg uppercase">
                {t.directory}
              </span>
              <h2 className="text-lg font-bold text-white mt-2">{t.dirTitle}</h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl mx-auto">
                {t.dirSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {directoryMembers.map((member, idx) => (
                <div key={idx} className="bg-zinc-900/90 border border-zinc-800/90 p-5 rounded-3xl flex flex-col justify-between hover:border-pink-900/50 hover:shadow-xl transition">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-mono font-bold bg-pink-600 text-white px-2.5 py-0.5 rounded-full uppercase">
                        {t.founderBadge}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">{member.country}</span>
                    </div>

                    <div className="flex items-center gap-3.5 mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${member.color} text-white font-bold flex items-center justify-center text-sm shadow-md`}>
                        {member.initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{member.handle}</h3>
                        <p className="text-[11px] text-pink-400 font-mono font-bold">{member.specialty}</p>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 mb-3 leading-relaxed">
                      "{member.bio}"
                    </p>

                    {member.sharedPhotos && (
                      <span className="text-[10px] text-emerald-400 font-mono block mb-3">
                        📷 {member.sharedPhotos} fotos aportadas al catálogo común
                      </span>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80">
                    <a 
                      href={member.instagram} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-pink-300 text-xs font-bold rounded-xl border border-zinc-700 transition"
                    >
                      {t.viewInsta}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'chollos' && (
          <div>
            <div className="mb-6 bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <span className="text-[10px] font-mono font-bold bg-pink-950 border border-pink-800/50 text-pink-300 px-2.5 py-0.5 rounded-lg uppercase">Oportunidades de Mercado</span>
              <h2 className="text-lg font-bold text-white mt-2">Al Mejor Precio</h2>
              <p className="text-xs text-zinc-400">Listados detectados por debajo del valor estimado razonable en plataformas europeas.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getDeals().map((deal, idx) => (
                <div key={idx} className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono px-2 py-0.5 rounded-lg font-bold">
                        -{deal.discountPercent}% DESCUENTO
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">{deal.platform}</span>
                    </div>
                    <img 
                      src={deal.image_url} 
                      alt={deal.name} 
                      onClick={() => setZoomedImage({ url: deal.image_url, title: deal.name })}
                      className="w-full h-36 object-contain mb-2 bg-white rounded-2xl p-2 cursor-zoom-in" 
                    />
                    <h3 className="font-bold text-xs text-white truncate">{deal.name}</h3>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <div className="flex justify-between items-baseline mb-3">
                      <span className="text-[10px] text-zinc-500 line-through font-mono">{formatPrice(deal.estimated_min_price)}</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">{formatPrice(deal.bargainPrice)}</span>
                    </div>

                    <a 
                      href={deal.searchUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white text-center font-bold text-[11px] py-2 rounded-2xl border border-zinc-700 transition"
                    >
                      Auditar Oferta Directa
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'catalog' && (
          <div>
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <input 
                type="text" 
                placeholder="Buscar por nombre, molde o línea..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:max-w-sm p-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
              <span className="text-[11px] font-mono text-zinc-400">
                ⏳ Cronología: <strong className="text-pink-400">1959 ➔ Actualidad</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredCatalog.map((barbie) => (
                <div key={barbie.id} className="bg-zinc-900 rounded-3xl p-3 border border-zinc-800/80 flex flex-col justify-between hover:border-pink-900/30 transition">
                  <div>
                    <img 
                      src={barbie.image_url} 
                      alt={barbie.name} 
                      onClick={() => setZoomedImage({ url: barbie.image_url, title: `${barbie.name} (${barbie.release_year})` })}
                      className="w-full h-36 object-contain mb-2 bg-white rounded-2xl p-2 cursor-zoom-in" 
                    />
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[9px] font-mono text-pink-400 font-bold uppercase block">{barbie.release_year} • {barbie.collection_line}</span>
                        <h3 className="font-bold text-xs text-white truncate">{barbie.name}</h3>
                      </div>

                      <button 
                        onClick={() => {
                          setEditingLoreItem(barbie);
                          setAdminLoreForm({ lore: barbie.lore || '', collection_line: barbie.collection_line || '', release_year: barbie.release_year || 1990 });
                        }}
                        className="text-[9px] text-pink-300 font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 hover:bg-pink-950"
                        title="Editar Ficha Técnica como Admin"
                      >
                        ✏️
                      </button>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">Ref: {formatPrice(barbie.estimated_min_price)}</span>
                  </div>
                  <button 
                    onClick={() => {
                      setUserBarbieForm(prev => ({ ...prev, customPrice: barbie.estimated_min_price }));
                      setActiveModal({ type: 'add', barbie });
                    }}
                    className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-pink-300 font-bold text-[11px] py-1.5 rounded-2xl border border-zinc-700 transition"
                  >
                    Registrar en Mi Vitrina
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {activeModal?.type === 'calculator' && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-md w-full shadow-2xl text-zinc-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-white">Vender & Calculadora de Márgenes Netos</h3>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 font-mono text-xs">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Plataforma de Desinversión</label>
                <select 
                  value={calcData.platform} 
                  onChange={(e) => setCalcData({ ...calcData, platform: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-200"
                >
                  <option value="vinted">Vinted (Vendedor 0% comisión)</option>
                  <option value="wallapop">Wallapop Directo (0%)</option>
                  <option value="ebay">eBay (12.8% + 0.35€ gestión)</option>
                  <option value="catawiki">Catawiki Subastas (12.5% comisión)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Precio Venta Objetivo ({currency === 'USD' ? '$' : '€'})</label>
                  <input 
                    type="number" 
                    value={calcData.salePrice}
                    onChange={(e) => setCalcData({ ...calcData, salePrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Coste Adquisición ({currency === 'USD' ? '$' : '€'})</label>
                  <input 
                    type="number" 
                    value={calcData.purchasePrice}
                    onChange={(e) => setCalcData({ ...calcData, purchasePrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {(() => {
                let commission = 0;
                if (calcData.platform === 'ebay') commission = (calcData.salePrice * 0.128) + 0.35;
                if (calcData.platform === 'catawiki') commission = calcData.salePrice * 0.125;

                const netProfit = calcData.salePrice - commission - calcData.purchasePrice - calcData.packagingCost;
                const marginPercent = calcData.purchasePrice > 0 ? ((netProfit / calcData.purchasePrice) * 100).toFixed(1) : 0;

                return (
                  <div className="mt-4 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-2">
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Comisión de Plataforma:</span>
                      <span className="font-mono text-pink-400">-{currency === 'USD' ? '$' : '€'}{commission.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-zinc-800 pt-2 flex justify-between items-baseline">
                      <span className="font-bold text-xs uppercase text-zinc-300">Rendimiento Neto:</span>
                      <span className="text-base font-bold font-mono text-emerald-400">{currency === 'USD' ? '$' : '€'}{netProfit.toFixed(2)} ({marginPercent}%)</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeModal?.type === 'adGenerator' && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-lg w-full shadow-2xl text-zinc-100">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Ficha Profesional para Venta</h3>
              <button onClick={() => setActiveModal(null)} className="text-zinc-400 font-mono text-xs">✕</button>
            </div>

            <textarea 
              rows="9"
              readOnly
              value={adCopyText}
              className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs font-mono text-zinc-300 mb-4 focus:outline-none"
            ></textarea>

            <div className="flex justify-end gap-2">
              <button onClick={() => setActiveModal(null)} className="px-3 py-2 text-xs text-zinc-400">
                Cerrar
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(adCopyText);
                  setCopiedStatus(true);
                  setTimeout(() => setCopiedStatus(false), 2000);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-pink-600 hover:bg-pink-500 rounded-2xl transition shadow-md"
              >
                {copiedStatus ? 'Copiado' : 'Copiar Ficha Técnica'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal?.type === 'exportPDF' && (
        <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md flex justify-center items-center p-4 z-50 print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white p-8 rounded-3xl max-w-3xl w-full shadow-2xl text-zinc-900 max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:rounded-none">
            
            <div className="border-b-2 border-zinc-900 pb-4 mb-6 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-zinc-900">LA VITRINA DEL COLECCIONISTA DE BARBIE</h2>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">INFORMES Y CERTIFICADOS • TASACIÓN OFICIAL</span>
              </div>
              <div className="text-right text-xs text-zinc-500 font-mono">
                <span>FECHA: {new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>

            <div className="bg-zinc-50 p-4 rounded-2xl mb-6 grid grid-cols-2 gap-4 text-xs border border-zinc-200">
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">TITULAR DE LA VITRINA</span>
                <strong className="text-zinc-800 text-xs font-mono">{session?.user?.email}</strong>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 font-bold block uppercase">VALOR MONETARIO EVALUADO</span>
                <strong className="text-zinc-900 text-sm font-mono">{formatPrice(totalCollectionValueEUR)}</strong>
              </div>
            </div>

            <table className="w-full text-left text-xs mb-6 border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Activo / Modelo</th>
                  <th className="py-2">Año</th>
                  <th className="py-2">Estado</th>
                  <th className="py-2 text-right">Tasación Real</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {myCollection.map((item, idx) => {
                  const price = Number(item.estimated_min_price) || calculateDynamicPrice(item);
                  return (
                    <tr key={idx}>
                      <td className="py-3">
                        <strong className="text-zinc-800 block text-xs">{item.name}</strong>
                        <span className="text-[10px] text-zinc-400">{item.collection_line}</span>
                      </td>
                      <td className="py-3 text-zinc-600 font-mono">{item.release_year}</td>
                      <td className="py-3 text-zinc-600 text-[10px]">{item.condition}</td>
                      <td className="py-3 text-right font-mono font-bold text-zinc-900">{formatPrice(price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex justify-between items-center print:hidden pt-4 border-t border-zinc-200">
              <button onClick={() => setActiveModal(null)} className="text-xs text-zinc-500 font-bold">Cerrar</button>
              <button onClick={() => window.print()} className="bg-zinc-900 text-white font-bold text-xs px-5 py-2.5 rounded-2xl shadow-md">
                Imprimir Documento PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal?.type === 'add' && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-zinc-100">
            <h3 className="text-sm font-bold text-white mb-1">Registrar Activo en Mi Vitrina</h3>
            <p className="text-xs text-zinc-400 mb-4">{activeModal.barbie.name}</p>

            <form onSubmit={handleAddToMyVitrina} className="space-y-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Precio Personalizado / Adquisición ({currency === 'USD' ? '$' : '€'})</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Ej: 35.00"
                  value={userBarbieForm.customPrice} 
                  onChange={(e) => setUserBarbieForm({ ...userBarbieForm, customPrice: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-100 font-mono focus:border-pink-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Cantidad</label>
                <input 
                  type="number" 
                  min="1" 
                  value={userBarbieForm.quantity} 
                  onChange={(e) => setUserBarbieForm({ ...userBarbieForm, quantity: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Estado de Conservación</label>
                <select 
                  value={userBarbieForm.condition} 
                  onChange={(e) => setUserBarbieForm({ ...userBarbieForm, condition: e.target.value })}
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-100"
                >
                  <option value="NFRB (Caja Original Precintada)">NFRB (Caja Original Precintada)</option>
                  <option value="NRFB (Abierta, Excelente)">NRFB (Abierta, Excelente)</option>
                  <option value="Loose (Sin Caja)">Loose (Sin Caja)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                <label className="flex items-center gap-2 text-[11px] text-pink-300 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={userBarbieForm.allowPublicMedia}
                    onChange={(e) => setUserBarbieForm({ ...userBarbieForm, allowPublicMedia: e.target.checked })}
                    className="accent-pink-600 rounded"
                  />
                  Permitir uso libre de esta imagen procesada en el catálogo común
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-2 text-xs text-zinc-400">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-pink-600 rounded-2xl hover:bg-pink-500 transition shadow-md">
                  Guardar en Mi Vitrina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}