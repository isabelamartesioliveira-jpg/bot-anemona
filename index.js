const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

const bot = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ] 
});

const PREFIXO = ".";
const ID_DONO = "432610292342587392";

const jogosForca = new Map();
const jogosAdivinhar = new Map();
const listaPalavras = ['discord', 'computador', 'javascript', 'robot', 'banana', 'teclado', 'servidor', 'programacao', 'anemona', 'internet'];

const verdades = [
    'Qual foi o maior mico que você já pagou na escola ou no trabalho?',
    'Quem é a sua pessoa favorita neste servidor do Discord?',
    'Se você ganhasse na loteria hoje, qual seria a primeira coisa que compraria?'
];

const desafios = [
    'Mande um áudio cantando o refrão da sua música favorita no canal de voz!',
    'Mude o seu apelido neste servidor para "Sou Lindo(a)" por 24 horas.',
    'Diga três qualidades sinceras e fofas sobre a pessoa que jogou com você.'
];

const CORES_BOOSTER = {
    'rosa': '#ffb6c1', 'azul': '#3498db', 'roxo': '#9b59b6', 'preto': '#2c3e50', 'verde': '#2ecc71', 'amarelo': '#f1c40f', 'vermelho': '#e74c3c'
};

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

// ==========================================
// 👋 BOAS-VINDAS REDIRECIONANDO PARA RULES E ANEMONA
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
// 🕵️ SISTEMA ANTI-DELETAR (CANAL MENSAGENS)
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
// 📩 SISTEMA INTERATIVO DE TICKETS
// ==========================================
bot.on('interactionCreate', async (interacao) => {
    if (!interacao.isButton()) return;
    if (interacao.customId === 'criar_ticket') {
        await interacao.deferReply({ ephemeral: true });
        const guild = interacao.guild; const usuario = interacao.user;
        
        const canalExistente = guild.channels.cache.find(c => c.name === `ticket-${usuario.username.toLowerCase()}`);
        if (canalExistente) { return interacao.editReply({ content: `Você já possui um ticket aberto em ${canalExistente}!` }); }

        const canalTicket = await guild.channels.create({
            name: `ticket-${usuario.username}`, type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
                { id: usuario.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
                { id: bot.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
            ]
        });

        const embedSalaTicket = new EmbedBuilder()
            .setTitle("SUPORTE - TICKET INDIVIDUAL")
            .setDescription(`Olá ${usuario}, bem-vindo ao seu canal de suporte privado!\n\nExplique o seu problema detalhadamente. A nossa equipe entrará em contato o mais rápido possível.\n\nClique no botão abaixo para encerrar o atendimento.`)
            .setColor("#ffb6c1");
        const painelBotoesTicket = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('fechar_ticket').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger));
        await canalTicket.send({ content: `${usuario} | Staff`, embeds: [embedSalaTicket], components: [painelBotoesTicket] });
        return interacao.editReply({ content: `Seu ticket foi aberto com sucesso em ${canalTicket}!` });
    }

    if (interacao.customId === 'fechar_ticket') {
        await interacao.deferReply(); await interacao.channel.permissionOverwrites.edit(interacao.user.id, { SendMessages: false });
        const embedFechado = new EmbedBuilder().setDescription(`Ticket fechado por **${interacao.user.username}**.\nO canal será deletado automaticamente.`).setColor("#ff0000");
        await interacao.editReply({ embeds: [embedFechado] });
        setTimeout(() => { interacao.channel.delete().catch(() => {}); }, 8000);
    }
});

