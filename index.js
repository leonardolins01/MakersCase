// Carregar variáveis de ambiente
require('dotenv').config();

// Importar dependências
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const OpenAI = require('openai');
const app = express();



// Função para carregar o conteúdo do arquivo products.txt
function loadProductInfo() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'products.txt'), 'utf8');
        return data; // Retorna o conteúdo do arquivo como uma string
    } catch (err) {
        console.error('Erro ao ler o arquivo products.txt:', err);
        return ''; // Se ocorrer um erro, retorna uma string vazia
    }
}

function parseProductLine(productLine) {
    // Separar a string pelo delimitador de vírgula e remover espaços extras
    const parts = productLine.split(',').map(part => part.trim());

    // Remover a quantidade (primeiro elemento) e atribuir os outros valores
    const [ , name, priceWithSymbol, processor, graphicsCard, batteryLife] = parts;

    // Remover o símbolo de dólar ($) do preço e converter para número
    const price = parseFloat(priceWithSymbol.replace('$', '').trim());

    // Retornar o objeto com as informações do produto
    return {
        name: name,
        price: price,
        processor: processor,
        graphics_card: graphicsCard,
        battery_life: batteryLife
    };
}


// Função para registrar vendas no arquivo sells.txt no mesmo formato do arquivo products.txt
function recordSale(product, quantitySold) {
    // Formatação da venda no estilo de products.txt
    const saleInfo = `${quantitySold}, ${product.name}, $${product.price}, ${product.processor}, ${product.graphics_card}, ${product.battery_life}\n`;

    try {
        // Usar 'fs.appendFileSync' para adicionar a venda ao arquivo sells.txt
        fs.appendFileSync(path.join(__dirname, 'sells.txt'), saleInfo, 'utf8');
        console.log('Venda registrada com sucesso!');
    } catch (err) {
        console.error('Erro ao registrar a venda:', err);
    }
}


// Configurar a chave da API do OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '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',
});

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Rota principal para exibir o frontend (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para lidar com o envio de mensagens do frontend e responder usando a API do ChatGPT
app.post('/chat', async (req, res) => {
    const { prompt } = req.body;

    // local onde insere-se as informações do product.txt

    const productInfo = loadProductInfo();

    // Modificar o prompt para incluir as informações dos produtos
    const modifiedPrompt = `
    
    
    Here is the information about products that you can access: ${productInfo}

    Within this database, the product information is formatted as follows: quantity, name, price, processor, graphics card, battery life.

    The user can request product recommendations based on their preferences, such as: battery, performance, screen size, brand, processor type, graphics card, among others. To do so, evaluate which product fits the user's request. If there are no matching recommendations, say: "We don't have products that meet your request, but we have similar products such as:" and complete with the product closest to the request.

    Always provide a maximum of 2 product suggestions.

    The available computer brands are: Apple, Dell, HP, Acer, Samsung, Asus.
    
    When the customer accepts the order, ask: Do you want this product?.
    
    User's question: ${prompt}
    
  `;


    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: modifiedPrompt }],
        });

        // Enviar a resposta do ChatGPT de volta ao frontend
        res.json({ reply: response.choices[0].message.content });

        const chatResponse = response.choices[0].message.content;

        const confirmSaleRegex = /confirm the sale of (\d+) of (.+?) computer for the value of \$(\d+\.?\d*) each/;
        const match = chatResponse.match(confirmSaleRegex);


    } catch (error) {
        console.error("Erro ao chamar a API:", error);
        res.status(500).json({ error: 'Solicitation Error' });
    }
});

// Definir a porta e iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
