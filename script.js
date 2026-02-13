// ==================================================
// CONFIGURAÇÕES GERAIS
// ==================================================
const GEOAPIFY_KEY = "208f6874a48c45e68761f3d994db6775";
const RESTAURANTE_COORD = [-49.08077251136753, -26.49674659067563];
const TAXA_BASE = 5;
const VALOR_POR_KM = 1.5;
const WHATSAPP_NUMERO = "5547997278232";

let carrinho = [];
let produtos = [];
let taxaEntregaCalculada = 0;
let LOJA_ABERTA = true;
let MENSAGEM_FECHADA = "Loja Fechada no momento.";

// ==================================================
// STATUS DA LOJA (DINÂMICO PELO ADM)
// ==================================================
async function carregarStatusLoja() {
    try {
        const res = await fetch('content/status.json');
        const data = await res.json();

        LOJA_ABERTA = data.aberto;
        MENSAGEM_FECHADA = data.mensagem;

        const statusEl = document.getElementById("status-loja");
        if (statusEl) {
            statusEl.innerHTML = data.mensagem;
            statusEl.className = "status " + (LOJA_ABERTA ? "aberto" : "fechado");
        }
    } catch (e) {
        console.error("Erro ao carregar status");
    }
}

// ==================================================
// MOTOR DE RENDERIZAÇÃO
// ==================================================
function initSplash() {
    const splash = document.getElementById("splash");
    if (!splash) return;
    setTimeout(() => { splash.remove(); }, 1500);
}

function initMenu() {
    const btn = document.getElementById("hamburger");
    const menu = document.getElementById("mobile-menu");
    if (!btn || !menu) return;
    btn.onclick = () => menu.classList.toggle("open");
}

async function carregarProdutos() {
    const container = document.getElementById("burgers");
    if (!container) return;
    try {
        const res = await fetch("/content/produtos.json");
        const data = await res.json();
        produtos = data.produtos;
        container.innerHTML = "";
        produtos.forEach((p) => {
            if (p.categoria !== "burger") return;
            container.appendChild(criarCardProduto(p));
        });
    } catch (error) { console.error("Erro produtos:", error); }
}





async function carregarBebidas() {
    const container = document.getElementById("bebidas");
    if (!container) return;
    try {
        const res = await fetch("/content/produtos.json");
        const data = await res.json();
        const bebidas = data.produtos.filter(p => p.categoria === "bebida");
        container.innerHTML = "";
        bebidas.forEach((p) => { container.appendChild(criarCardProduto(p)); });
    } catch (error) { console.error("Erro bebidas:", error); }
}

function criarCardProduto(p) {
    const temDesconto = p.oldPrice && p.oldPrice > p.price;
    const card = document.createElement("div");
    card.className = "card-produto";
    card.innerHTML = `
        <img src="${p.image}">
        <div class="card-content">
            <h3>${p.title}</h3>
            <p>${p.ingredientes || ""}</p>
            <div class="price-container">
                <strong>R$ ${p.price.toFixed(2).replace(".", ",")}</strong>
                ${temDesconto ? `<span class="old-price">R$ ${p.oldPrice.toFixed(2).replace(".", ",")}</span>` : ""}
            </div>
            <button onclick="adicionarCarrinhoPorProduto(${JSON.stringify(p).replace(/"/g, '&quot;')})">Adicionar</button>
        </div>
    `;
    return card;
}

// ==================================================
// LÓGICA DO CARRINHO
// ==================================================
function salvarCarrinho() { localStorage.setItem("carrinho", JSON.stringify(carrinho)); }

function carregarCarrinhoStorage() {
    const dados = localStorage.getItem("carrinho");
    if (dados) { carrinho = JSON.parse(dados); atualizarCarrinho(); }
}

function adicionarCarrinhoPorProduto(p) {
    if (!LOJA_ABERTA) { alert(MENSAGEM_FECHADA); return; }
    const item = carrinho.find(i => i.title === p.title);
    if (item) { item.qtd++; } else { carrinho.push({ ...p, qtd: 1 }); }
    salvarCarrinho(); atualizarCarrinho(); mostrarToast();
}