// ==========================================
// CHAT E COMANDOS PRINCIPAIS
// ==========================================
bot.on("messageCreate", async (mensagem) => {
    if (mensagem.author.bot) return;

    const canalMensagens = mensagem.guild?.channels.cache.find(c => c.name.toLowerCase() === 'mensagens' && c.type === ChannelType.GuildText);
    if (canalMensagens && mensagem.channel.id !== canalMensagens.id && mensagem.channel.name.toLowerCase() !== 'hidden') {
        const embedLogMsg = new EmbedBuilder()
            .setAuthor({ name: mensagem.author.tag, iconURL: mensagem.author.displayAvatarURL({ dynamic: true }) })
            .setDescription(`💬 **Mensagem enviada em** ${mensagem.channel}:\n> ${mensagem.content}`).setColor("#cccccc").setTimestamp();
        await canalMensagens.send({ embeds: [embedLogMsg] }).catch(() => {});
    }

    if (mensagem.channel.name.toLowerCase() === 'hidden') {
        try { await mensagem.delete(); } catch (e) { return; }
        const segredo = mensagem.content.trim(); if (!segredo) return;
        const canalInbox = message.guild?.channels.cache.find(c => c.name.toLowerCase() === 'inbox' && c.type === ChannelType.GuildText);
        if (!canalInbox) return;
        
        const embedInboxFoto = new EmbedBuilder().setTitle("Anonymous").setDescription(segredo).setColor("#ffffff").setFooter({ text: "Mensagem anônima" });
        return canalInbox.send({ embeds: [embedInboxFoto] });
    }

    if (!mensagem.content.startsWith(PREFIXO)) return;
    const args = mensagem.content.slice(PREFIXO.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    const ehBooster = mensagem.member?.premiumSince !== null;

    if (cmd === "ajuda") {
        return mensagem.reply(
            `**PAINEL DE AJUDA - ANÊMONA**\n\n` +
            `• \`.setup-ticket\` — Cria o painel de atendimento limpo.\n` +
            `• \`.setup-guia\` — Envia o manual de comandos definitivo.\n` +
            `• \`.musica\` — Conecta e toca a Rádio Lofi de fundo.\n` +
            `• \`.rules\` — Envia o painel de regras com o coração branco.\n` +
            `• \`.cor [nome-da-cor]\` — Muda a cor do seu nome (Apenas Boosters).\n` +
            `• \`.casar\`, \`.divorciar\`, \`.velorio\` — Comandos sociais do RPG.\n` +
                        "• .avatar, .banner, .roblox, .jogos, .akinator, .oi, .pergunta"
        );
    }

    if (cmd === "setup-guia") {

      if (!mensagem.member.permissions.has(PermissionFlagsBits.Administrator)) return;
      await mensagem.delete().catch(() => {});

           const embedGuia = new EmbedBuilder()
          .setTitle("Guia de Comandos — Anêmonas")
                    .setDescription(`• Laços e Separações
.casar @nome — Pede alguém em casamento.
.divorciar @nome — Separa e divide as panelas do casal.
.velorio @nome — Organiza um enterro de brincadeira.

• Fotos e Perfis
.avatar @membro — Puxa a foto de perfil em tamanho grande.
.banner @membro — Mostra a imagem de fundo do perfil.
.roblox nome — Exibe a skin do boneco do Roblox.

• Bate-papo e Música
.musica — Toca uma música calma de fundo na sua chamada de voz.
.oi — Dá um oi para bater um papo rápido.
.pergunta sua dúvida — Pede opiniões ou curiosidades para o bot.

🎧 Ouvir outras músicas (Jockie Music):
Entra numa sala de voz, vai no canal #cmd e digita m!play com o nome da música que quiser.`)
          .setColor("#ffb6c1");

      return mensagem.channel.send({ embeds: [embedGuia] });
  }

  if (cmd === "setup-ticket") {
      if (!mensagem.member.permissions.has(PermissionFlagsBits.Administrator)) return;
      await mensagem.delete().catch(() => {});

      const embedPainelTicket = new EmbedBuilder()
          .setTitle("CENTRAL DE ATENDIMENTO E SUPORTE")
          .setDescription("Precisa de ajuda da nossa equipe de Administração ou quer fazer uma denúncia?\n\nClique no botão \"Abrir Ticket\" abaixo para iniciar um atendimento privado e individual de forma segura!")
          .setColor("#ffb6c1")
          .setFooter({ text: "Sistema de Suporte Oficial Anêmonas" });

      const linhaBotao = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('criar_ticket').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary)
      );
      return mensagem.channel.send({ embeds: [embedPainelTicket], components: [linhaBotao] });
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
          const rádioStream = createAudioResource("https://zeno.fm");
          reprodutor.play(rádioStream); 
          conexao.subscribe(reprodutor);
      } catch (e) {}
      return;
  }

  if (cmd === "rules") {
      if (!mensagem.member.permissions.has(PermissionFlagsBits.Administrator)) return;
      await mensagem.delete().catch(() => {});

      const embedRegras = new EmbedBuilder()
          .setTitle("Rules")
          .setDescription("**• Respeite todos**\nTrate todos com educação. Preconto, discriminação e ofensas não serão tolerados.\n\n**• Sem bullying ou ataques**\nNada de provocações, humilhações ou comportamento tóxico.\n\n**• Sem conteúdo impróprio**\nProibido conteúdo +18 ou ilegal.\n\n**• Sem spam ou flood**\nEvite flood no chat.\n\n**• Use os canais corretamente**\nMantenha as conversas organizadas.\n\n**• Sem divulgação**\nProibido convites de outros servidores sem autorização.\n\n◽ seja bem vindo ao nemonas ! 🤍")
          .setColor("#ffb6c1");

      const gifRegras = pegarGifAleatorio("regras");
      if (gifRegras) { return mensagem.channel.send({ embeds: [embedRegras], files: [gifRegras.arquivo] }); }
      return mensagem.channel.send({ embeds: [embedRegras] });
              // ==========================================
  // 🎨 PRIVILÉGIO BOOSTER: TROCA DE COR DO NOME
  // ==========================================
  if (cmd === "cor") {
      if (!ehBooster && mensagem.author.id !== ID_DONO) return mensagem.reply("❌ Comando exclusivo para Boosters!");
      const corEscolhida = args?.toLowerCase(); if (!corEscolhida || !CORES_BOOSTER[corEscolhida]) return mensagem.reply("Cores válidas: rosa, azul, roxo, preto, verde, amarelo, vermelho");
      try {
          let nomeCargoCor = `Cor-${corEscolhida}-${mensagem.author.id}`; let cargoExistente = mensagem.guild.roles.cache.find(r => r.name === nomeCargoCor);
          const cargosVelhos = mensagem.member.roles.cache.filter(r => r.name.startsWith("Cor-") && r.name.endsWith(mensagem.author.id));
          for (const [id, cVelho] of cargosVelhos) { await mensagem.member.roles.remove(cVelho).catch(() => {}); }
          if (!cargoExistente) { cargoExistente = await mensagem.guild.roles.create({ name: nomeCargoCor, color: CORES_BOOSTER[corEscolhida], reason: 'Cores Anêmona' }); }
          await mensagem.member.roles.add(cargoExistente); return mensagem.reply(`✨ Cor atualizada para **${corEscolhida}**!`);
      } catch (e) { return mensagem.reply("Coloque o cargo do bot no TOPO da lista!"); }
  }

  // ==========================================
  // 💍 RPG SOCIAL: CASAR, DIVORCIAR E VELÓRIO
  // ==========================================
  if (cmd === "casar") {
      const alvo = mensagem.mentions.users.first(); if (!alvo || alvo.id === mensagem.author.id) return mensagem.reply("Mencione com whom quer casar!");
      return mensagem.channel.send(`🔔 **PEDIDO DE CASAMENTO!**\n\n${alvo}, o membro ${mensagem.author} está de joelhos perguntando se você aceita se casar! 💕\n*(Responda com SIM ou NÃO no chat)*`);
  }
  if (cmd === "divorciar") {
      const alvo = mensagem.mentions.users.first(); if (!alvo) return mensagem.reply("Mencione de quem quer divorciar.");
      return mensagem.channel.send(`💔 **DIVÓRCIO CONFIRMADO!**\n\nO casamento de ${mensagem.author} e ${alvo} chegou ao fim dramaticamente!`);
  }
  if (cmd === "velorio") {
      const alvo = mensagem.mentions.users.first(); if (!alvo) return mensagem.reply("Mencione quem faleceu.");
      return mensagem.channel.send(`😭🦦 **LUTO NO SERVIDOR!**\n\nEstamos reunidos para chorar o falecimento de ${alvo}. Deixem suas condolências digitando **"F"**!`);
  }

  // ==========================================
  // 🖼️ UTILITÁRIOS, AVATAR, BANNER E ROBLOX
  // ==========================================
  if (cmd === "avatar") {
      const usuario = mensagem.mentions.users.first() || mensagem.author;
      return mensagem.reply(`Foto de perfil de **${usuario.username}**:\n${usuario.displayAvatarURL({ dynamic: true, size: 1024 })}`);
  }
  if (cmd === "banner") {
      const usuario = mensagem.mentions.users.first() || mensagem.author;
      try {
          const usuarioCompleto = await bot.users.fetch(usuario.id, { force: true }); const urlBanner = usuarioCompleto.bannerURL({ dynamic: true, size: 1024 });
          if (!urlBanner) return mensagem.reply("Não possui banner."); return mensagem.reply(`Banner de **${usuario.username}**:\n${urlBanner}`);
      } catch (e) { return mensagem.reply("Erro ao buscar."); }
  }
  if (cmd === "roblox") {
      const nomeRoblox = args.join(" ").trim(); if (!nomeRoblox) return mensagem.reply("Digite o nome do Roblox.");
      const embed = new EmbedBuilder().setDescription(`🎮 **Skin do Roblox de:** ${nomeRoblox}`).setImage(`https://roblox.com{nomeRoblox.replace(/[^a-zA-Z0-9]/g, "")}`);
      return mensagem.channel.send({ embeds: [embed] });
  }

  // ==========================================
  // JOGOS E ENTRETENIMENTO
  // ==========================================
  if (cmd === "akinator") return mensagem.reply("🔮 **Akinator Iniciado!** Pense em um personagem. Digite \`.chute\` para desafiar meus palpites!");
  if (cmd === "jogos") {
      const embedJogos = new EmbedBuilder().setTitle("🎮 CENTRAL DE JOGOS").setDescription(`• ✏️ [Gartic](https://gartic.com.br)\n• 🃏 [Uno Online](https://letsplayuno.com)\n• 🌸 [Mudae Bot](https://top.gg)\n• 🎧 [Jockie Music](https://jockiemusic.com)`).setColor("#ffb6c1");
      return mensagem.reply({ embeds: [embedJogos] });
  }
  if (cmd === "oi") {
      const frasesOi = ["Eae! Tranquilidade? ✌️", "Opa! Beleza? Fala aí!", "Oi, criatura! Tudo bem?", "Salve, salve!"];
      return mensagem.reply(frasesOi[Math.floor(Math.random() * frasesOi.length)]);
  }
  if (cmd === "pergunta") {
      const texto = args.join(" ").toLowerCase(); if (!texto) return mensagem.reply("O que quer perguntar?");
      if (texto.includes("hello") || texto.includes("hi ") || texto.includes("hola")) return mensagem.reply("No hablo gringo não, parceiro! 🤣");
      if (texto.includes("+") || texto.includes("-") || texto.includes("*") || texto.includes("/")) return mensagem.reply("Faz de cabeça aí, preguiça! 🧮");
      const opinioes = ["Achei meio cringe... 🤫", "Excelente ideia! 👍", "Vá beber uma água agora mesmo! 💧", "Absolutamente genial!"];
      return mensagem.reply(opinioes[Math.floor(Math.random() * opinioes.length)]);
  }

  // ==========================================
  // 🧹 MODERAÇÃO: LIMPEZA DE CHAT
  // ==========================================
  if (cmd === "cl") {
      const quantidade = parseInt(args); if (!quantidade) return;
      if (ehBooster && !mensagem.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          if (quantidade > 15) return mensagem.reply("Maximum 15 mensagens!");
          try { await mensagem.channel.bulkDelete(quantidade + 1, true); } catch (e) {} return;
      }
      if (!mensagem.member.permissions.has(PermissionFlagsBits.ManageMessages) && mensagem.author.id !== ID_DONO) return;
      try { await mensagem.channel.bulkDelete(quantidade + 1, true); } catch (e) {} return;
  }
  if (cmd === "clearall") {
      if (mensagem.author.id !== ID_DONO) return;
      try { const novoCanal = await mensagem.channel.clone(); await novoCanal.setPosition(mensagem.channel.position); await mensagem.channel.delete().catch(() => {}); } catch (e) {} return;
  }
  
  // ==========================================
  // SISTEMAS DE MINIJOGOS
  // ==========================================
  if (cmd === "adivinhar") {
      const palpite = parseInt(args); const guildId = mensagem.guild.id;
      if (!jogosAdivinhar.has(guildId)) {
          const numSec = Math.floor(Math.random() * 50) + 1;
          jogosAdivinhar.set(guildId, numSec);
          return mensagem.reply("Jogo Iniciado de 1 a 50. Tente: `.adivinhar [número]`");
      }
      const resp = jogosAdivinhar.get(guildId);
      if (isNaN(palpite) || palpite < 1 || palpite > 50) return mensagem.reply("Digite um número de 1 a 50.");
      if (palpite === resp) {
          jogosAdivinhar.delete(guildId);
          return mensagem.reply(`🎉 **PARABÉNS!** O número era **${resp}**!`);
      }
      return mensagem.reply(palpite < resp ? "O número é MAIOR!" : "O número é MENOR!");
  }
  if (cmd === "forca") {
      const guildId = mensagem.guild.id;
      if (jogosForca.has(guildId)) return mensagem.reply("Já existe um jogo rolando!");
      const pal = listaPalavras[Math.floor(Math.random() * listaPalavras.length)];
      const nJogo = { palavra: pal, letrasChutadas: [], vidas: 6 };
      jogosForca.set(guildId, nJogo);
      let ex = nJogo.palavra.split('').map(() => "❓").join(' ');
      return mensagem.reply(`Jogo da Forca Começou.\n👉 \`${ex}\``);
  }
  if (cmd === "chute") {
      const guildId = mensagem.guild.id;
      if (!jogosForca.has(guildId)) return mensagem.reply("Não há jogo rolando.");
      const j = jogosForca.get(guildId); const chu = args?.toLowerCase();
      if (!chu) return mensagem.reply("Digite uma letra!");
      if (chu.length > 1) {
          if (chu === j.palavra) { jogosForca.delete(guildId); return mensagem.reply(`ACERTOU! Era **${j.palavra.toUpperCase()}**!`); }
          j.vidas -= 2; if (j.vidas <= 0) { jogosForca.delete(guildId); return mensagem.reply(`Fim! Era: **${j.palavra.toUpperCase()}**.`); } return mensagem.reply(`Errou! Restam: ${j.vidas} vidas.`);
      }
      if (j.letrasChutadas.includes(chu)) return mensagem.reply("Já tentada."); j.letrasChutadas.push(chu);
      if (j.palavra.includes(chu)) { mensagem.reply(`A letra \`${chu.toUpperCase()}\` está na palavra.`); } 
      else { j.vidas--; if (j.vidas <= 0) { jogosForca.delete(guildId); return mensagem.reply(`Fim! Era: **${j.palavra.toUpperCase()}**.`); } mensagem.reply(`Errou! Restam: ${j.vidas} vidas.`); } 
      let pf = ''; let g = true; for (const l of j.palavra) { if (j.letrasChutadas.includes(l)) { pf += l.toUpperCase() + ' '; } else { pf += "❓ "; g = false; } } 
      if (g) { jogosForca.delete(guildId); return mensagem.channel.send(`🎉 **GANHOU!** Era **${j.palavra.toUpperCase()}**!`); } 
     return mensagem.channel.send(`Palavra: \`${pf.trim()}\` | Tentadas: [ ${j.letrasChutadas.map(l => l.toUpperCase()).join(', ')} ]`);
    }
});

bot.login(process.env.DISCORD_TOKEN);
