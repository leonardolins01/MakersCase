const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');

// Função para adicionar a mensagem na interface
function addMessage(content, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    const messageContent = document.createElement('div');
    messageContent.classList.add('message-text');
    messageContent.textContent = content;
    messageDiv.appendChild(messageContent);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

sendBtn.addEventListener('click', function() {
    const messageText = messageInput.value.trim();

    if (messageText) {
        // Adicionar mensagem do usuário na interface
        addMessage(messageText, 'sent');

        // Enviar a mensagem para o servidor
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: messageText }),
        })
            .then(response => response.json())
            .then(data => {
                // Adicionar a resposta do ChatGPT na interface
                addMessage(data.reply, 'received');
            })
            .catch(error => console.error('Erro:', error));

        // Limpar o campo de entrada
        messageInput.value = '';
    }
});
