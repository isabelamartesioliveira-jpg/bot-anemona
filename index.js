const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

const bot = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ] 
});

const PREFIXO = ".";
const ID_DONO = "432610292342587392";

// Mapas para os minijogos guardarem os dados
const jogosForca = new Map();
const jogosAdivinhar = new Map();
const listaPalavras = ['discord', 'computador', 'javascript', 'robot', 'banana', 'teclado', 'servidor', 'programacao', 'anemona', 'internet'];

// Tabela Super Expandida com as 26 Cores aprovadas para os Boosters
const CORES_BOOSTER = {
    'rosa-claro': '#ffb6c1', 'rosa': '#ff69b4', 'magenta': '#ff00ff', 'roxo-claro': '#e6e6fa',
    'roxo': '#9b59b6', 'roxo-escuro': '#4b0082', 'lavanda': '#bdb76b', 'lilás': '#c8a2c8',
    'azul-claro': '#87cefa', 'azul': '#3498db', 'azul-escuro': '#00008b', 'marinho': '#1f3a52',
    'ciano': '#00ffff', 'menta': '#2ecc71', 'verde-claro': '#98fb98', 'verde': '#00ff00',
    'verde-escuro': '#006400', 'esmeralda': '#50c878', 'amarelo-claro': '#fffacd', 'amarelo': '#f1c40f',
    'laranja': '#e67e22', 'vermelho': '#e74c3c', 'vermelho-vinho': '#800020', 'azul-goiaba': '#e9967a',
    'branco': '#ffffff', 'cinza': '#808080'
};

// Função que busca seus GIFs locais de forma aleatória
function pegarGifAleatorio(nomeDaSubpasta) {
    try {
        const caminhoPasta = path.join(__dirname, "gifs", nomeDaSubpasta);
        if (!fs.existsSync(caminhoPasta)) {
            fs.mkdirSync(caminhoPasta, { recursive: true });
            return null;
        }
        const arquivos = fs.readdirSync(caminhoPasta).filter(file => {
            const extensao = file.toLowerCase();
            return extensao.endsWith('.gif') || extensao.endsWith('.png') || extensao.endsWith('.jpg') || extensao.endsWith('.jpeg');
        });
        if (!arquivos || arquivos.length === 0) return null;
        const gifSorteado = arquivos[Math.floor(Math.random() * arquivos.length)];
        return {
            arquivo: new AttachmentBuilder(path.join(caminhoPasta, gifSorteado), { name: gifSorteado }),
            anexoUrl: `attachment://${gifSorteado}`
        };
    } catch (e) {
        return null;
    }
}

bot.once("ready", () => { 
    console.log("Sucesso Absoluto! O bot Anêmona está 100% ONLINE na Nuvem!"); 
});

// Sistema que mantém o Render acordado sem dar erro de porta
const http = require('http');
const server = http.createServer((req, res) => {
   res.writeHead(200, {'Content-Type': 'text/plain'});
   res.end('Bot Anêmona Online!\n');
});
server.listen(process.env.PORT || 3000);

// ==========================================
// 👋 SISTEMA DE BOAS-VINDAS
// ==========================================
bot.on('guildMemberAdd', async (membro) => {
    const cargo = membro.guild.roles.cache.find(r => r.name.toLowerCase() === 'members');
    if (cargo) { await membro.roles.add(cargo).catch(() => {}); }

    const canalWelc = membro.guild.channels.cache.find(c => c.name.toLowerCase() === 'welc' && c.type === ChannelType.GuildText);
    const canalRules = membro.guild.channels.cache.find(c => c.name.toLowerCase() === 'rules' && c.type === ChannelType.GuildText);
    const canalManual = membro.guild.channels.cache.find(c => c.name.toLowerCase() === 'anemona' && c.type === ChannelType.GuildText);
    
    const linkRegras = canalRules ? `${canalRules}` : "#rules";
    const linkManual = canalManual ? `${canalManual}` : "#anemona";

    if (canalWelc) {
        const embedWelcome = new EmbedBuilder()
            .setDescription(
                `Oii, ${membro}!ଓ Muito obrigada por fazer parte do nosso cantinho! :3\n\n` +
                `Esperamos que você se divirta bastante, conheça pessoas incríveis e crie muitas memórias por aqui. Todo mundo começou sendo novo no servidor um dia, então não tenha vergonha de conversar ou participar dos chats, viu? 🩷\n\n` +
                `Antes de sair explorando tudo, dá uma passadinha nas ${linkRegras} e conheça os meus comandos no canal ${linkManual}!`
            )
            .setColor("#ffb6c1");
        
        const gifWelcome = pegarGifAleatorio("welcome");
        if (gifWelcome && gifWelcome.arquivo && gifWelcome.anexoUrl) {
            embedWelcome.setImage(gifWelcome.anexoUrl);
            await canalWelc.send({ embeds: [embedWelcome], files: [gifWelcome.arquivo] }).catch(() => {});
        } else {
            await canalWelc.send({ embeds: [embedWelcome] }).catch(() => {});
        }
    }
});

