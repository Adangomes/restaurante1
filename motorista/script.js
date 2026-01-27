// ===== MOTORISTAS CADASTRADOS =====
const motoristas = [{
    nome: "Joao Ferreira",
    senha: "1234",
    carro: "HB20 Branco",
    placa: "ABC-1A23"
}];

let motoristaLogado = null;
let corridaAtual = null;
let online = false;
let escutaInterval = null;

// ===== LOGIN =====
function login() {
    const nome = document.getElementById("nomeLogin").value;
    const senha = document.getElementById("senhaLogin").value;

    const encontrado = motoristas.find(
        m => m.nome === nome && m.senha === senha
    );

    if (!encontrado) {
        alert("Nome ou senha inválidos");
        return;
    }

    motoristaLogado = { ...encontrado, localizacao: null };

    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    document.getElementById("motoristaNome").innerText = motoristaLogado.nome;
}

// ===== BOTÃO ONLINE =====
const statusBtn = document.getElementById("statusBtn");
const corridaBox = document.getElementById("corrida");

statusBtn.onclick = () => {
    online = !online;

    statusBtn.textContent = online ? "🟢 ONLINE" : "🔴 OFFLINE";
    statusBtn.className = online ? "online" : "offline";

    if (online) {
        iniciarEscuta();
    } else {
        pararEscuta();
        corridaBox.classList.add("hidden");
    }
};

// ===== ESCUTAR CORRIDAS =====
function iniciarEscuta() {
    if (escutaInterval) return;

    escutaInterval = setInterval(() => {
        if (!online || corridaAtual) return;

        const corrida = JSON.parse(localStorage.getItem("corrida"));

        if (corrida && corrida.status === "aguardando") {
            corridaAtual = corrida;
            mostrarCorrida(corrida);
        }
    }, 2000);
}

function pararEscuta() {
    clearInterval(escutaInterval);
    escutaInterval = null;
}

// ===== MOSTRAR CORRIDA =====
function mostrarCorrida(c) {
    corridaBox.classList.remove("hidden");

    document.getElementById("origemTxt").innerText = c.origem;
    document.getElementById("destinoTxt").innerText = c.destino;
    document.getElementById("distancia").innerText = c.distancia + " km";
    document.getElementById("valor").innerText = "R$ " + c.valor.toFixed(2);
}

// ===== ACEITAR =====
function aceitarCorrida() {
    if (!corridaAtual) return;

    corridaAtual.status = "aceita";
    corridaAtual.motorista = motoristaLogado;

    localStorage.setItem("corrida", JSON.stringify(corridaAtual));

    corridaBox.classList.add("hidden");
    iniciarLocalizacao();
}

// ===== RECUSAR =====
function recusarCorrida() {
    corridaBox.classList.add("hidden");
    corridaAtual = null;
}

// ===== LOCALIZAÇÃO DO MOTORISTA =====
function iniciarLocalizacao() {
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition(pos => {
        if (!corridaAtual || corridaAtual.status !== "aceita") return;

        motoristaLogado.localizacao = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude
        };

        corridaAtual.motorista = motoristaLogado;
        localStorage.setItem("corrida", JSON.stringify(corridaAtual));
    });
}
