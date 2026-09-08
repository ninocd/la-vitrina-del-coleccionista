export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey = process.env.VITE_GEMINI_API_KEY || "";
  const projectId = "919835647664";

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta configurar la variable VITE_GEMINI_API_KEY en Vercel.' });
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
          "release_year": 1990,
          "collection_line": "Línea de colección (ej. Fashionistas Inclusión, Collector)",
          "estimated_min_price": 45,
          "lore": "Historia completa, molde facial y variaciones entre edición americana y europea.",
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

    // Petición desde el servidor Vercel a Vertex AI
    const response = await fetch(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/gemini-1.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Error en Vertex AI' });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}