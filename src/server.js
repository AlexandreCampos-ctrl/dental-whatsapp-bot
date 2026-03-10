// ─── REST API Server — DentalPro ─────────────────────────────
// Express server que serve a API para o Dashboard React
// e compartilha o database.json com o Bot do WhatsApp

import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
    readDB, writeDB,
} from './database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// ─── Helpers genéricos de CRUD sobre o JSON ──────────────────

function getAll(key) {
    return readDB()[key] || [];
}

function getById(key, id) {
    return getAll(key).find(item => item.id === id) || null;
}

function createItem(key, data, prefix) {
    const db = readDB();
    const item = { id: `${prefix}${Date.now()}`, ...data };
    db[key] = [...(db[key] || []), item];
    writeDB(db);
    return item;
}

function updateItem(key, id, data) {
    const db = readDB();
    let found = false;
    db[key] = (db[key] || []).map(item => {
        if (item.id === id) { found = true; return { ...item, ...data, id }; }
        return item;
    });
    if (!found) return null;
    writeDB(db);
    return db[key].find(i => i.id === id);
}

function deleteItem(key, id) {
    const db = readDB();
    const before = (db[key] || []).length;
    db[key] = (db[key] || []).filter(item => item.id !== id);
    if (db[key].length === before) return false;
    writeDB(db);
    return true;
}

// ─── Router factory para CRUD reutilizável ───────────────────

function crudRouter(key, prefix) {
    const router = express.Router();

    router.get('/', (req, res) => res.json(getAll(key)));
    router.get('/:id', (req, res) => {
        const item = getById(key, req.params.id);
        if (!item) return res.status(404).json({ error: 'Não encontrado' });
        res.json(item);
    });
    router.post('/', (req, res) => {
        const item = createItem(key, req.body, prefix);
        res.status(201).json(item);
    });
    router.put('/:id', (req, res) => {
        const item = updateItem(key, req.params.id, req.body);
        if (!item) return res.status(404).json({ error: 'Não encontrado' });
        res.json(item);
    });
    router.delete('/:id', (req, res) => {
        if (!deleteItem(key, req.params.id)) return res.status(404).json({ error: 'Não encontrado' });
        res.json({ ok: true });
    });

    return router;
}

// ─── App Express ─────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Rota de sincronização inicial ────────────────────────────
// O Dashboard usa isso para hidratar o localStorage com dados reais

app.get('/api/init', (req, res) => {
    const db = readDB();
    // Retorna tudo exceto sessões do bot
    const { sessions, ...rest } = db;
    res.json(rest);
});

// ─── Rotas CRUD para cada entidade ───────────────────────────

app.use('/api/patients', crudRouter('patients', 'p'));
app.use('/api/dentists', crudRouter('dentists', 'd'));
app.use('/api/services', crudRouter('services', 's'));
app.use('/api/appointments', crudRouter('appointments', 'a'));
app.use('/api/records', crudRouter('records', 'r'));
app.use('/api/payments', crudRouter('payments', 'pay'));
app.use('/api/users', crudRouter('users', 'u'));
app.use('/api/blocked-slots', crudRouter('blockedSlots', 'b'));

// ─── Health check ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'DentalPro API',
        time: new Date().toISOString(),
        appointments: getAll('appointments').length,
        patients: getAll('patients').length,
    });
});

// ─── Serve o Dashboard React (build estático) ─────────────────

import { existsSync } from 'fs';
if (existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR));
    // SPA fallback — qualquer rota não encontrada serve o index.html
    app.get('/:path*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(join(PUBLIC_DIR, 'index.html'));
        }
    });
    console.log(`🌐 Dashboard servido de: ${PUBLIC_DIR}`);
} else {
    app.get('/', (req, res) => {
        res.json({
            message: '🦷 DentalPro API funcionando!',
            dashboard: 'Execute "npm run build:dashboard" para gerar o dashboard',
            endpoints: [
                'GET  /api/init',
                'GET  /api/health',
                'GET/POST/PUT/DELETE /api/patients',
                'GET/POST/PUT/DELETE /api/dentists',
                'GET/POST/PUT/DELETE /api/services',
                'GET/POST/PUT/DELETE /api/appointments',
                'GET/POST/PUT/DELETE /api/records',
                'GET/POST/PUT/DELETE /api/payments',
            ],
        });
    });
}

// ─── Start ────────────────────────────────────────────────────

export function startServer() {
    app.listen(PORT, () => {
        console.log(`\n🌐 API REST rodando em http://localhost:${PORT}`);
        console.log(`📊 Dashboard: http://localhost:${PORT}`);
        console.log(`🔌 Health: http://localhost:${PORT}/api/health\n`);
    });
}

export default app;
