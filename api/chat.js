import { GoogleGenAI } from '@google/genai';
import googleTTS from 'google-tts-api';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido.');
    }

    try {
        const aiKey = "AQ.Ab8RN6K4Os398ng0ySLh5qob2bfMjmwxZIQlYLmgD1Q2_nVcTA"; 
        const ai = new GoogleGenAI({ apiKey: aiKey });

        // 1. Recibir el audio capturado por el micrófono de Stack-chan
        const chunks = [];
        for await (const chunk of req) {
            chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        // 2. Procesar el audio con Gemini 1.5 Flash
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [
                {
                    inlineData: {
                        data: audioBuffer.toString("base64"),
                        mimeType: "audio/pcm;rate=16000"
                    }
                },
                'Eres Bimo, un asistente embebido en un robot. Escucha el audio y responde en español de forma ultra corta, máximo 8 palabras.'
            ],
        });

        let replyText = response.text || "No entendí.";
        replyText = replyText.replace(/\n/g, " ").trim();
        console.log("Respuesta Gemini:", replyText);

        // 3. Convertir el texto a audio hablado (Voz en Español)
        const base64AudioVoice = await googleTTS.getAudioBase64(replyText, {
            lang: 'es',
            slow: false,
            host: 'https://google.com',
            timeout: 10000,
        });

        const audioVoiceBuffer = Buffer.from(base64AudioVoice, 'base64');

        // 4. Devolver el stream de audio hablado al altavoz del robot
        res.setHeader('Content-Type', 'application/octet-stream');
        return res.status(200).send(audioVoiceBuffer);

    } catch (error) {
        console.error("Error en el Puente:", error);
        return res.status(500).send("ERR: FALLO PUENTE");
    }
}
