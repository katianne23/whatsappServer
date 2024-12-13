// const express = require('express');
// const { Client } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');
// const socketIo = require('socket.io');
// const http = require('http');
// const { PrismaClient } = require('@prisma/client'); // Importa o cliente do Prisma

// // Inicialize o cliente do Prisma
// const prisma = new PrismaClient();

// // Crie o servidor Express
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);

// // Crie um cliente do WhatsApp
// const client = new Client();

// // Quando o cliente gerar o QR Code, envie para o frontend via WebSocket
// client.on('qr', (qr) => {
//     console.log('QR Code gerado');
//     io.emit('qr', qr);  // Envia o QR Code para o frontend
// });

// // Quando o cliente estiver pronto
// client.on('ready', () => {
//     console.log('O cliente está pronto!');
// });

// // Captura de mensagens
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


// // Inicialize o cliente do WhatsApp Web
// client.initialize();

// // Servir a página frontend (no diretório public)
// app.use(express.static('public'));

// // Iniciar o servidor na porta 3000
// server.listen(3000, () => {
//     console.log('Servidor rodando na porta 3000');
// });


const express = require('express');
const { Client } = require('whatsapp-web.js');
const { PrismaClient } = require('@prisma/client');
const qrcode = require('qrcode-terminal');

// Inicialize o cliente do Prisma
const prisma = new PrismaClient();

// Crie o aplicativo Express
const app = express();
app.use(express.json());

// Inicialize o cliente WhatsApp
const client = new Client();

// Variável para armazenar o QR code
let qrCode;

// Quando o QR code for gerado, salve-o na variável
client.on('qr', (qr) => {
    console.log('QR Code gerado');
    qrCode = qr; // Armazena o QR code para o endpoint de frontend
});

// Quando o cliente estiver pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp pronto!');
});

// Captura de mensagens
client.on('message', async (message) => {
    console.log('Mensagem recebida: ', message.body);

    const senderNumber = message.from.split('@')[0];
    const countryCode = senderNumber.slice(0, 2);
    const areaCode = senderNumber.slice(2, 4);
    const phoneNumber = senderNumber.slice(4);

    console.log(`Número: +${countryCode} (${areaCode}) ${phoneNumber}`);

    try {
        // Verifique se o contato já existe no banco
        const existingContact = await prisma.contact.findUnique({
            where: { phoneNumber },
        });

        if (existingContact) {
            console.log('Contato já existe no banco');
            return;
        }

        const contact = await client.getContactById(message.from);
        const contactName = contact.pushname || 'Nome não disponível';

        // Adicione ao banco
        await prisma.contact.create({
            data: {
                name: contactName,
                countryCode,
                areaCode,
                phoneNumber,
            },
        });

        console.log('Contato salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar contato:', error);
    }
});

// Inicialize o cliente
client.initialize();

// Endpoint para obter o QR code
app.get('/qr', (req, res) => {
    if (qrCode) {
        qrcode.toDataURL(qrCode, (err, src) => {
            if (err) return res.status(500).send('Erro ao gerar QR code');
            res.send(`<img src="${src}">`);
        });
    } else {
        res.status(404).send('QR code ainda não gerado');
    }
});

// Inicie o servidor (para ambientes como Vercel)
module.exports = app;
