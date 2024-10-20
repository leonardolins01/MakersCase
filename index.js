// Carregar variáveis de ambiente
require('dotenv').config();

// Importar dependências
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const OpenAI = require('openai');
const app = express();

let lastSaleData = null;

// Configurar a chave da API do OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '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',
});

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

// Função para registrar vendas no arquivo sells.txt no mesmo formato do arquivo products.txt
function recordSale(product, quantitySold) {
    // Formatação da venda no estilo de products.txt
    const saleInfo = `${quantitySold}, ${product.name}, $${product.price}, ${product.processor}, ${product.graphics_card}, ${product.battery_life}\n`;

    try {
        // Usar 'fs.appendFileSync' para adicionar a venda ao arquivo sells.txt
        fs.appendFileSync(path.join(__dirname, 'sells.txt'), saleInfo, 'utf8');
        console.log('Venda registrada com sucesso!');
    } catch (error) {
        console.error('Erro ao registrar a venda:', error);
    }
}

// Função para verificar se a resposta do GPT começa com "Confirmation" e extrair informações
function processConfirmation(response) {
    if (response.startsWith("Confirmation")) {
        // Atualizar o regex para capturar o formato correto da mensagem de confirmação
        const regex = /Confirmation: Do you confirm the purchase of: ([\w\s]+), \$([\d.,]+), ([\w\s]+), ([\w\s-]+), ([\w\s]+)\?/;
        const match = response.match(regex);

        if (match) {
            // Capturar as informações da venda
            const product = {
                name: match[1],
                price: parseFloat(match[2].replace(',', '')),
                processor: match[3],
                graphics_card: match[4],
                battery_life: match[5],
            };

            // Armazenar as informações da venda para uso posterior, com quantidade padrão de 1
            lastSaleData = { product, quantity: 1 };
            return true;  // Indicar que a venda foi processada
        }
    }
    return false;  // Nenhuma confirmação de venda foi processada
}

// Função para verificar se a resposta do usuário começa com "yes" e ativar a função recordSale
function processYes(userResponse) {
    if (userResponse.trim().toLowerCase().startsWith('yes')) {
        if (lastSaleData) {
            // Chamar a função recordSale com os dados armazenados
            const { product, quantity } = lastSaleData;
            recordSale(product, quantity);
            lastSaleData = null; // Limpar os dados após a venda ser registrada
            return "Sale confirmed and recorded.";
        } else {
            return "No sale data available to record.";
        }
    }
    return "Sale not confirmed.";
}

// Middleware para servir arquivos estáticos (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Rota principal para exibir o frontend (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint para lidar com o envio de mensagens do frontend e responder usando a API do ChatGPT
app.post('/chat', async (req, res) => {
    // Log para verificar se o corpo da requisição foi recebido corretamente
    console.log("Received request body:", req.body);

    const { prompt } = req.body;

    // Log para verificar se o prompt foi extraído corretamente
    console.log(prompt);

    // Chamar a função processYes e verificar o resultado
    const sellResponse = processYes(prompt);
    console.log("Result of processYes:", sellResponse);

    if (sellResponse === "Sale confirmed and recorded.") {
        // Se a venda for confirmada, envie a resposta de confirmação e não chame o ChatGPT
        console.log("Sale confirmed, sending response:", sellResponse);
        res.json({ reply: sellResponse });
        return;
    }

    // Log para verificar se chegamos até aqui, ou seja, o ChatGPT precisa ser chamado
    console.log("Calling ChatGPT...");

    // Carregar as informações dos produtos
    const productInfo = loadProductInfo();
    console.log("Loaded product info:", productInfo);

    // Modificar o prompt para incluir as informações dos produtos
    const modifiedPrompt = `
    
    don't you any word modification in the response like bold, italic, underline, etc.
    
    Here is the information about products that you can access: ${productInfo}
    
    The available computer brands are: Apple, Dell, HP, Acer, Samsung, Asus.
    
    I will name the product information as: [name], [price], [processor], [graphics card], [battery life].

    The user can request product recommendations based on their preferences, such as: battery, performance, screen size, brand, processor type, graphics card, among others. To do so, evaluate which product fits the user's request. If there are no matching recommendations, say: "We don't have products that meet your request, but we have similar products such as:" and complete with the product closest to the request.

    Always provide a maximum of 2 product suggestions per response.

    When the customer wants to buy a product, confirm with the following: "Confirmation: Do you confirm the purchase of: [name], [price], [processor], [graphics card], [battery life]? Please answer yes or no."
    
    In case of the customer confirming the purchase thank him and offer help with later purchases
    
    User's question: ${prompt}
    
  `;

    try {
        // Chamar a API do OpenAI e logar a requisição
        console.log("Sending request to OpenAI API with modifiedPrompt...");

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: modifiedPrompt }],
        });

        // Log para verificar a resposta do ChatGPT
        console.log("Received response from OpenAI:", response);

        const chatResponse = response.choices[0].message.content;
        console.log("Extracted chatResponse:", chatResponse);

        // Verificar se a resposta começa com "Confirmation" e processar
        const isConfirmed = processConfirmation(chatResponse);
        console.log("Result of processConfirmation:", isConfirmed);

        // Enviar a resposta do ChatGPT de volta ao frontend
        console.log("Sending final reply to frontend:", chatResponse);
        res.json({ reply: chatResponse });

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

