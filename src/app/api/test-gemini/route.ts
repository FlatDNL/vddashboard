import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { apiKey } = body

    if (!apiKey) {
      return NextResponse.json({ success: false, message: 'Nenhum token fornecido.' }, { status: 400 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    let result = null

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" })
      result = await model.generateContent("Diga 'OK' se estiver funcionando.")
    } catch (e1: any) {
      // Se falhar com 404, vamos tentar buscar a lista de modelos disponíveis
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        const availableModels = data.models ? data.models.map((m: any) => m.name).join(', ') : 'Nenhum modelo listado';
        
        return NextResponse.json({ 
          success: false, 
          message: `Erro 404 no modelo. Modelos disponíveis para sua chave: ${availableModels}` 
        }, { status: 400 })
      } catch (eList) {
        throw e1 // Lança o erro original se não conseguirmos listar
      }
    }
    
    const text = result?.response?.text()

    if (text) {
      return NextResponse.json({ success: true, message: 'Token válido e conectado com sucesso!' })
    } else {
      return NextResponse.json({ success: false, message: 'Resposta vazia da API.' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Test Gemini Error:', error)
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erro ao validar o token. Verifique se ele está correto e ativo.' 
    }, { status: 500 })
  }
}
