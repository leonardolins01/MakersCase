// Import dependencies using ESM syntax
import 'dotenv/config'; // Substitui require('dotenv').config();
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import fs from 'fs';
import { OpenAI } from 'openai';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Import custom utilities
import { loadProductInfo, processConfirmation, processYes, recordSale, lastSaleData } from './utils.js';

// Set up __dirname in ESM (necessary since __dirname is not defined in ESM by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const app = express();

// API key for OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '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',
});

// Middleware for static files and JSON body parsing
app.use(express.static(path.join(__dirname)));
app.use(bodyParser.json());

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to process chat messages
app.post('/chat', async (req, res) => {
    const { prompt } = req.body;
    const sellResponse = processYes(prompt);

    if (sellResponse === "Sale confirmed. Can I help you with anything else?") {
        // If the user confirmed the sale, record the sale and don't send the message to OpenAI
        res.json({ reply: sellResponse });
        return;
    }

    const productInfo = loadProductInfo();

    const modifiedPrompt = `
    don't you any word modification in the response like bold, italic, underline, etc.
    
    Here is the information about products that you can access: ${productInfo}
    
    The available computer brands are: Apple, Dell, HP, Acer, Samsung, Asus.
    
    I will name the product information as: [name], [price], [processor], [graphics card], [battery life].

    The user can request product recommendations based on their preferences, such as: battery, performance, screen size, brand, processor type, graphics card, among others. To do so, evaluate which product fits the user's request. If there are no matching recommendations, say: "We don't have products that meet your request, but we have similar products such as:" and complete with the product closest to the request.

    Always provide a maximum of 2 product suggestions per response.

    When the customer wants to buy a product, just say the confirm message without any other information, dont send the quotes: "Confirmation: Do you confirm the purchase of: [name], [price], [processor], [graphics card], [battery life]? Please answer yes or no."
    
    In case of the customer confirming the purchase thank him and offer help with later purchases
    
    if the client says "yes" just thank him and ask if he needs help with anything else
    
    if the client say "yes" and you don't have any information just say "ok, can I help you with anything else?"
    
    User's question: ${prompt}
  `;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Use GPT-4o.
            messages: [{ role: "user", content: modifiedPrompt }],
        });

        const chatResponse = response.choices[0].message.content;
        const isConfirmed = processConfirmation(chatResponse);

        res.json({ reply: chatResponse });

    } catch (error) {
        console.error("Error to call the API:", error);
        res.status(500).json({ error: 'Solicitation Error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
