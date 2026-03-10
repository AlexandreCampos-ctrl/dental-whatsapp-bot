// Database Layer — usa arquivo JSON como banco de dados
// Simples, sem servidor, funciona 100% local e gratuito

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { format, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'database.json');

// Garante que a pasta data/ existe
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Estrutura inicial do banco
const DEFAULT_DB = {
    clinic: {
        name: 'DentalPro',
        phone: '',
        address: '',
        openTime: '08:00',
        closeTime: '18:00',
    },
    dentists: [
        { id: 'd1', name: 'Dr. Lucas Mendonça', specialty: 'Clínico Geral', workDays: ['seg', 'ter', 'qua', 'qui', 'sex'], startTime: '08:00', endTime: '18:00', slotDuration: 30 },
        { id: 'd2', name: 'Dra. Priscila Ribeiro', specialty: 'Ortodontia', workDays: ['seg', 'ter', 'qui', 'sex'], startTime: '09:00', endTime: '17:00', slotDuration: 60 },
    ],
    services: [
        { id: 's1', name: 'Limpeza Dental', duration: 30, price: 150 },
        { id: 's2', name: 'Consulta / Avaliação', duration: 30, price: 100 },
        { id: 's3', name: 'Extração', duration: 45, price: 250 },
        { id: 's4', name: 'Restauração (Obturação)', duration: 45, price: 200 },
        { id: 's5', name: 'Tratamento de Canal', duration: 90, price: 800 },
        { id: 's6', name: 'Clareamento Dental', duration: 60, price: 600 },
        { id: 's7', name: 'Ortodontia (Aparelho)', duration: 60, price: 350 },
    ],
    patients: [],
    appointments: [],
    sessions: {},  // armazena estado da conversa por número de telefone
};

// ─── Leitura / Escrita ────────────────────────────────────────

function readDB() {
    if (!existsSync(DB_PATH)) {
        writeFileSync(DB_PATH, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
        return DEFAULT_DB;
    }
    try {
        return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
    } catch {
        return DEFAULT_DB;
    }
}

function writeDB(data) {
    writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── Pacientes ────────────────────────────────────────────────

export function getPatientByPhone(phone) {
    const db = readDB();
    return db.patients.find(p => p.phone === phone) || null;
}

export function createPatient(data) {
    const db = readDB();
    const patient = { id: `p${Date.now()}`, ...data, createdAt: new Date().toISOString() };
    db.patients.push(patient);
    writeDB(db);
    return patient;
}

export function updatePatient(phone, data) {
    const db = readDB();
    db.patients = db.patients.map(p => p.phone === phone ? { ...p, ...data } : p);
    writeDB(db);
}

// ─── Dentistas ────────────────────────────────────────────────

export function getDentists() {
    return readDB().dentists;
}

export function getDentistById(id) {
    return readDB().dentists.find(d => d.id === id) || null;
}

// ─── Serviços ─────────────────────────────────────────────────

export function getServices() {
    return readDB().services;
}

export function getServiceById(id) {
    return readDB().services.find(s => s.id === id) || null;
}

// ─── Horários disponíveis ─────────────────────────────────────

export function getAvailableSlots(dentistId, dateStr) {
    const db = readDB();
    const dentist = db.dentists.find(d => d.id === dentistId);
    if (!dentist) return [];

    // Verifica dia da semana
    const dayMap = { 0: 'dom', 1: 'seg', 2: 'ter', 3: 'qua', 4: 'qui', 5: 'sex', 6: 'sab' };
    const date = new Date(dateStr + 'T12:00:00');
    const dayKey = dayMap[date.getDay()];
    if (!dentist.workDays.includes(dayKey)) return [];

    // Gera todos os slots do dia
    const slots = [];
    const [sh, sm] = dentist.startTime.split(':').map(Number);
    const [eh, em] = dentist.endTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    for (let m = startMin; m + dentist.slotDuration <= endMin; m += dentist.slotDuration) {
        const h = String(Math.floor(m / 60)).padStart(2, '0');
        const min = String(m % 60).padStart(2, '0');
        const time = `${h}:${min}`;

        // Pula horário de almoço 12:00–13:00
        const totalMin = m;
        if (totalMin >= 720 && totalMin < 780) continue;

        slots.push(time);
    }

    // Remove slots já agendados
    const booked = db.appointments
        .filter(a => a.dentistId === dentistId && a.date === dateStr && !['cancelada', 'faltou'].includes(a.status))
        .map(a => a.startTime);

    return slots.filter(s => !booked.includes(s));
}

// ─── Consultas ────────────────────────────────────────────────

export function createAppointment(data) {
    const db = readDB();
    const appt = {
        id: `a${Date.now()}`,
        ...data,
        status: 'agendada',
        reminderSent: false,
        createdAt: new Date().toISOString(),
    };
    db.appointments.push(appt);
    writeDB(db);
    return appt;
}

export function getPatientAppointments(phone) {
    const db = readDB();
    return db.appointments
        .filter(a => a.patientPhone === phone)
        .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
}

export function getNextAppointment(phone) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const now = format(new Date(), 'HH:mm');
    const appts = getPatientAppointments(phone)
        .filter(a => !['cancelada', 'faltou', 'finalizada'].includes(a.status))
        .filter(a => a.date > today || (a.date === today && a.startTime >= now))
        .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    return appts[0] || null;
}

export function cancelAppointment(appointmentId, reason = '') {
    const db = readDB();
    db.appointments = db.appointments.map(a =>
        a.id === appointmentId ? { ...a, status: 'cancelada', cancelReason: reason, updatedAt: new Date().toISOString() } : a
    );
    writeDB(db);
}

export function rescheduleAppointment(appointmentId, newDate, newTime) {
    const db = readDB();
    db.appointments = db.appointments.map(a =>
        a.id === appointmentId ? { ...a, date: newDate, startTime: newTime, status: 'agendada', updatedAt: new Date().toISOString() } : a
    );
    writeDB(db);
}

export function confirmAppointment(appointmentId) {
    const db = readDB();
    db.appointments = db.appointments.map(a =>
        a.id === appointmentId ? { ...a, status: 'confirmada', updatedAt: new Date().toISOString() } : a
    );
    writeDB(db);
}

// Para lembretes
export function getPendingReminders() {
    const db = readDB();
    const tomorrow = format(addMinutes(new Date(), 24 * 60), 'yyyy-MM-dd');
    return db.appointments.filter(a =>
        a.date === tomorrow &&
        !a.reminderSent &&
        !['cancelada', 'faltou'].includes(a.status)
    );
}

export function markReminderSent(appointmentId) {
    const db = readDB();
    db.appointments = db.appointments.map(a =>
        a.id === appointmentId ? { ...a, reminderSent: true } : a
    );
    writeDB(db);
}

// ─── Sessão da conversa ───────────────────────────────────────

export function getSession(phone) {
    const db = readDB();
    return db.sessions[phone] || { state: 'idle', data: {} };
}

export function setSession(phone, session) {
    const db = readDB();
    db.sessions[phone] = { ...session, updatedAt: new Date().toISOString() };
    writeDB(db);
}

export function clearSession(phone) {
    const db = readDB();
    delete db.sessions[phone];
    writeDB(db);
}

// ─── Helpers de formatação ────────────────────────────────────

export function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatAppointment(appt) {
    const db = readDB();
    const dentist = db.dentists.find(d => d.id === appt.dentistId);
    const service = db.services.find(s => s.id === appt.serviceId);
    return {
        dentist: dentist?.name || '—',
        service: service?.name || '—',
        date: formatDate(appt.date),
        time: appt.startTime,
        status: appt.status,
    };
}
