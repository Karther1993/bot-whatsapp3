const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => qrcode.generate(qr, { small: true }));

client.on('ready', () => console.log('✅ Bot conectado correctamente a WhatsApp!'));

client.on('message', async msg => {
    const texto = msg.body.trim();

    if (texto.toLowerCase().startsWith('aviso')) {
        const chat = await msg.getChat();

        if (!chat.isGroup) {
            return msg.reply('❌ Este comando solo funciona en grupos.');
        }

        // Obtener ID del remitente de forma confiable
        let senderId = msg.author || msg.from;

        // Buscar participante que coincida con el remitente
        const participants = chat.participants;
        let senderParticipant = participants.find(p => p.id._serialized === senderId);

        // Si no se encuentra, intentar por número (fallback)
        if (!senderParticipant) {
            const contact = await msg.getContact();
            senderParticipant = participants.find(p => p.id.user === contact.number);
        }

        // Verificar si es admin
        const isAdmin = senderParticipant && (senderParticipant.isAdmin || senderParticipant.isSuperAdmin);

        if (!isAdmin) {
            return msg.reply('🚫 Solo los administradores pueden usar este comando.');
        }

        // Obtener mensaje personalizado
        const customMessage = texto.slice(5).trim();
        let mentions = [];
        let text = customMessage ? `${customMessage}\n` : 'Aviso de gerencia:\n';

        for (let p of participants) {
            const contact = await client.getContactById(p.id._serialized);
            mentions.push(contact);
            text += `@${contact.number} `;
        }

        await chat.sendMessage(text, { mentions });
    }
});

client.initialize();
