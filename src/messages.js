// Mensagens humanizadas da Secretária Dani 💬
// Todas as mensagens do bot estão centralizadas aqui para fácil edição

export const MSG = {

    // ─── Saudações ──────────────────────────────────────────────
    greetingNew: (name) => `Olá! 😊 Tudo bem?

Aqui é a *Dani*, secretária virtual da *DentalPro*! 🦷✨

Não encontrei seu cadastro aqui. Pra te ajudar melhor, pode me dizer seu *nome completo*?`,

    greetingKnown: (name) => `Oi, *${name}*! 😊 Que bom te ver por aqui!

Sou a *Dani*, sua secretária virtual da DentalPro 🦷

Como posso te ajudar hoje?

1️⃣ Agendar consulta
2️⃣ Ver minha próxima consulta
3️⃣ Remarcar consulta
4️⃣ Cancelar consulta
5️⃣ Confirmar presença
👩‍💼 6️⃣ Falar com atendente humano`,

    menu: `Como posso te ajudar?

1️⃣ Agendar consulta
2️⃣ Ver minha próxima consulta
3️⃣ Remarcar consulta
4️⃣ Cancelar consulta
5️⃣ Confirmar presença
👩‍💼 6️⃣ Falar com atendente humano

_Digite o número da opção desejada_ 😊`,

    menuAgain: `Tem mais alguma coisa que posso ajudar? 😊

1️⃣ Agendar consulta
2️⃣ Ver minha próxima consulta
3️⃣ Remarcar consulta
4️⃣ Cancelar consulta
👩‍💼 5️⃣ Falar com atendente

_Ou *sair* para encerrar_ 🦷`,

    // ─── Cadastro ───────────────────────────────────────────────
    askName: `Ótimo! Para criar seu cadastro, me diz: qual é o seu *nome completo*? 😊`,

    askPhone: (name) => `Prazer, *${name}*! 👋

Qual o melhor *número de telefone* para contato?
_(pode ser esse mesmo do WhatsApp)_`,

    cadastroOk: (name) => `Perfeito! Cadastro criado com sucesso, *${name}*! ✅

Agora posso te ajudar com tudo que precisar. 😊`,

    // ─── Dentista ────────────────────────────────────────────────
    chooseDentist: (dentists) => {
        let msg = `👨‍⚕️ *Temos os seguintes profissionais disponíveis:*\n\n`;
        dentists.forEach((d, i) => {
            msg += `*${i + 1}️⃣ ${d.name}*\n`;
            msg += `   🎓 ${d.specialty}\n\n`;
        });
        msg += `_Digite o número do profissional de sua preferência_ 😊`;
        return msg;
    },

    // ─── Serviço ─────────────────────────────────────────────────
    chooseService: (services) => {
        let msg = `🦷 *Qual procedimento você precisa?*\n\n`;
        services.forEach((s, i) => {
            msg += `*${i + 1}️⃣ ${s.name}*\n`;
            msg += `   ⏱ Duração: ${s.duration} min  💵 R$ ${Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n`;
        });
        msg += `_Digite o número do procedimento_ 😊`;
        return msg;
    },

    // ─── Data ─────────────────────────────────────────────────
    askDate: `📅 *Para qual data você gostaria de agendar?*

Por favor, me informe no formato: *DD/MM/AAAA*

_Exemplo: 25/03/2025_ 😊`,

    invalidDate: `🤔 Hmm, não consegui entender essa data...

Por favor, me informe no formato *DD/MM/AAAA*
_Exemplo: 25/03/2025_`,

    pastDate: `❌ Essa data já passou! 

Por favor, escolha uma data *futura* 📅`,

    // ─── Horários ────────────────────────────────────────────────
    chooseTime: (slots, date) => {
        let msg = `⏰ *Horários disponíveis para ${date}:*\n\n`;
        slots.forEach((s, i) => {
            msg += `*${i + 1}️⃣* ${s}\n`;
        });
        msg += `\n_Digite o número do horário desejado_ 😊`;
        return msg;
    },

    noSlots: `😔 Infelizmente não há horários disponíveis para essa data com este profissional.

Gostaria de escolher *outra data*? (sim/não)`,

    // ─── Confirmação de Agendamento ──────────────────────────────
    confirmAppointment: (info) => `✅ *Confirme seu agendamento:*

👨‍⚕️ *Profissional:* ${info.dentist}
🦷 *Procedimento:* ${info.service}
📅 *Data:* ${info.date}
⏰ *Horário:* ${info.time}
💵 *Valor:* R$ ${info.price}

_Digite *SIM* para confirmar ou *NÃO* para cancelar_ 😊`,

    appointmentBooked: (info) => `🎉 *Consulta agendada com sucesso!*

📋 *Resumo:*
👨‍⚕️ ${info.dentist}
🦷 ${info.service}
📅 ${info.date}
⏰ ${info.time}

⚠️ Lembre-se de chegar *10 minutos antes* do horário marcado.

Enviaremos um lembrete 24h antes da sua consulta! 🔔

_Precisa de mais alguma coisa?_ 😊`,

    // ─── Consulta Agendada ────────────────────────────────────────
    noAppointment: `📅 Não encontrei nenhuma consulta agendada para você.

Gostaria de *agendar uma consulta*? (sim/não)`,

    showAppointment: (info) => `📋 *Sua próxima consulta:*

👨‍⚕️ *Profissional:* ${info.dentist}
🦷 *Procedimento:* ${info.service}
📅 *Data:* ${info.date}
⏰ *Horário:* ${info.time}
🔖 *Status:* ${STATUS_LABEL[info.status] || info.status}

_Precisa alterar alguma coisa?_ 😊`,

    // ─── Cancelamento ────────────────────────────────────────────
    cancelConfirm: (info) => `⚠️ Tem certeza que deseja *cancelar* a consulta?

📅 ${info.date} às ${info.time}
👨‍⚕️ ${info.dentist}

_Digite *SIM* para cancelar ou *NÃO* para manter_ 😊`,

    cancelDone: `✅ Consulta cancelada! 

Esperamos te ver em breve! Se quiser reagendar, é só chamar a qualquer momento. 💙🦷`,

    // ─── Remarcação ──────────────────────────────────────────────
    rescheduleInfo: (info) => `🔄 Vou remarcar sua consulta:

📅 *Data atual:* ${info.date} às ${info.time}
👨‍⚕️ ${info.dentist}

Para qual *nova data* você gostaria? _(DD/MM/AAAA)_ 📅`,

    rescheduleDone: (info) => `✅ *Consulta remarcada com sucesso!*

📅 *Nova data:* ${info.date}
⏰ *Novo horário:* ${info.time}

Lembramos que você receberá uma confirmação 24h antes! 🔔`,

    // ─── Confirmação de Presença ─────────────────────────────────
    presenceConfirm: (info) => `✅ *Presença confirmada!*

Ótimo, *${info.name}*! Até ${info.date} às ${info.time}! 😊🦷`,

    presenceCancel: `Ok! Notificamos a clínica sobre o cancelamento.

Se quiser reagendar, estarei aqui! 💙`,

    // ─── Lembrete automático ─────────────────────────────────────
    reminder: (info) => `🔔 *Lembrete — DentalPro*

Olá, *${info.name}*! 😊

Sua consulta é *amanhã*:
👨‍⚕️ ${info.dentist}
🦷 ${info.service}
📅 ${info.date}
⏰ ${info.time}

Você *confirma* sua presença?

✅ *SIM* — Estarei lá!
❌ *NÃO* — Preciso cancelar`,

    // ─── Atendimento humano ──────────────────────────────────────
    transferHuman: `👩‍💼 Certo! Vou chamar um atendente humano para você.

Por favor, aguarde um momento... ⏳

_Um membro da nossa equipe entrará em contato em breve!_ 💙`,

    // ─── Fora do horário ─────────────────────────────────────────
    outsideHours: (open, close) => `🌙 Olá! 

No momento estamos *fora do horário de atendimento*.

📅 Atendemos de *segunda a sexta*
⏰ Das *${open}* às *${close}*

Mas não se preocupe! Você pode usar este chat para agendar sua consulta e responderei no próximo dia útil! 😊

Posso te ajudar com alguma coisa agora?

1️⃣ Agendar consulta
2️⃣ Ver minha consulta`,

    // ─── Erros e fallbacks ───────────────────────────────────────
    didntUnderstand: `🤔 Desculpe, não entendi muito bem...

Pode tentar novamente? 😊

Digite *menu* para ver as opções disponíveis.`,

    invalidOption: `❌ Opção inválida. Por favor, escolha uma das opções disponíveis.

_Digite *menu* para ver as opções._ 😊`,

    error: `😅 Oops! Algo deu errado aqui.

Por favor, tente novamente ou entre em contato diretamente com a clínica. 🦷`,

    goodbye: `Até logo! 😊 Sempre que precisar, estarei aqui!

*DentalPro* — Cuidando do seu sorriso! 🦷✨`,
};

export const STATUS_LABEL = {
    agendada: '📅 Agendada',
    confirmada: '✅ Confirmada',
    atendimento: '🔵 Em Atendimento',
    finalizada: '✔️ Finalizada',
    cancelada: '❌ Cancelada',
    faltou: '⚠️ Faltou',
};