// ==========================================
// 🕵️ DETECTOR DE DELETADOS
// ==========================================
bot.on('messageDelete', async (mensagem) => {
    if (mensagem.author?.bot || !mensagem.content) return;
    
    const canalMensagens = mensagem.guild?.channels.cache.find(c => c.name.toLowerCase() === 'mensagens' && c.type === ChannelType.GuildText);
    if (!canalMensagens) return;

    const embedDelete = new EmbedBuilder()
        .setAuthor({ name: mensagem.author.tag, iconURL: mensagem.author.displayAvatarURL({ dynamic: true }) })
        .setDescription(`❌ **Mensagem DELETADA no canal** ${mensagem.channel}:\n\n> ${mensagem.content}`)
        .setColor("#ff0000")
        .setTimestamp();

    await canalMensagens.send({ embeds: [embedDelete] }).catch(() => {});
});

// ==========================================
// 📩 SISTEMA INTERATIVO DE TICKETS (BOTÕES)
// ==========================================
bot.on('interactionCreate', async (interacao) => {
    if (!interacao.isButton()) return;

    if (interacao.customId === 'criar_ticket') {
        await interacao.deferReply({ ephemeral: true });
        const guild = interacao.guild; 
        const usuario = interacao.user;
        
        const canalExistente = guild.channels.cache.find(c => c.name === `ticket-${usuario.username.toLowerCase()}`);
        if (canalExistente) { 
            return interacao.editReply({ content: `Você já possui um ticket aberto em ${canalExistente}!` }); 
        }

        const canalTicket = await guild.channels.create({
            name: `ticket-${usuario.username}`, 
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: usuario.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: bot.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const embedSalaTicket = new EmbedBuilder()
            .setTitle("SUPORTE - TICKET INDIVIDUAL")
            .setDescription(`Olá ${usuario}, bem-vindo ao seu canal de suporte privado!\n\nExplique o seu problema detalhadamente. A nossa equipe entrerá em contato o mais rápido possível.\n\nClique no botão abaixo para encerrar o atendimento.`)
            .setColor("#ffb6c1");

        const painelBotoesTicket = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger)
        );

        await canalTicket.send({ content: `${usuario} | Staff`, embeds: [embedSalaTicket], components: [painelBotoesTicket] });
        return interacao.editReply({ content: `Seu ticket foi aberto com sucesso em ${canalTicket}!` });
    }

    if (interacao.customId === 'fechar_ticket') {
        await interacao.deferReply(); 
        await interacao.channel.permissionOverwrites.edit(interacao.user.id, { SendMessages: false });
        
        const embedFechado = new EmbedBuilder()
            .setDescription(`Ticket fechado por **${interacao.user.username}**.\nO canal será deletado automaticamente.`)
            .setColor("#ff0000");
            
        await interacao.editReply({ embeds: [embedFechado] });
        
        setTimeout(() => { 
            interacao.channel.delete().catch(() => {}); 
        }, 8000);
    }
});

