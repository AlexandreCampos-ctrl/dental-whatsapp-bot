// ╔══════════════════════════════════════════════════════════╗
// ║  DentalPro — Secretária Virtual Dani 🦷                 ║
// ║  WhatsApp Bot com Baileys — Gratuito e Open Source       ║
// ╚══════════════════════════════════════════════════════════╝

import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidBroadcast,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import { exec } from 'child_process';
import pino from 'pino';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initReminders } from './reminders.js';
import { processMessage } from './flows.js';
import { startServer } from './server.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_DIR = join(__dirname, '..', 'auth');
const CLINIC_NAME = process.env.CLINIC_NAME || 'DentalPro';
const BOT_NAME = process.env.BOT_NAME || 'Dani';
const OWNER = process.env.OWNER_NUMBER || '';

// Garante que a pasta de autenticação existe
if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

// Logger silencioso (apenas erros críticos)
const logger = pino({ level: 'silent' });

let sock = null;
let reconnectAttempts = 0;

// ─── Função de envio de mensagem ─────────────────────────────

async function sendMessage(phone, text) {
    if (!sock) { console.error('❌ Socket não conectado'); return; }
    try {
        const jid = phone.includes('@') ? phone : `${phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text });
        if (process.env.DEBUG === 'true') {
            console.log(`📤 [Bot → ${phone}]: ${text.slice(0, 60)}...`);
        }
    } catch (err) {
        console.error(`❌ Erro ao enviar mensagem para ${phone}:`, err.message);
    }
}

// ─── Conexão com WhatsApp ────────────────────────────────────

async function connect() {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
    });

    // ─── Eventos de conexão ──────────────────────────────────
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            // ── Salva o QR como imagem PNG ──────────────────────
            const qrImagePath = join(__dirname, '..', 'qr.png');
            try {
                await QRCode.toFile(qrImagePath, qr, { width: 400, margin: 2 });
                console.log('\n' + '═'.repeat(60));
                console.log(`🦷  ${CLINIC_NAME} — Secretária Virtual ${BOT_NAME}`);
                console.log('═'.repeat(60));
                console.log('📱 QR Code gerado de DUAS formas:');
                console.log('');
                console.log('  ① Imagem PNG salva em:');
                console.log(`     ${qrImagePath}`);
                console.log('     → Abra esse arquivo e escaneie com o celular!');
                console.log('');
                console.log('  ② QR Code no terminal logo abaixo ↓↓↓');
                console.log('═'.repeat(60) + '\n');
                // Abre automaticamente a imagem no Windows
                exec(`start "" "${qrImagePath}"`, (err) => {
                    if (!err) console.log('✅ Imagem do QR Code aberta automaticamente!\n');
                });
            } catch (e) {
                console.log('⚠️  Erro ao salvar imagem:', e.message);
            }
            console.log('⏳ Escaneie o QR Code acima para conectar...\n');
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = code !== DisconnectReason.loggedOut;

            console.log(`\n❌ Conexão encerrada [código: ${code}]`);

            if (shouldReconnect && reconnectAttempts < 5) {
                reconnectAttempts++;
                const delay = reconnectAttempts * 3000;
                console.log(`🔄 Reconectando em ${delay / 1000}s... (tentativa ${reconnectAttempts}/5)`);
                setTimeout(connect, delay);
            } else if (code === DisconnectReason.loggedOut) {
                console.log('⚠️  Sessão encerrada. Delete a pasta /auth e reinicie para escanear novamente.');
            } else {
                console.log('⚠️  Muitas tentativas. Reinicie o bot manualmente (npm start).');
            }
        }

        if (connection === 'open') {
            reconnectAttempts = 0;
            const botNumber = sock.user?.id?.split(':')[0];
            console.clear();
            console.log('\n' + '═'.repeat(58));
            console.log(`🦷  ${CLINIC_NAME} — Secretária Virtual ${BOT_NAME}`);
            console.log('═'.repeat(58));
            console.log(`✅ Bot conectado com sucesso!`);
            console.log(`📱 Número: +${botNumber}`);
            console.log(`🕐 Hora: ${new Date().toLocaleString('pt-BR')}`);
            console.log('═'.repeat(58));
            console.log('💬 Aguardando mensagens...\n');
            console.log('Pressione Ctrl+C para encerrar.\n');

            // Inicia lembretes automáticos
            initReminders(sendMessage);

            // Notifica o dono que o bot está online
            if (OWNER) {
                setTimeout(() => {
                    sendMessage(OWNER, `✅ *${BOT_NAME} está online!*\n\n🦷 ${CLINIC_NAME} — Secretária Virtual ativa!\n🕐 ${new Date().toLocaleString('pt-BR')}`);
                }, 2000);
            }
        }
    });

    // ─── Salva credenciais ────────────────────────────────────
    sock.ev.on('creds.update', saveCreds);

    // ─── Processa mensagens recebidas ─────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            try {
                // Ignora mensagens próprias, broadcasts e grupos
                if (msg.key.fromMe) continue;
                if (isJidBroadcast(msg.key.remoteJid)) continue;
                if (msg.key.remoteJid?.endsWith('@g.us')) continue; // Ignora grupos

                const from = msg.key.remoteJid;
                const phone = from.replace('@s.whatsapp.net', '');

                // Extrai o texto da mensagem (texto simples, lista, botão, etc.)
                const text =
                    msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    msg.message?.buttonsResponseMessage?.selectedDisplayText ||
                    msg.message?.listResponseMessage?.title ||
                    msg.message?.templateButtonReplyMessage?.selectedId ||
                    '';

                if (!text || text.trim() === '') continue;

                if (process.env.DEBUG === 'true') {
                    console.log(`📩 [${phone}]: ${text}`);
                }

                // Marca mensagem como lida
                await sock.readMessages([msg.key]);

                // Simula "digitando..." por 1-2 segundos para ser mais humano
                await sock.sendPresenceUpdate('composing', from);
                await new Promise(r => setTimeout(r, 800 + Math.random() * 1000));
                await sock.sendPresenceUpdate('paused', from);

                // Cria função de envio com contexto do destinatário
                const reply = (text) => sendMessage(phone, text);

                // Processa a mensagem pelo fluxo de conversa
                await processMessage(phone, text, reply);

            } catch (err) {
                console.error('❌ Erro ao processar mensagem:', err.message);
            }
        }
    });
}

// ─── Inicialização ────────────────────────────────────────────

console.log('\n🦷 DentalPro — Iniciando Secretária Virtual + API...\n');
startServer();
connect().catch(err => {
    console.error('❌ Erro fatal ao iniciar:', err);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n\n👋 Encerrando bot...');
    try { await sock?.end(); } catch { }
    process.exit(0);
});
