// Fluxo de Conversa — Máquina de Estados da Secretária Dani 🧠
// Cada número de telefone tem sua própria sessão de conversa

import {
    getPatientByPhone, createPatient, getSession, setSession, clearSession,
    getDentists, getServices, getServiceById, getDentistById,
    getAvailableSlots, createAppointment, getNextAppointment,
    cancelAppointment, rescheduleAppointment, confirmAppointment,
    getPatientAppointments, formatDate, formatAppointment,
    createPayment,
} from './database.js';
import { MSG } from './messages.js';
import { format, parse, isValid, isFuture, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Normaliza texto: remove acentos, maiúsculas, espaços extras
const normalize = (str) => str?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';

// Tenta parsear DD/MM/YYYY para YYYY-MM-DD
function parseDate(str) {
    const cleaned = str.replace(/\s/g, '').trim();
    const d = parse(cleaned, 'dd/MM/yyyy', new Date());
    if (!isValid(d)) return null;
    return format(d, 'yyyy-MM-dd');
}

// ─── Processador central ─────────────────────────────────────

export async function processMessage(phone, text, send) {
    const rawText = text.trim();
    const msg = normalize(rawText);

    // Palavras-chave globais
    if (['sair', 'tchau', 'bye', 'encerrar', 'obrigado', 'obrigada'].some(k => msg.includes(k))) {
        clearSession(phone);
        await send(MSG.goodbye);
        return;
    }
    if (['menu', 'inicio', 'inicio', 'voltar', 'ola', 'oi', 'bom dia', 'boa tarde', 'boa noite'].some(k => msg === k || msg.startsWith(k))) {
        await handleGreeting(phone, send);
        return;
    }
    if (msg === 'ajuda' || msg === 'help') {
        await send(MSG.menu);
        return;
    }

    const session = getSession(phone);

    switch (session.state) {
        case 'idle':
        case 'menu':
            await handleMenu(phone, rawText, msg, send);
            break;

        // ─── Cadastro ─────────────────────────────────────────────
        case 'await_name':
            await handleRegisterName(phone, rawText, send);
            break;
        case 'await_phone_confirm':
            await handlePhoneConfirm(phone, msg, send);
            break;

        // ─── Agendamento ──────────────────────────────────────────
        case 'booking_dentist':
            await handleBookDentist(phone, msg, send);
            break;
        case 'booking_service':
            await handleBookService(phone, msg, send);
            break;
        case 'booking_date':
            await handleBookDate(phone, rawText, msg, send);
            break;
        case 'booking_time':
            await handleBookTime(phone, msg, send);
            break;
        case 'booking_confirm':
            await handleBookConfirm(phone, msg, send);
            break;

        // ─── Cancelamento ─────────────────────────────────────────
        case 'cancel_confirm':
            await handleCancelConfirm(phone, msg, send);
            break;

        // ─── Remarcação ──────────────────────────────────────────
        case 'reschedule_date':
            await handleRescheduleDate(phone, rawText, msg, send);
            break;
        case 'reschedule_time':
            await handleRescheduleTime(phone, msg, send);
            break;

        // ─── Confirmação de presença ──────────────────────────────
        case 'presence_confirm':
            await handlePresenceConfirm(phone, msg, send);
            break;

        // ─── Nova data após sem horário ────────────────────────────
        case 'ask_new_date_after_no_slots':
            await handleAskNewDateAfterNoSlots(phone, msg, rawText, send);
            break;

        default:
            await handleGreeting(phone, send);
    }
}

// ─── Saudação ────────────────────────────────────────────────

async function handleGreeting(phone, send) {
    const patient = getPatientByPhone(phone);
    if (!patient) {
        setSession(phone, { state: 'await_name', data: {} });
        await send(MSG.greetingNew());
    } else {
        setSession(phone, { state: 'menu', data: {} });
        await send(MSG.greetingKnown(patient.name.split(' ')[0]));
    }
}

// ─── Cadastro ────────────────────────────────────────────────

async function handleRegisterName(phone, name, send) {
    if (name.length < 3) { await send('Por favor, me informe seu *nome completo* 😊'); return; }
    createPatient({ name: name.trim(), phone });
    setSession(phone, { state: 'menu', data: {} });
    await send(MSG.cadastroOk(name.split(' ')[0]));
    await sleep(800);
    await send(MSG.menu);
}

async function handlePhoneConfirm(phone, msg, send) {
    // placeholder para futuro fluxo de confirmação de número alternativo
    setSession(phone, { state: 'menu', data: {} });
    await send(MSG.menu);
}

// ─── Menu Principal ───────────────────────────────────────────

async function handleMenu(phone, rawText, msg, send) {
    const opt = msg.replace(/[^\d]/g, '');

    switch (opt) {
        case '1': await startBooking(phone, send); break;
        case '2': await showNextAppointment(phone, send); break;
        case '3': await startReschedule(phone, send); break;
        case '4': await startCancel(phone, send); break;
        case '5': await startPresenceConfirm(phone, send); break;
        case '6':
            setSession(phone, { state: 'idle', data: {} });
            await send(MSG.transferHuman);
            break;
        default:
            // Tenta interpretar como texto livre
            if (['sim', 's', 'yes'].includes(msg)) {
                await startBooking(phone, send);
            } else if (['agendar', 'marcar', 'consulta'].some(k => msg.includes(k))) {
                await startBooking(phone, send);
            } else if (['ver', 'consultar', 'minha consulta'].some(k => msg.includes(k))) {
                await showNextAppointment(phone, send);
            } else if (['cancelar', 'cancel'].some(k => msg.includes(k))) {
                await startCancel(phone, send);
            } else if (['remarcar', 'remarcar'].some(k => msg.includes(k))) {
                await startReschedule(phone, send);
            } else {
                await send(MSG.didntUnderstand);
                await sleep(500);
                await send(MSG.menu);
            }
    }
}

// ─── Agendamento ─────────────────────────────────────────────

async function startBooking(phone, send) {
    const dentists = getDentists();
    setSession(phone, { state: 'booking_dentist', data: { dentists } });
    await send(MSG.chooseDentist(dentists));
}

async function handleBookDentist(phone, msg, send) {
    const session = getSession(phone);
    const dentists = session.data.dentists || getDentists();
    const idx = parseInt(msg) - 1;

    if (isNaN(idx) || idx < 0 || idx >= dentists.length) {
        await send(MSG.invalidOption);
        return;
    }
    const dentist = dentists[idx];
    const services = getServices();
    setSession(phone, { state: 'booking_service', data: { ...session.data, dentistId: dentist.id, services } });
    await send(`Ótima escolha! 👨‍⚕️ Você escolheu *${dentist.name}*.\n\n`);
    await sleep(600);
    await send(MSG.chooseService(services));
}

async function handleBookService(phone, msg, send) {
    const session = getSession(phone);
    const services = session.data.services || getServices();
    const idx = parseInt(msg) - 1;

    if (isNaN(idx) || idx < 0 || idx >= services.length) {
        await send(MSG.invalidOption);
        return;
    }
    const service = services[idx];
    setSession(phone, { state: 'booking_date', data: { ...session.data, serviceId: service.id } });
    await send(`🦷 Procedimento: *${service.name}*\n\n`);
    await sleep(600);
    await send(MSG.askDate);
}

async function handleBookDate(phone, rawText, msg, send) {
    const session = getSession(phone);
    const dateStr = parseDate(rawText);

    if (!dateStr) { await send(MSG.invalidDate); return; }

    const date = new Date(dateStr + 'T12:00:00');
    if (!isFuture(date) && !isToday(date)) { await send(MSG.pastDate); return; }

    const slots = getAvailableSlots(session.data.dentistId, dateStr);
    if (slots.length === 0) {
        setSession(phone, { state: 'ask_new_date_after_no_slots', data: { ...session.data } });
        await send(MSG.noSlots);
        return;
    }

    const formattedDate = formatDate(dateStr);
    setSession(phone, { state: 'booking_time', data: { ...session.data, date: dateStr, slots } });
    await send(MSG.chooseTime(slots, formattedDate));
}

async function handleAskNewDateAfterNoSlots(phone, msg, rawText, send) {
    if (['sim', 's', 'yes'].includes(msg)) {
        const session = getSession(phone);
        setSession(phone, { state: 'booking_date', data: session.data });
        await send(MSG.askDate);
    } else {
        setSession(phone, { state: 'menu', data: {} });
        await send(`Ok! Quando quiser agendar é só chamar. 😊\n\n`);
        await sleep(500);
        await send(MSG.menu);
    }
}

async function handleBookTime(phone, msg, send) {
    const session = getSession(phone);
    const slots = session.data.slots || [];
    const idx = parseInt(msg) - 1;

    if (isNaN(idx) || idx < 0 || idx >= slots.length) {
        await send(MSG.invalidOption);
        return;
    }

    const time = slots[idx];
    const dentist = getDentistById(session.data.dentistId);
    const service = getServiceById(session.data.serviceId);

    const confirmInfo = {
        dentist: dentist.name,
        service: service.name,
        date: formatDate(session.data.date),
        time,
        price: Number(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
    };

    setSession(phone, { state: 'booking_confirm', data: { ...session.data, time } });
    await send(MSG.confirmAppointment(confirmInfo));
}

async function handleBookConfirm(phone, msg, send) {
    const session = getSession(phone);
    const patient = getPatientByPhone(phone);

    if (['sim', 's', 'yes', '1'].includes(msg)) {
        const service = getServiceById(session.data.serviceId);
        const dentist = getDentistById(session.data.dentistId);
        const endHour = calcEndTime(session.data.time, service.duration);

        const appt = createAppointment({
            patientId: patient?.id, // Vincula ao ID do dashboard
            patientPhone: phone,
            patientName: patient?.name || 'Paciente WhatsApp',
            dentistId: session.data.dentistId,
            serviceId: session.data.serviceId,
            date: session.data.date,
            startTime: session.data.time,
            endTime: endHour,
        });

        // Cria registro financeiro pendente automaticamente
        createPayment({
            appointmentId: appt.id,
            patientId: patient?.id,
            amount: service.price,
            method: 'pix', // default para bot
            status: 'pendente',
            notes: 'Agendado via WhatsApp',
            paidAt: '',
        });

        const info = {
            dentist: dentist.name,
            service: service.name,
            date: formatDate(session.data.date),
            time: session.data.time,
        };

        clearSession(phone);
        await send(MSG.appointmentBooked(info));
        await sleep(1000);
        await send(MSG.menuAgain);
    } else {
        clearSession(phone);
        await send(`Ok, agendamento cancelado. 😊\n\nSempre que quiser agendar, é só falar! 🦷`);
        await sleep(500);
        await send(MSG.menu);
    }
}

// ─── Ver Consulta ────────────────────────────────────────────

async function showNextAppointment(phone, send) {
    const appt = getNextAppointment(phone);
    if (!appt) {
        setSession(phone, { state: 'idle', data: {} });
        await send(MSG.noAppointment);
        return;
    }
    const formatted = formatAppointment(appt);
    setSession(phone, { state: 'menu', data: {} });
    await send(MSG.showAppointment(formatted));
    await sleep(800);
    await send(MSG.menuAgain);
}

// ─── Cancelamento ─────────────────────────────────────────────

async function startCancel(phone, send) {
    const appt = getNextAppointment(phone);
    if (!appt) {
        setSession(phone, { state: 'menu', data: {} });
        await send(MSG.noAppointment);
        return;
    }
    const formatted = formatAppointment(appt);
    setSession(phone, { state: 'cancel_confirm', data: { appointmentId: appt.id, ...formatted } });
    await send(MSG.cancelConfirm(formatted));
}

async function handleCancelConfirm(phone, msg, send) {
    const session = getSession(phone);
    if (['sim', 's', 'yes'].includes(msg)) {
        cancelAppointment(session.data.appointmentId, 'Paciente cancelou via WhatsApp');
        clearSession(phone);
        await send(MSG.cancelDone);
        await sleep(800);
        await send(MSG.menuAgain);
    } else {
        setSession(phone, { state: 'menu', data: {} });
        await send(`✅ Ok! Sua consulta foi *mantida*. Até lá! 😊`);
        await sleep(500);
        await send(MSG.menuAgain);
    }
}

// ─── Remarcação ──────────────────────────────────────────────

async function startReschedule(phone, send) {
    const appt = getNextAppointment(phone);
    if (!appt) {
        setSession(phone, { state: 'menu', data: {} });
        await send(MSG.noAppointment);
        return;
    }
    const formatted = formatAppointment(appt);
    setSession(phone, { state: 'reschedule_date', data: { appointmentId: appt.id, dentistId: appt.dentistId, ...formatted } });
    await send(MSG.rescheduleInfo(formatted));
}

async function handleRescheduleDate(phone, rawText, msg, send) {
    const session = getSession(phone);
    const dateStr = parseDate(rawText);

    if (!dateStr) { await send(MSG.invalidDate); return; }
    const date = new Date(dateStr + 'T12:00:00');
    if (!isFuture(date) && !isToday(date)) { await send(MSG.pastDate); return; }

    const slots = getAvailableSlots(session.data.dentistId, dateStr);
    if (slots.length === 0) {
        await send(MSG.noSlots.replace('(sim/não)', ''));
        await send(MSG.askDate);
        return;
    }

    setSession(phone, { state: 'reschedule_time', data: { ...session.data, newDate: dateStr, slots } });
    await send(MSG.chooseTime(slots, formatDate(dateStr)));
}

async function handleRescheduleTime(phone, msg, send) {
    const session = getSession(phone);
    const slots = session.data.slots || [];
    const idx = parseInt(msg) - 1;

    if (isNaN(idx) || idx < 0 || idx >= slots.length) {
        await send(MSG.invalidOption);
        return;
    }

    const newTime = slots[idx];
    rescheduleAppointment(session.data.appointmentId, session.data.newDate, newTime);

    const info = { date: formatDate(session.data.newDate), time: newTime };
    clearSession(phone);
    await send(MSG.rescheduleDone(info));
    await sleep(800);
    await send(MSG.menuAgain);
}

// ─── Confirmação de Presença ──────────────────────────────────

async function startPresenceConfirm(phone, send) {
    const appt = getNextAppointment(phone);
    if (!appt) {
        setSession(phone, { state: 'menu', data: {} });
        await send(MSG.noAppointment);
        return;
    }
    const formatted = formatAppointment(appt);
    const patient = getPatientByPhone(phone);
    setSession(phone, { state: 'presence_confirm', data: { appointmentId: appt.id, ...formatted, name: patient?.name?.split(' ')[0] || 'Paciente' } });
    await send(`Você deseja confirmar presença para:\n\n📅 *${formatted.date}* às *${formatted.time}*\n👨‍⚕️ ${formatted.dentist}\n\n*SIM* para confirmar ✅\n*NÃO* para cancelar ❌`);
}

async function handlePresenceConfirm(phone, msg, send) {
    const session = getSession(phone);
    if (['sim', 's', 'yes'].includes(msg)) {
        confirmAppointment(session.data.appointmentId);
        clearSession(phone);
        await send(MSG.presenceConfirm(session.data));
        await sleep(800);
        await send(MSG.menuAgain);
    } else {
        cancelAppointment(session.data.appointmentId, 'Paciente não confirmou presença via WhatsApp');
        clearSession(phone);
        await send(MSG.presenceCancel);
        await sleep(800);
        await send(MSG.menuAgain);
    }
}

// ─── Helpers ─────────────────────────────────────────────────

function calcEndTime(startTime, durationMinutes) {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
