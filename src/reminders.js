// Sistema de Lembretes Automáticos ⏰
// Roda a cada hora verificando consultas do dia seguinte

import cron from 'node-cron';
import { getPendingReminders, markReminderSent, getDentistById, getServiceById, formatDate } from './database.js';
import { MSG } from './messages.js';

let _sendFn = null;

export function initReminders(sendFn) {
    _sendFn = sendFn;

    // Roda todo dia às 09:00 (para lembrar sobre consultas de amanhã)
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ [Lembretes] Verificando consultas de amanhã...');
        await sendPendingReminders();
    }, { timezone: 'America/Sao_Paulo' });

    // Também verifica a cada hora durante o expediente (08h-18h, a cada hora no minuto 0)
    cron.schedule('0 8-18 * * *', async () => {
        await sendPendingReminders();
    }, { timezone: 'America/Sao_Paulo' });

    console.log('✅ [Lembretes] Agendador iniciado — Lembretes enviados diariamente às 09:00');
}

async function sendPendingReminders() {
    if (!_sendFn) return;

    const pending = getPendingReminders();
    if (pending.length === 0) return;

    console.log(`📨 [Lembretes] ${pending.length} lembrete(s) para enviar...`);

    for (const appt of pending) {
        try {
            const dentist = getDentistById(appt.dentistId);
            const service = getServiceById(appt.serviceId);

            const reminderMsg = MSG.reminder({
                name: appt.patientName?.split(' ')[0] || 'Paciente',
                dentist: dentist?.name || '—',
                service: service?.name || '—',
                date: formatDate(appt.date),
                time: appt.startTime,
            });

            // Envia para o número do paciente (formato: número@s.whatsapp.net)
            const phone = appt.patientPhone;
            if (phone) {
                await _sendFn(phone, reminderMsg);
                markReminderSent(appt.id);
                console.log(`✅ [Lembretes] Lembrete enviado para ${phone}`);

                // Aguarda 2 segundos entre envios para não ser bloqueado
                await new Promise(r => setTimeout(r, 2000));
            }
        } catch (err) {
            console.error(`❌ [Lembretes] Erro ao enviar lembrete:`, err.message);
        }
    }
}

// Função para teste manual
export async function triggerRemindersNow() {
    console.log('🔔 [Lembretes] Disparando lembretes manualmente...');
    await sendPendingReminders();
}
