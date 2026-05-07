const { GoogleGenerativeAI } = require('@google/generative-ai');

const FALLBACK_PRICE_RANGES = {
  textbooks: { min: 10, max: 60 },
  electronics: { min: 20, max: 300 },
  furniture: { min: 15, max: 200 },
  clothing: { min: 5, max: 50 },
  sports: { min: 10, max: 100 },
  other: { min: 5, max: 50 },
};

const fetchImageAsBase64 = async (imageUrl) => {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error('Failed to fetch image from URL');
  const buffer = await res.arrayBuffer();
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { base64: Buffer.from(buffer).toString('base64'), mimeType };
};

const analyzeWithGemini = async (base64Image, mimeType, category) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const categoryHint = category ? `The seller categorized this as: ${category}.` : '';

  const prompt = `You are an expert college student marketplace assistant. Carefully analyze this product image.

${categoryHint}

Your tasks:
1. Identify exactly what the item is (be specific — e.g. "Nike Air Force 1 sneakers" not just "shoes")
2. Detect the brand, model, or any visible logo/text. If none visible, say "unbranded"
3. Estimate a realistic second-hand resale price range for college students based on brand and visible condition
4. Write an attractive, honest product listing

Respond in this EXACT format only, no extra text:
Brand: <brand name, or "unbranded">
Title: <specific catchy title, max 8 words>
Description: <2-3 sentences, mention brand, condition, and why great for students>
PriceMin: <number only, USD>
PriceMax: <number only, USD>`;

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64Image } },
  ]);

  return result.response.text().trim();
};

const parseResponse = (text, category) => {
  const brandMatch = text.match(/Brand:\s*(.+)/i);
  const titleMatch = text.match(/Title:\s*(.+)/i);
  const descMatch = text.match(/Description:\s*([\s\S]+?)(?=PriceMin:|$)/i);
  const minMatch = text.match(/PriceMin:\s*(\d+)/i);
  const maxMatch = text.match(/PriceMax:\s*(\d+)/i);

  const fallback = FALLBACK_PRICE_RANGES[category] || FALLBACK_PRICE_RANGES.other;
  const brand = brandMatch?.[1]?.trim() || null;

  return {
    brand: brand?.toLowerCase() === 'unbranded' ? null : brand,
    title: titleMatch?.[1]?.trim() || null,
    description: descMatch?.[1]?.trim() || null,
    suggestedPrice: {
      min: minMatch ? parseInt(minMatch[1]) : fallback.min,
      max: maxMatch ? parseInt(maxMatch[1]) : fallback.max,
    },
  };
};

const generateFromImage = async (imageUrl, category = null) => {
  let imageData;
  try {
    imageData = await fetchImageAsBase64(imageUrl);
  } catch (err) {
    return { basic: null, enhanced: null, captionError: 'Failed to load image: ' + err.message };
  }

  try {
    const raw = await analyzeWithGemini(imageData.base64, imageData.mimeType, category);
    const enhanced = parseResponse(raw, category);
    return { basic: raw, enhanced };
  } catch (err) {
    console.error('Gemini analysis failed:', err.message);
    return { basic: null, enhanced: null, captionError: 'AI analysis failed: ' + err.message };
  }
};

module.exports = { generateFromImage };
