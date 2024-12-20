const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const socketIo = require('socket.io');
const http = require('http');
const { PrismaClient } = require('@prisma/client'); // Importa o cliente do Prisma

// Inicialize o cliente do Prisma
const prisma = new PrismaClient();

// Crie o servidor Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Crie um cliente do WhatsApp
const client = new Client();

// Quando o cliente gerar o QR Code, envie para o frontend via WebSocket
client.on('qr', (qr) => {
    console.log('QR Code gerado');
    io.emit('qr', qr);  // Envia o QR Code para o frontend
});

// Quando o cliente estiver pronto
client.on('ready', () => {
    console.log('O cliente está pronto!');
    io.emit('ready', true);
});

// Captura de mensagens
// client.on('message', async (message) => {
//     console.log('Mensagem recebida: ', message.body);

//     // Obtemos o número do remetente
//     const senderNumber = message.from; // Exemplo: '5531999999999@c.us'
//     const sanitizedNumber = senderNumber.split('@')[0]; // Remove "@c.us"
//     const countryCode = sanitizedNumber.slice(0, 2); // Código do país
//     const areaCode = sanitizedNumber.slice(2, 4); // Código de área/DDD
//     const phoneNumber = sanitizedNumber.slice(4); // Número do telefone

//     console.log(`Número formatado: +${countryCode} (${areaCode}) ${phoneNumber}`);

//     try {
//         // Verifica se o contato já existe no banco de dados
//         const existingContact = await prisma.contact.findUnique({
//             where: {
//                 phoneNumber: phoneNumber,
//             },
//         });

//         if (existingContact) {
//             console.log('Contato já existe no banco de dados:', existingContact);
//             return; // Se o contato já existe, encerra a execução
//         }

//         // Captura o nome do contato através do número do remetente
//         const contact = await client.getContactById(senderNumber);
//         const contactName = contact.pushname || 'Não disponível'; // Nome do contato ou 'Não disponível'

//         console.log('Nome do remetente:', contactName);

//         // Salva as informações no banco de dados
//         await prisma.contact.create({
//             data: {
//                 name: contactName,
//                 countryCode: countryCode,
//                 areaCode: areaCode,
//                 phoneNumber: phoneNumber,
//             },
//         });

//         console.log('Contato salvo no banco de dados com sucesso!');
//     } catch (error) {
//         console.log('Erro ao processar o contato:', error);
//     }
// });

client.on('message', async (message) => {
    console.log('Mensagem recebida: ', message.body);

    // Verificar se a mensagem é de um grupo
    if (message.from.includes('@g.us')) {
        console.log('Mensagem de grupo, ignorando...');
        return; // Ignorar mensagens de grupos
    }

    // Obtemos o número do remetente
    const senderNumber = message.from; // Exemplo: '5531999999999@c.us'
    const sanitizedNumber = senderNumber.split('@')[0]; // Remove "@c.us"
    const countryCode = sanitizedNumber.slice(0, 2); // Código do país
    const areaCode = sanitizedNumber.slice(2, 4); // Código de área/DDD
    const phoneNumber = sanitizedNumber.slice(4); // Número do telefone

    console.log(`Número formatado: +${countryCode} (${areaCode}) ${phoneNumber}`);

    try {
        // Verifica se o contato já existe no banco de dados
        const existingContact = await prisma.contact.findUnique({
            where: {
                phoneNumber: phoneNumber,
            },
        });

        if (existingContact) {
            console.log('Contato já existe no banco de dados:', existingContact);
            return; // Se o contato já existe, encerra a execução
        }

        // Captura o nome do contato através do número do remetente
        const contact = await client.getContactById(senderNumber);
        const contactName = contact.pushname || 'Não disponível'; // Nome do contato ou 'Não disponível'

        console.log('Nome do remetente:', contactName);

        // Salva as informações no banco de dados
        await prisma.contact.create({
            data: {
                name: contactName,
                countryCode: countryCode,
                areaCode: areaCode,
                phoneNumber: phoneNumber,
            },
        });

        console.log('Contato salvo no banco de dados com sucesso!');
    } catch (error) {
        console.log('Erro ao processar o contato:', error);
    }
});


// Inicialize o cliente do WhatsApp Web
client.initialize();

// Servir a página frontend (no diretório public)
app.use(express.static('public'));

// Iniciar o servidor na porta 3000
server.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});