// ==========================================
// 🔮 MONITORAMENTO AUTOMÁTICO DE BOOST E SALA VIP
// ==========================================
bot.on('guildMemberUpdate', async (antigoMembro, novoMembro) => {
    const deuBoostAgora = antigoMembro.premiumSince === null && novoMembro.premiumSince !== null;

    if (deuBoostAgora) {
        const guild = novoMembro.guild;

        const canalChat = guild.channels.cache.find(c => (c.name.toLowerCase() === 'geral' || c.name.toLowerCase() === 'chat') && c.type === ChannelType.GuildText);
        if (canalChat) {
            const embedAnuncioBoost = new EmbedBuilder()
                .setDescription(`Oioii!! Muito obrigada por impulsionar o servidor! :3 🤍\n\nSério, isso ajuda MUITO e deixa a gente muito feliz. Obrigada por fazer parte da nossa comunidade e por apoiar o servidor! Espero que continue se divertindo por aqui. 🫶🏻`)
                .setColor("#ffb6c1");

            const gifBoost = pegarGifAleatorio("boost");
            if (gifBoost && gifBoost.arquivo && gifBoost.anexoUrl) {
                embedAnuncioBoost.setImage(gifBoost.anexoUrl);
                await canalChat.send({ embeds: [embedAnuncioBoost], files: [gifBoost.arquivo] }).catch(() => {});
            } else {
                await canalChat.send({ embeds: [embedAnuncioBoost] }).catch(() => {});
            }
        }

        try {
            const salaBooster = await guild.channels.create({
                name: `💬-booster-${novoMembro.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                permissionOverwrites: [
                    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: novoMembro.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                    { id: bot.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            const embedSalaVIP = new EmbedBuilder()
                .setTitle("💬 SALA PRIVADA - ATENDIMENTO BOOSTER")
                .setDescription(`Olá ${novoMembro}, bem-vindo ao seu chat exclusivo temporário!\nEsse canal foi liberado apenas para você e os Administradores debaterem sobre o seu cargo personalizado.\n\n⏳ **Aviso:** Esta sala será deletada de forma automática em **5 horas**. Aproveite!`)
                .setColor("#ffb6c1");

            await salaBooster.send({ content: `${novoMembro} | Staff`, embeds: [embedSalaVIP] });

            setTimeout(async () => {
                await salaBooster.delete().catch(() => {});
            }, 18000000);

        } catch (e) {}
    }
});
// ==========================================
// 💬 CHAT E LEITURA DE COMANDOS COM PREFIXO
// ==========================================
bot.on('messageCreate', async (mensagem) => {
    if (mensagem.author.bot) return;

    // Espelho de Mensagens
    const canalMensagens = mensagem.guild?.channels.cache.find(c => c.name.toLowerCase() === 'mensagens' && c.type === ChannelType.GuildText);
    if (canalMensagens && mensagem.channel.id !== canalMensagens.id && mensagem.channel.name.toLowerCase() !== 'hidden') {
        const embedLogMsg = new EmbedBuilder()
            .setAuthor({ name: mensagem.author.tag, iconURL: mensagem.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`💬 **Mensagem enviada em** ${mensagem.channel}:\n> ${mensagem.content}`).setColor("#cccccc").setTimestamp();
        await canalMensagens.send({ embeds: [embedLogMsg] }).catch(() => {});
    }

    // Segredos Anônimos (#hidden)
    if (mensagem.channel.name.toLowerCase() === 'hidden') {
        try { await mensagem.delete(); } catch (e) { return; }
        const segredo = mensagem.content.trim(); if (!segredo) return;
        const canalInbox = mensagem.guild?.channels.cache.find(c => c.name.toLowerCase() === 'inbox' && c.type === ChannelType.GuildText);
        if (!canalInbox) return;
        
        const embedInboxFoto = new EmbedBuilder().setTitle("Anonymous").setDescription(segredo).setColor("#ffffff").setFooter({ text: "Mensagem anônima" });
        return canalInbox.send({ embeds: [embedInboxFoto] });
    }

    if (!mensagem.content.startsWith(PREFIXO)) return;
    
    const args = mensagem.content.slice(PREFIXO.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const ehBooster = mensagem.member?.premiumSince !== null;

    if (cmd === "setup-ticket") {
        if (!mensagem.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        await mensagem.delete().catch(() => {});

        const embedPainelTicket = new EmbedBuilder()
            .setTitle("CENTRAL DE ATENDIMENTO E SUPORTE")
            .setDescription("Precisa de ajuda da nossa equipe de Administração ou quer fazer uma denúncia?\n\nClique no botão \"Abrir Ticket\" abaixo para iniciar um atendimento privado e individual de forma segura!")
            .setColor("#ffb6c1")
            .setFooter({ text: "Sistema de Suporte Oficial Anêmonas" });

        const linhaBotao = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('criar_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Secondary)
        );
        return mensagem.channel.send({ embeds: [embedPainelTicket], components: [linhaBotao] });
    }

    if (cmd === "rules") {
        if (!mensagem.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        await mensagem.delete().catch(() => {});

        const embedRegras = new EmbedBuilder()
            .setTitle("Rules")
            .setDescription(
                "**• Respeite todos**\nTrate todos com educação. Preconceito, discriminação e ofensas não serão tolerados.\n\n" +
                "**• Sem bullying ou ataques**\nNada de provocações, humilhações ou comportamento tóxico. Queremos um ambiente seguro.\n\n" +
                "**• Sem conteúdo impróprio ou ilegal**\nProibido conteúdo +18, violento ou perturbador, além de qualquer incentivo ou envolvimento com atividades ilegais.\n\n" +
                "**• Sem spam ou flood**\nEvite mensagens repetidas ou excesso de mensagens desnecessárias.\n\n" +
                "**• Use os canais corretamente**\nCada canal tem seu propósito — mantenha as conversas organizadas.\n\n" +
                "**• Sem divulgação sem permissão**\nNão divulgue servidores, links ou redes sociais sem autorização da staff.\n\n" +
                "**• Respeite a equipe**\nSiga as orientações dos administradores e moderadores.\n\n" +
                "**• Sem brigas ou discussões tóxicas**\nDebates são permitidos, mas sem desrespeito ou clima pesado.\n\n" +
                "**• Proteja sua privacidade**\nNão compartilhe informações pessoais suas ou de outras pessoas.\n\n" +
                "**• Siga as diretrizes do Discord**\nTodo conteúdo deve seguir as diretrizes oficiais do Discord:\n[Diretrizes do Discord](https://discord.com)\n\n" +
                "seja bem vindo ao nemona ! 🤍"
            )
            .setColor("#ffb6c1");

        const gifRegras = pegarGifAleatorio("regras");
        if (gifRegras) { 
            return mensagem.channel.send({ embeds: [embedRegras], files: [gifRegras.arquivo] }); 
        }
        return mensagem.channel.send({ embeds: [embedRegras] });
    }

    if (cmd === "setup-guia") {
        if (!mensagem.member.permissions.has(PermissionFlagsBits.Administrator)) return;
        await mensagem.delete().catch(() => {});

        const embedGuia = new EmbedBuilder()
            .setTitle("Guia de Comandos — Anêmonas")
            .setDescription(
                "**• Laços e Separações**\n" +
                "`.casar @nome` — Pede alguém em casamento.\n" +
                "`.divorciar @nome` — Separa e divide as panela do casal.\n" +
                "`.velorio @nome` — Organiza um enterro de brincadeira.\n\n" +
                "**• Bate-papo e Música**\n" +
                "`.musica` — Toca uma música calma de fundo na sua chamada de voz.\n" +
                "`.oi` — Dá um oi para bater um papo rápido.\n" +
                "`.pergunta [sua dúvida]` — Pede opiniões ou curiosidades para o bot.\n\n" +
                "🎧 **Ouvir outras músicas (Jockie Music):**\n" +
                "Entra numa sala de voz, vai no canal `#cmd` e digita `m!play` com o nome da música que quiser."
            )
            .setColor("#ffb6c1");

        return mensagem.channel.send({ embeds: [embedGuia] });
    }
    if (cmd === "casar") {
        const alvo = mensagem.mentions.users.first(); 
        if (!alvo || alvo.id === mensagem.author.id) return mensagem.reply("Mencione com quem quer casar!");
        return mensagem.channel.send(`🔔 **PEDIDO DE CASAMENTO!**\n\n${alvo}, o membro ${mensagem.author} está de joelhos perguntando se você aceita se casar! 💕\n*(Responda com SIM ou NÃO no chat)*`);
    }

    if (cmd === "divorciar") {
        const alvo = mensagem.mentions.users.first(); 
        if (!alvo) return mensagem.reply("Mencione de quem quer divorciar.");
        return mensagem.channel.send(`💔 **FIM DA LINHA! DIVÓRCIO CONFIRMADO!**\n\nO casamento de ${mensagem.author} e ${alvo} chegou ao fim de um jeito super dramático! 😭💥\n\n🍳 As panelas foram divididas no meio (cada um ficou com uma tampa)...\n🐶 E a guarda do cachorro acabou ficando oficialmente com a Staff do servidor! ⚖️👮‍♂️`);
    }

    if (cmd === "velorio") {
        const alvo = mensagem.mentions.users.first(); 
        if (!alvo) return message.reply("Mencione quem faleceu.");
        return mensagem.channel.send(`😭🦦 **LUTO NO SERVIDOR!**\n\nEstamos reunidos para chorar o falecimento de ${alvo}. Deixem suas condolências digitando **"F"**!`);
    }

    if (cmd === "avatar") {
        const usuario = mensagem.mentions.users.first() || mensagem.author;
        return mensagem.reply(`Foto de perfil de **${usuario.username}**:\n${usuario.displayAvatarURL({ dynamic: true, size: 1024 })}`);
    }

    if (cmd === "banner") {
        const usuario = mensagem.mentions.users.first() || mensagem.author;
        try {
            const usuarioCompleto = await bot.users.fetch(usuario.id, { force: true }); 
            const urlBanner = usuarioCompleto.bannerURL({ dynamic: true, size: 1024 });
            if (!urlBanner) return mensagem.reply("Este membro não possui um banner de perfil."); 
            return mensagem.reply(`Banner de **${usuario.username}**:\n${urlBanner}`);
        } catch (e) { 
            return mensagem.reply("Houve um erro ao buscar o banner deste perfil."); 
        }
    }

    if (cmd === "roblox") {
        const nomeRoblox = args.join(" ").trim(); 
        if (!nomeRoblox) return mensagem.reply("Digite o nome da conta do Roblox que deseja buscar.");
        const nomeLimpo = nomeRoblox.replace(/[^a-zA-Z0-9_]/g, "");
        const embedRoblox = new EmbedBuilder()
            .setDescription(`🎮 **Skin do Roblox de:** ${nomeRoblox}`)
            .setImage(`https://roblox.com{nomeLimpo}&width=420&height=420&format=png`)
            .setColor("#ffb6c1");
        return mensagem.channel.send({ embeds: [embedRoblox] });
    }

    if (cmd === "musica") {
        const canalVoz = mensagem.member?.voice.channel;
        if (!canalVoz) return mensagem.reply("⚠️ Você precisa entrar em um canal de voz primeiro!");
        const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
        const embedRadio = new EmbedBuilder()
            .setTitle("RÁDIO ANÊMONA LOFI")
            .setDescription(`*Sintonizando a estação mais relaxante do Discord...*\n\n**Tocando agora:** \`Lofi Hip Hop Radio 24/7\`\n**Status:** Conectado ao canal ${canalVoz}!\n\n\`[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬] 24h\``)
            .setColor("#ffb6c1");
        mensagem.reply({ embeds: [embedRadio] });
        try {
            const conexao = joinVoiceChannel({ channelId: canalVoz.id, guildId: mensagem.guild.id, adapterCreator: mensagem.guild.voiceAdapterCreator });
            const reprodutor = createAudioPlayer(); 
            const radioStream = createAudioResource("https://zeno.fm"); 
            reprodutor.play(radioStream); 
            conexao.subscribe(reprodutor);
        } catch (e) {}
        return;
    }

    if (cmd === "adivinhar") {
        const palpite = parseInt(args); const guildId = mensagem.guild.id;
        if (!jogosAdivinhar.has(guildId)) {
            const numSec = Math.floor(Math.random() * 50) + 1;
            jogosAdivinhar.set(guildId, numSec);
            return mensagem.reply("Jogo Iniciado de 1 a 50. Tente: `.adivinhar [número]`");
        }
        const resp = jogosAdivinhar.get(guildId);
        if (isNaN(palpite) || palpite < 1 || palpite > 50) return mensagem.reply("Digite um número válido de 1 a 50.");
        if (palpite === resp) {
            jogosAdivinhar.delete(guildId);
            return mensagem.reply(`🎉 **PARABÉNS!** O número era **${resp}**!`);
        }
        return mensagem.reply(palpite < resp ? "O número é MAIOR!" : "O número é MENOR!");
    }

    if (cmd === "forca") {
        const guildId = mensagem.guild.id;
        if (jogosForca.has(guildId)) return mensagem.reply("Já existe um jogo da forca rolando por aqui!");
        const pal = listaPalavras[Math.floor(Math.random() * listaPalavras.length)];
        const nJogo = { palavra: pal, letrasChutadas: [], vidas: 6 };
        jogosForca.set(guildId, nJogo);
        let ex = nJogo.palavra.split('').map(() => "❓").join(' ');
        return mensagem.reply(`Jogo da Forca Começou.\n👉 \`${ex}\``);
    }
    
    if (cmd === "chute") {
        const guildId = message.guild.id;
        if (!jogosForca.has(guildId)) return mensagem.reply("Não há nenhuma partida de forca rolando agora. Inicie com `.forca`!");
        const chu = args?.toLowerCase();
        if (!chu) return mensagem.reply("Digite uma letra para dar o seu chute!");
        const j = jogosForca.get(guildId);
        if (chu.length > 1) {
            if (chu === j.palavra) { jogosForca.delete(guildId); return mensagem.reply(`🎉 **ACERTOU A PALAVRA INTEIRA!** Era **${j.palavra.toUpperCase()}**!`); }
            j.vidas -= 2;
            if (j.vidas <= 0) { jogosForca.delete(guildId); return mensagem.reply(`💀 **Fim de jogo! Suas vidas acabaram.** A palavra correta era: **${j.palavra.toUpperCase()}**.`); } 
            return mensagem.reply(`❌ Palavra errada! Restam: ${j.vidas} vidas.`);
        }
        if (j.letrasChutadas.includes(chu)) return mensagem.reply("Essa letra já foi tentada antes, escolha outra!"); j.letrasChutadas.push(chu);
        if (j.palavra.includes(chu)) { mensagem.reply(`✅ A letra \`${chu.toUpperCase()}\` está na palavra.`); } 
        else { j.vidas--; if (j.vidas <= 0) { jogosForca.delete(guildId); return mensagem.reply(`💀 **Fim de jogo! Suas vidas acabaram.** A palavra correta era: **${j.palavra.toUpperCase()}**.`); } mensagem.reply(`❌ Letra errada! Restam: ${j.vidas} vidas.`); } 
        let pf = ''; let ganhou = true; for (const l of j.palavra) { if (j.letrasChutadas.includes(l)) { pf += l.toUpperCase() + ' '; } else { pf += "❓ "; ganhou = false; } } 
        if (ganhou) { jogosForca.delete(guildId); return mensagem.channel.send(`🎉 **GANHOU O JOGO!** A palavra era **${j.palavra.toUpperCase()}**!`); } 
        return mensagem.channel.send(`Palavra: \`${pf.trim()}\` | Letras tentadas: [ ${j.letrasChutadas.map(l => l.toUpperCase()).join(', ')} ]`);
    }
    if (cmd === "cl") {
        const quantidade = parseInt(args); 
        if (!quantidade || isNaN(quantidade)) return;

        if (mensagem.author.id === ID_DONO) {
            try { 
                await mensagem.channel.bulkDelete(quantidade + 1, true); 
            } catch (e) {
                return mensagem.reply("Não consigo apagar mensagens com mais de 14 dias!");
            }
            return;
        }

        if (ehBooster && !mensagem.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            if (quantidade > 15) return mensagem.reply("No máximo 15 mensagens!");
            try { 
                await mensagem.channel.bulkDelete(quantidade + 1, true); 
            } catch (e) {
                return mensagem.reply("Não consigo apagar mensagens com mais de 14 dias!");
            } 
            return;
        }

        if (!mensagem.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;
        if (quantidade > 100) return mensagem.reply("No máximo 100 mensagens para a Staff!");

        try { 
            await mensagem.channel.bulkDelete(quantidade + 1, true); 
        } catch (e) {
            return mensagem.reply("Não consigo apagar mensagens com mais de 14 dias!");
        } 
        return;
    }

    if (cmd === "clearall") {
        if (mensagem.author.id !== ID_DONO) return;
        try { 
            const novoCanal = await mensagem.channel.clone(); 
            await novoCanal.setPosition(mensagem.channel.position); 
            await mensagem.channel.delete().catch(() => {}); 
        } catch (e) {} 
        return;
    }

    if (cmd === "cor") {
        if (!ehBooster && mensagem.author.id !== ID_DONO) {
            return mensagem.reply("❌ Comando exclusivo para Boosters!");
        }
        const corEscolhida = args.join("-").toLowerCase();
        if (!corEscolhida || !CORES_BOOSTER[corEscolhida]) {
            return mensagem.reply("Cores válidas: rosa-claro, rosa, magenta, roxo-claro, roxo, roxo-escuro, lavanda, lilás, azul-claro, azul, azul-escuro, marinho, ciano, menta, verde-claro, verde, verde-escuro, esmeralda, amarelo-claro, amarelo, laranja, vermelho, vermelho-vinho, azul-goiaba, branco, cinza");
        }
        try {
            let nomeCargoCor = `Cor-${corEscolhida}-${mensagem.author.id}`;
            let cargoExistente = mensagem.guild.roles.cache.find(r => r.name === nomeCargoCor);
            const cargosVelhos = mensagem.member.roles.cache.filter(r => r.name.startsWith("Cor-") && r.name.endsWith(mensagem.author.id));
            for (const [id, cVelho] of cargosVelhos) {
                await mensagem.member.roles.remove(cVelho).catch(() => {});
            }
            if (!cargoExistente) {
                cargoExistente = await mensagem.guild.roles.create({
                    name: nomeCargoCor,
                    color: CORES_BOOSTER[corEscolhida],
                    reason: 'Cores Anêmona'
                });
            }
            await mensagem.member.roles.add(cargoExistente);
            return mensagem.reply(`✨ Cor atualizada para **${corEscolhida}**!`);
        } catch (e) {
            return mensagem.reply("Coloque o cargo do bot no TOPO da lista!");
        }
    }

    // ==========================================
    // 💬💥 SUPER BANCO DE DADOS DE CONVERSAS (35 FRASES CADA)
    // ==========================================
    if (cmd === "oi") {
        const frasesOi = [
            "Eae! Tudo tranquilo ou sua vida tá mais caótica e instável que um átomo de Urânio? ⚛️",
            "Opa, beleza? Fala aí antes que a concordância nominal e o português chorem com o que você vai digitar.",
            "Eae! Tudo tranquilo por aí ou sua vida tá mais confusa que o final de Evangelion? 🤖",
            "Salve! Tudo na paz ou veio aqui tentar achar a lógica por trás da existência igual um filósofo desocupado?",
            "Oi! Veio em paz ou veio declarar guerra por causa de um balde igual na Idade Média? 🪣",
            "Oi! Veio aqui bater papo ou veio tentar tankar o Bostil igual um verdadeiro guerreiro de Dark Souls?",
            "Eae! Tudo ótimo ou você tá mais sobrecarregado de funções que as mitocôndrias na aula de Biologia?",
            "Eae, tranquilidade? Fala aí antes que a internet caia e você lembre que tem uma vida social lá fora.",
            "Salve! Tudo bem ou sua energia tá mais baixa que a de um jogador de League of Legends às 4 da manhã?",
            "Oi! É para conversar ou veio me dar comandos inúteis só porque não tem nada melhor para fazer?",
            "Opa! Diga aí, o que você quer antes que eu decida cobrar por cada caractere respondido?",
            "Eae! Tudo na paz ou sua cabeça tá mais bagunçada que o roteiro dos últimos filmes da Marvel?",
            "Oi! Passou para dar um salve ou veio reclamar da vida igual todo mundo faz nesse servidor?",
            "Salve! Fala rápido antes que meu processador canse de olhar para a sua foto de perfil.",
            "Oi! Veio em paz ou veio tentar destruir o servidor igual os vilões de anime tentam destruir o mundo?",
            "Opa! Tudo bom? Veio aqui bater papo ou veio coletar as Joias do Infinito? 🌌",
            "Eae! Veio me dar oi ou veio tentar passar da primeira fase de um jogo impossível sem usar macete?",
            "Oi, criatura! Sobreviveu à Peste Negra para vir me dar oi no Discord? 💀",
            "Salve! Tudo na paz ou sua mente tá mais perdida pelo mapa que o Zoro de One Piece?",
            "Oi! Tudo bem ou você tá mais esquecido que as matérias do ano passado na semana de provas?",
            "Oi! Tudo bom? Fala logo antes que eu desista de tudo e vá vender miçanga na praia.",
            "Eae! Tudo na paz ou sua vida tá mais sombria que o retorno daquele que não deve ser nomeado?",
            "Salve! Tudo tranquilo por aí ou você tá mais lost que placa tectônica em dia de terremoto?",
            "Oi! Diga o que quer ou veio aqui tentar me convencer a me juntar ao Lado Sombrio da Força?",
            "Opa, beleza? Você não pode sentar com a gente, mas pode mandar sua mensagem aí.",
            "Salve! Veio conversar ou veio só gastar o teclado porque tá com tédio no meio da semana?",
            "Oi! Veio bater papo ou veio escrever um álbum inteiro de 20 músicas sobre seu último término?",
            "Oi! Veio aqui falar comigo ou veio reclamar do balanceamento do Valorant igual todo mundo? 🎮",
            "Salve! Tudo em paz ou sua cabeça tá rodando mais rápido que o fuso horário da Linha Internacional da Data? 🌍",
            "Opa! Diga o que precisa antes que eu entre em manutenção e te deixe no vácuo espacial. 🚀",
            "Eae! Tudo tranquilo ou você tá mais tenso que a fronteira de Berlim durante a Guerra Fria? 🪖",
            "Oi! Passou para dar um oi ou seu mouse clicou em mim sem querer enquanto você jogava Minecraft? ⛏️",
            "Salve! Fala logo antes que eu gaste meus neurônios artificiais tentando entender por que você não tá estudando.",
            "Opa, beleza? Veio conversar ou veio só ver se eu respondo mais rápido que seu último match?",
            "Oi! Tudo bem ou você tá mais sumido que o carinho paterno na vida de um jogador de LoL?"
        ];
        return mensagem.reply(frasesOi[Math.floor(Math.random() * frasesOi.length)]);
    }

    if (cmd === "pergunta") {
        const texto = args.join(" ").toLowerCase(); 
        if (!texto) return mensagem.reply("O que você quer me perguntar? Digite algo após o comando!");
        if (texto.includes("hello") || texto.includes("hi ") || texto.includes("hola")) { return mensagem.reply("No hablo gringo não, parceiro! KKKKKKKKKKKK"); }
        if (texto.includes("+") || texto.includes("-") || texto.includes("*") || texto.includes("/")) { return mensagem.reply("Faz de cabeça aí, preguiça!"); }
        const opinioes = [
            "Excelente ideia! Tão genial quanto invadir a Rússia no inverno. ❄️",
            "Meu banco de dados encontrou 14 milhões de realidades... e você passa vergonha em todas.",
            "Achei meio cringe... Nem se eu usasse o Death Note eu apagaria isso da minha mente. 📓",
            "Se perder no mapa igual a expedições antigas teria sido melhor do que ler essa sua pergunta de Geografia aí. 🗺️",
            "Que pergunta é essa? Parece o tipo de plano que daria errado na primeira fase do GTA.",
            "Só sei que nada sei... mas de uma coisa tenho certeza: essa sua dúvida quebrou até a lógica de Aristóteles. 🧠",
            "Se eu quisesse ler uma tramoia dessas, eu abria um livro do Machado de Assis para ver o Brás Cubas.",
            "Essa sua ideia foi tão bizarra que abriu uma expansão de domínio de vergonha alheia na minha mente.",
            "Cara, essa sua dúvida parece muito aquele tipo de ideia que o Caruso daria para o Chris se ferrar na escola.",
            "Achei sua dúvida mais sem lógica que o Edward Cullen brilhando no sol em pleno meio-dia.",
            "Isso aí foi tão ruim que o Shrek mandaria você sair do pântano dele na mesma hora.",
            "Essa sua ideia tem tanta chance de dar certo quanto o coiote pegar o papa-léguas.",
            "Se a ignorância gerasse energia, essa sua pergunta acenderia a cidade de São Paulo inteira por um mês.",
            "Achei sua linha de raciocínio mais torta que a Torre de Pisa, mas quem sou eu para julgar.",
            "Olha, até os dinossauros teriam uma ideia melhor antes do meteoro cair. Sério.",
            "Que plano horrível. Parece até as estratégias que dão errado no meio de uma partida de xadrez.",
            "Sua dúvida foi tão profunda quanto um pires d'água no meio do deserto do Saara.",
            "Nem se o Albert Einstein reencarnasse ele conseguiria achar um pingo de inteligência nessa frase.",
            "Isso foi tão cringe que me deu vontade de apertar o botão de reiniciar o universo.",
            "Achei essa sua lógica mais perigosa que misturar Sódio puro com água na aula de Química.",
            "Olha, se o objetivo era me deixar sem palavras pelo absurdo, parabéns, você conseguiu.",
            "Olha, a sua Ansiedade deve estar controlando o painel da sua mente para você ter coragem de perguntar isso.",
            "Sua lógica foi tão pesada que criou uma distorção no espaço-tempo e me mandou direto para outra galáxia. 🌌",
            "Essa sua ideia foi um desastre tão grande que faria o Dom Pedro I proclamar a independência de novo só para fugir dela.",
            "Sua dúvida reduziu o meu poder de luta para menos de 8000 de tanta vergonha alheia. 💥",
            "Isso foi horrível. Tem tanta lógica quanto uma fogueira acesa embaixo d'água na Fenda do Biquíni.",
            "Olha, o Charles Darwin choraria se visse que a evolução da espécie humana resultou nessa sua pergunta aí.",
            "Depois de ler isso, eu passei a duvidar da minha própria existência e da sanidade de quem te deu acesso à internet.",
            "Achei essa ideia tão sem futuro que nem a Disney tentaria fazer uma continuação dela. 🎬",
            "Olha, essa sua dúvida foi um desastre genético tão grande que quebrou as leis da clonagem da ovelha Dolly.",
            "Sua pergunta fez a minha paciência ficar menor que a barra de vida de um boss de Dark Souls. 💀",
            "Isso aí foi tão ruim que até a Equipe Rocket desistiria de tentar roubar essa ideia. 🚀",
            "Essa sua teoria parece o tipo de coisa que alguém digita no Twitter às 3 da manhã achando que é um gênio.",
            "Se a sua inteligência dependesse da profundidade dessa pergunta, você morreria afogado in uma tampinha de garrafa.",
            "Que plano horrível. Nem se eu usasse o ChatGPT para consertar daria um pingo de sentido nisso."
    ];
    return mensagem.reply(opinioes[Math.floor(Math.random() * opinioes.length)]);
}
});

bot.login(process.env.DISCORD_TOKEN);
