export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtiene la clave configurada en las variables de Vercel
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la clave API en las variables de entorno de Vercel.' });
  }

  try {
    const { imageBase64, mimeType } = req.body;

    const promptText = `
      Actúa como perito experto en catalogación de muñecas Barbie de Mattel.
      Analiza la fotografía y detecta el contorno exacto de la caja o muñeca.
      Devuelve ÚNICAMENTE un objeto JSON en texto plano sin bloques markdown:
      {
        "detected_era": "Vintage / Moderna",
        "box_2d": [100, 100, 900, 900],
        "primary_match": {
          "name": "Nombre exacto del modelo",
          "release_year": 2020,
          "collection_line": "Línea de colección",
          "estimated_min_price": 45,
          "lore": "Breve contexto e historia del modelo.",
          "patent_marks": "Marcas de patente esperadas"
        }
      }
    `;

    const requestBody = {
      contents: [{
        parts: [
          { text: promptText },
          { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } }
        ]
      }]
    };

    // Petición directa usando el parámetro key en la URL para evitar el error de OAuth 2.0
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error en respuesta de Gemini API' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: `Error en servidor: ${error.message}` });
  }
}