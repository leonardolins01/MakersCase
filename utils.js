// Import the necessary modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM doesn't have __dirname by default, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let lastSaleData = null;

// Function to read the products.txt file and return its content as a string
function loadProductInfo() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'products.txt'), 'utf8');
        return data;
    } catch (err) {
        console.error('Error to read products.txt:', err);
        return '';
    }
}

// Function to register sales in the sells.txt file in the same format as the products.txt file
function recordSale(product, quantitySold) {
    // Formatação da venda, incluindo o parâmetro "company" no final
    const saleInfo = `${quantitySold}, ${product.name}, $${product.price}, ${product.processor}, ${product.graphics_card}, ${product.battery_life}, ${product.company}\n`;

    try {
        // Registrar a venda no arquivo sells.txt
        fs.appendFileSync(path.join(__dirname, 'sells.txt'), saleInfo, 'utf8');
        console.log('Registration successful!');
    } catch (error) {
        console.error('Error to register the sale:', error);
    }
}


function processConfirmation(response) {
    if (response.startsWith("Confirmation")) {
        // Use Regex
        const regex = /Confirmation: Do you confirm the purchase of: ([\w\s]+), \$([\d.,]+), ([\w\s]+), ([\w\s-]+), ([\w\s]+)\?/;
        const match = response.match(regex);

        if (match) {
            // Capturar o nome do produto
            const name = match[1];
            // Capturar a primeira palavra do nome como a "company"
            const company = name.split(' ')[0]; // Divide a string e pega a primeira palavra

            // Capturar as demais informações
            const product = {
                name: name,
                price: parseFloat(match[2].replace(',', '')),
                processor: match[3],
                graphics_card: match[4],
                battery_life: match[5],
                company: company  // Adiciona a empresa com base na primeira palavra do nome
            };

            // Armazenar as informações da venda para uso posterior, com uma quantidade padrão de 1
            lastSaleData = { product, quantity: 1 };
            return true;  // Indica que a venda foi processada
        }
    }
    return false;  // Nenhuma confirmação de venda foi processada
}

// Function to process the user response to confirm the sale
function processYes(userResponse) {
    if (userResponse.trim().toLowerCase().startsWith('yes')) {
        if (lastSaleData) {
            // Record the sale
            const { product, quantity } = lastSaleData;
            recordSale(product, quantity);
            lastSaleData = null;
            return "Sale confirmed. Can I help you with anything else?";
        } else {
            return "No sale data available to confirm.";
        }
    }
    return "Sale not confirmed.";
}

export { loadProductInfo, processConfirmation, processYes, recordSale, lastSaleData };
