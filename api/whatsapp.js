
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { PrismaClient } = require('@prisma/client'); // Importa o cliente do Prisma

// Inicialize o cliente do Prisma
const prisma = new PrismaClient();

// Crie um cliente do WhatsApp
const client = new Client();

client.on('qr', async (qr) => {
    console.log('QR Code gerado');
    const qrCodeData = await qrcode.toDataURL(qr); // Gera uma URL de QR code
    // Salve o QR em algum armazenamento persistente ou envie via WebSocket
});

client.on('ready', () => {
    console.log('O cliente está pronto!');
});

// Captura de mensagens
client.on('message', async (message) => {
    console.log('Mensagem recebida: ', message.body);

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

module.exports = (req, res) => {
    res.status(200).json({ message: 'API funcionando!' });
};
