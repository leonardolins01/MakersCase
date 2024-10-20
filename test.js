
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

const testResponse = "Confirmation: Do you confirm the purchase of: Apple MacBook Pro, $2499, Apple M2, Integrated 10-core GPU, 20 hours? Please answer yes or no.";
const isProcessed = processConfirmation(testResponse);

console.log("Test 1 - processConfirmation Result:", isProcessed);
console.log("Test 1 - lastSaleData:", lastSaleData);
const userResponse = "yes";
const saleConfirmation = processYes(userResponse);
console.log("Test 2 - processYes Result:", saleConfirmation);
// console.log("Hello, World!");
