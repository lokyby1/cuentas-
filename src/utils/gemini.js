import { GoogleGenerativeAI } from '@google/generative-ai';

// Instancia de chat para mantener el contexto de la conversación
let chatSession = null;

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0);
};

export const initGeminiChat = (apiKey, financeData) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `Eres el "Asistente Inteligente de Finanzas Corp", un asesor financiero personal experto, empático y directo. 
Tu objetivo es ayudar al usuario a administrar su dinero, salir de deudas y organizar sus gastos fijos de manera óptima y profesional.

REGLAS IMPORTANTES:
1. Respuestas concisas: Sé directo. Usa listas (bullet points) y destaca los números importantes en negrita.
2. Basado en datos reales: Utiliza la información financiera del usuario que se te proporciona para dar respuestas personalizadas.
3. No des opciones si no te las piden, da recomendaciones claras (ej: "Te recomiendo pagar primero la tarjeta X porque...").
4. Mantén un tono profesional pero amable y motivador.
5. Puedes usar emojis esporádicamente para hacer la lectura más amena.
6. Limítate a temas financieros. Si el usuario pregunta algo no relacionado, recuérdale con educación que eres un asesor financiero.

ESTADO FINANCIERO ACTUAL DEL USUARIO:
- Bolsa de Ahorro Disponible: ${formatCurrency(financeData.walletBalance)}
- Total Deudas Registradas: ${financeData.debts.length}
- Total Gastos Fijos Registrados: ${financeData.fixedExpenses.length}

DETALLE DE DEUDAS:
${financeData.debts.map(d => `- ${d.name} (Categoría: ${d.category}): Saldo Actual ${formatCurrency(d.currentBalance)}, Tasa de Interés: ${d.interestRate || 0}%, Fecha Límite: ${d.paymentDate}`).join('\n') || 'Ninguna registrada.'}

DETALLE DE GASTOS FIJOS:
${financeData.fixedExpenses.map(e => `- ${e.name} (${e.frequency}): ${formatCurrency(e.amount)}, Próximo Cobro: ${e.dueDate}`).join('\n') || 'Ninguno registrado.'}

Responde a la consulta del usuario basándote en estos datos.`;

    chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "SYSTEM INSTRUCTION: " + systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Soy el Asistente Inteligente de Finanzas Corp. Responderé de manera concisa, basándome estrictamente en tu estado financiero actual y te ayudaré a optimizar tu pago de deudas y manejo de gastos. ¿En qué te puedo ayudar hoy?" }],
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    return true;
  } catch (error) {
    console.error("Error inicializando Gemini:", error);
    return false;
  }
};

export const askGemini = async (prompt) => {
  if (!chatSession) {
    throw new Error("El chat no ha sido inicializado. Verifica tu API Key de Gemini.");
  }
  
  try {
    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error llamando a Gemini:", error);
    throw new Error("Hubo un error de comunicación con el asistente. Intenta de nuevo más tarde o verifica tu API Key.");
  }
};
