# DentalPro — Secretária Virtual 🦷

## Bot de WhatsApp 100% Gratuito para Clínica Odontológica

> Secretária virtual humanizada chamada **Dani** que atende pacientes automaticamente via WhatsApp — sem custo algum!

---

## ✨ O que a Dani faz?

| Função | Detalhe |
|---|---|
| 👋 **Boas-vindas** | Detecta se é cliente novo ou antigo |
| 📅 **Agendar consulta** | Escolhe dentista → serviço → data → horário disponível |
| 🔍 **Ver consulta** | Mostra próxima consulta agendada |
| 🔄 **Remarcar** | Escolhe nova data e horário |
| ❌ **Cancelar** | Com confirmação e motivo |
| ✅ **Confirmar presença** | Paciente responde SIM/NÃO |
| ⏰ **Lembrete automático** | Enviado 24h antes da consulta |
| 👩‍💼 **Transferir** | Opção de falar com atendente humano |

---

## 🚀 Como instalar

### Pré-requisitos
- Node.js 18+ instalado
- Um número de WhatsApp dedicado para a clínica (pode ser um chip extra)

### 1. Instale as dependências
```bash
npm install
```

### 2. Configure o .env
```bash
cp .env.example .env
```
Edite o `.env` com os dados da sua clínica.

### 3. Inicie o bot
```bash
npm start
```

### 4. Escaneie o QR Code
Na tela do terminal vai aparecer um QR Code.  
Abra o WhatsApp no celular → **Menu ⋮** → **Aparelhos vinculados** → **Vincular um aparelho** → Escaneie.

✅ Pronto! A Dani já está atendendo!

---

## 📁 Estrutura do projeto

```
TESTE1/
├── src/
│   ├── index.js        # Bot principal (conexão WhatsApp)
│   ├── flows.js        # Fluxos de conversa (cérebro do bot)
│   ├── database.js     # Banco de dados JSON
│   ├── messages.js     # Todas as mensagens do bot
│   └── reminders.js    # Lembretes automáticos (cron)
├── data/
│   └── database.json   # Criado automaticamente
├── auth/               # Sessão do WhatsApp (criado automaticamente)
├── .env.example        # Configurações (copie para .env)
├── package.json
└── README.md
```

---

## ⚙️ Configuração (data/database.json)

Ao iniciar pela primeira vez, o arquivo `data/database.json` é criado com exemplos.  
Você pode editar diretamente para:
- Adicionar/editar dentistas
- Adicionar/editar serviços e preços
- Configurar horários de atendimento

---

## 💬 Exemplo de conversa

```
Paciente: Oi
Dani: Olá! 😊 Aqui é a Dani, secretária da DentalPro!...
       1️⃣ Agendar consulta
       2️⃣ Ver minha consulta
       ...

Paciente: 1
Dani: 👨‍⚕️ Temos os seguintes profissionais:
       1️⃣ Dr. Lucas Mendonça - Clínico Geral
       2️⃣ Dra. Priscila Ribeiro - Ortodontia

Paciente: 1
Dani: 🦷 Qual procedimento?
       1️⃣ Limpeza Dental (30 min) - R$ 150,00
       ...
```

---

## 🔁 Manter online 24/7 (gratuito)

Para rodar na nuvem gratuitamente, use:
- **Railway** (railway.app) — gratuito até 500h/mês
- **Render** — gratuito com sleep
- **VPS Oracle Cloud** — gratuito para sempre (tier free)

---

## 📞 Suporte

Desenvolvido para integração com o sistema **DentalPro**.  
Para dúvidas, abra uma issue no repositório.

---

> 🦷 **DentalPro** — Cuidando do seu sorriso com tecnologia!