function atualizarCarrinho() {
    const box = document.getElementById("cart-items");
    if (!box) return;
    
    // 1. Limpa o HTML antes de desenhar
    box.innerHTML = ""; 
    let valorTotal = 0;

    // 2. Pega os dados mais recentes do LocalStorage
    // Usamos window.carrinho para garantir sincronia total
    window.carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

    // 3. Desenha os itens
    window.carrinho.forEach((i, index) => {
        const valorItem = i.price * i.qtd;
        valorTotal += valorItem;
        
        box.innerHTML += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                <div style="flex: 1;">
                    <span style="font-weight: bold; display: block; font-size: 0.9rem;">${i.title}</span>
                    <small style="color: #111; font-weight: 700;">${i.qtd}x R$ ${i.price.toFixed(2).replace(".", ",")}</small>
                </div>
                <div style="display: flex; align-items: center;">
                    <button onclick="removerItem(${index})" style="background: #ff4444; color: white; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-weight: bold;">✕</button>
                </div>
            </div>`;
    });

    // 4. Atualiza o Total final
    const totalEl = document.getElementById("total");
    if (totalEl) {
        totalEl.innerText = `Total: R$ ${valorTotal.toFixed(2).replace(".", ",")}`;
    }
}

// ESTA FUNÇÃO PRECISA ESTAR AQUI PARA O BOTÃO (X) FUNCIONAR
window.removerItem = function(index) {
    // 1. Carrega a lista do banco local
    let lista = JSON.parse(localStorage.getItem("carrinho")) || [];
    
    // 2. Remove o item pelo índice
    lista.splice(index, 1);
    
    // 3. Salva a lista atualizada de volta no banco local
    localStorage.setItem("carrinho", JSON.stringify(lista));
    
    // 4. Sincroniza a variável global
    window.carrinho = lista;
    if (typeof carrinho !== 'undefined') carrinho = lista;

    // 5. Manda atualizar a tela na hora
    atualizarCarrinho();
};
// AQUI É O CARRINHO




//
// ==================================================
// ENTREGA & MODAIS
// ==================================================
function abrirCarrinho() { document.getElementById("cart-modal").style.display = "flex"; }
function fecharCarrinho() { document.getElementById("cart-modal").style.display = "none"; }
function abrirDelivery() {
    // --- TRAVA DE SEGURANÇA: CARRINHO VAZIO ---
    if (carrinho.length === 0) {
        alert("Seu carrinho está vazio! Adicione algum produto antes de finalizar.");
        return; 
    }
    fecharCarrinho(); 
    document.getElementById("delivery-modal").style.display = "flex";
    document.getElementById("form-entrega").style.display = "block";
    document.getElementById("resumo-pedido").style.display = "none";
}
function fecharDelivery() { document.getElementById("delivery-modal").style.display = "none"; }

async function calcularTaxa(endereco) {

    const geo = await fetch(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(endereco)}&limit=1&apiKey=${GEOAPIFY_KEY}`
    ).then(r => r.json());

    const destino = geo.features[0].geometry.coordinates;

    const rota = await fetch(
        `https://api.geoapify.com/v1/routing?waypoints=${RESTAURANTE_COORD[1]},${RESTAURANTE_COORD[0]}|${destino[1]},${destino[0]}&mode=drive&apiKey=${GEOAPIFY_KEY}`
    ).then(r => r.json());

    const km = rota.features[0].properties.distance / 1000;

    // 🔥 REGRA: MENOS DE 1 KM = ENTREGA GRÁTIS
    if (km < 1) {
        return 0;
    }

    return TAXA_BASE + (km * VALOR_POR_KM);
}

async function mostrarResumo() {
    const loadingEl = document.getElementById("loading-taxa");
    const resumoEl = document.getElementById("resumo-pedido");
    const formEl = document.getElementById("form-entrega");
    if (!document.getElementById("rua").value || !document.getElementById("nomeCliente").value) {
        alert("Por favor, preencha nome e endereço."); return;
    }
    formEl.style.display = "none";
    loadingEl.style.display = "flex";
    const endereco = `${rua.value}, ${numero.value}, ${bairro.value}, ${cidade.value}`;
    try {
        const taxa = await calcularTaxa(endereco);
        taxaEntregaCalculada = taxa;
        let subtotal = 0;
        carrinho.forEach(i => subtotal += i.price * i.qtd);
        document.getElementById("resumo-itens").innerHTML = carrinho.map(i => `<p>• ${i.qtd}x ${i.title} - R$ ${(i.price * i.qtd).toFixed(2).replace(".", ",")}</p>`).join("");
        document.getElementById("resumo-taxa").innerText = `Taxa de entrega: R$ ${taxaEntregaCalculada.toFixed(2).replace(".", ",")}`;
        document.getElementById("resumo-total").innerText = `Total: R$ ${(subtotal + taxaEntregaCalculada).toFixed(2).replace(".", ",")}`;
        loadingEl.style.display = "none";
        resumoEl.style.display = "block";
    } catch (error) { 
        loadingEl.style.display = "none"; formEl.style.display = "block"; alert("Erro no endereço."); 
    }
}

// ==================================================
// FINALIZAR PEDIDO (FIREBASE + WHATSAPP)
// ==================================================
async function finalizarEntrega() {

    if (typeof db === 'undefined') {
        alert("Erro: Banco de dados não inicializado.");
        return;
    }

    // ===============================
    // CAPTURA DE DADOS DO CLIENTE
    // ===============================
    const nomeCli    = document.getElementById("nomeCliente")?.value || "Não informado";
    const cidadeCli  = document.getElementById("cidade")?.value || "";
    const bairroCli  = document.getElementById("bairro")?.value || "";
    const ruaCli     = document.getElementById("rua")?.value || "";
    const numCli     = document.getElementById("numero")?.value || "";
    const pontoRef   = document.getElementById("pontoReferencia")?.value || "Não informado";
    const obsCozinha = document.getElementById("obsCozinha")?.value || "Nenhuma";
    const pagtoCli   = document.getElementById("pagamento")?.value || "";
    const valorTroco = document.getElementById("trocoPara")?.value || "";

    if (!pagtoCli) {
        alert("Escolha a forma de pagamento!");
        return;
    }

    // ===============================
    // CÁLCULOS
    // ===============================
    let subtotal = 0;
    const agora = new Date();
    const horarioPedido = agora.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // ===============================
    // MONTAGEM DA MENSAGEM WHATSAPP
    // ===============================
    let msgWhatsApp = `*NOVO PEDIDO - ${horarioPedido}*%0A`;
    msgWhatsApp += "---------------------------%0A";

    const itensPedido = carrinho.map(item => {
        subtotal += item.price * item.qtd;

        let tituloFinal = item.categoria === "pizza"
            ? `*${item.title}*`
            : item.title;

        msgWhatsApp += `• ${item.qtd}x ${tituloFinal} (R$ ${item.price.toFixed(2).replace(".", ",")})%0A`;

        return {
            produto: item.title,
            qtd: item.qtd,
            precoUn: item.price
        };
    });

    const totalGeral = subtotal + taxaEntregaCalculada;

    msgWhatsApp += "---------------------------%0A";
    msgWhatsApp += `*VALOR PRODUTOS:* R$ ${subtotal.toFixed(2).replace(".", ",")}%0A`;
    msgWhatsApp += `*TAXA ENTREGA:* R$ ${taxaEntregaCalculada.toFixed(2).replace(".", ",")}%0A`;
    msgWhatsApp += `*TOTAL GERAL: R$ ${totalGeral.toFixed(2).replace(".", ",")}*%0A`;
    msgWhatsApp += "---------------------------%0A%0A";

    msgWhatsApp += `*CLIENTE:* ${nomeCli}%0A`;
    msgWhatsApp += `*ENTREGA:* ${ruaCli}, ${numCli} - ${bairroCli}%0A`;
    msgWhatsApp += `*REF:* _${pontoRef}_%0A%0A`;

    msgWhatsApp += `*PAGAMENTO:* ${pagtoCli}%0A`;
    if (valorTroco) {
        msgWhatsApp += `*TROCO PARA:* R$ ${valorTroco}%0A`;
    }

    msgWhatsApp += `*OBS COZINHA:* ${obsCozinha}%0A`;
    msgWhatsApp += "---------------------------";

    // ===============================
    // ABRE O WHATSAPP (ANTES DO AWAIT)
    // ===============================
    const numeroLimpo = WHATSAPP_NUMERO.replace(/\D/g, '');
    const linkWhats = `https://wa.me/${numeroLimpo}?text=${msgWhatsApp}`;

    // 🔥 ESSENCIAL: abre no clique do usuário
    window.open(linkWhats, "_blank");

    // ===============================
    // SALVA NO FIREBASE
    // ===============================
    try {

        await db.ref('pedidos').push({
            cliente: nomeCli,
            cidade: cidadeCli,
            endereco: `${ruaCli}, ${numCli} - ${bairroCli}`,
            referencia: pontoRef,
            obs_cozinha: obsCozinha,
            pagamento: pagtoCli,
            troco: valorTroco || "Não necessário",
            itens: itensPedido,
            subtotal: subtotal,
            taxaEntrega: taxaEntregaCalculada,
            total: totalGeral,
            horario: horarioPedido,
            data: agora.toISOString(),
            status: "novo"
        });

        carrinho = [];
        salvarCarrinho();
        atualizarCarrinho();
        fecharDelivery();

    } catch (error) {
        console.error("Erro ao salvar no Firebase:", error);
    }
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================
// ==================================================
// INICIALIZAÇÃO (CORRIGIDO)
// ==================================================
document.addEventListener("DOMContentLoaded", () => {
    initSplash(); 
    initMenu(); 
    carregarStatusLoja();
    carregarProdutos();
    carregarBebidas(); 
    carregarCarrinhoStorage();
});






  



// ULTIMO BOTAO DE VOLTAR..
function voltarParaDados() {
    document.getElementById("resumo-pedido").style.display = "none";
    document.getElementById("form-entrega").style.display = "block";
}


function mostrarToast() {
    let toast = document.getElementById("toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        toast.className = "toast"; // 🔥 USA A CLASSE DO CSS
        toast.innerText = "Produto adicionado ao carrinho!";
        document.body.appendChild(toast);
    }

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}

















