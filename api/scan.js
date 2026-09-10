import { removeBackground } from '@imgly/background-removal-node';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, mimeType, prompt } = req.body;

    // 1. Recorte de la silueta en el servidor de Vercel (Gratis e Ilimitado)
    let processedImageBase64 = null;
    try {
      const imageBuffer = Buffer.from(imageBase64, 'base64');
      const blob = new Blob([imageBuffer], { type: mimeType || 'image/jpeg' });
      
      const cutoutBlob = await removeBackground(blob);
      const cutoutArrayBuffer = await cutoutBlob.arrayBuffer();
      const cutoutBuffer = Buffer.from(cutoutArrayBuffer);
      
      processedImageBase64 = `data:image/png;base64,${cutoutBuffer.toString('base64')}`;
    } catch (bgError) {
      console.warn('Fondo mantenido por contingencia:', bgError);
    }

    // 2. Consulta a Gemini para la identificación documental
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: imageBase64 } }
          ]
        }]
      })
    });

    const data = await response.json();

    // 3. Devolver la respuesta identificada junto con la imagen recortada
    return res.status(200).json({
      ...data,
      processedImageBase64: processedImageBase64 || `data:${mimeType};base64,${imageBase64}`
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}