document.addEventListener("DOMContentLoaded", () => {

    // ===== MOTORISTAS =====
    const motoristas = [
        {
            nome: "joao",
            senha: "1234",
            carro: "HB20 Branco",
            placa: "ABC-1A23"
        }
    ];

    let motoristaLogado = null;
    let corridaAtual = null;
    let online = false;
    let intervaloCorridas = null;

    // ===== ELEMENTOS =====
    const loginBox = document.getElementById("login");
    const appBox = document.getElementById("app");
    const nomeTxt = document.getElementById("motoristaNome");
    const statusBtn = document.getElementById("statusBtn");
    const corridaBox = document.getElementById("corrida");

    // ===== LOGIN =====
    document.getElementById("btnLogin").onclick = () => {
        const nome = document.getElementById("nomeLogin").value.trim().toLowerCase();
        const senha = document.getElementById("senhaLogin").value.trim();

        const encontrado = motoristas.find(
            m => m.nome === nome && m.senha === senha
        );

        if (!encontrado) {
            alert("❌ Usuário ou senha inválidos");
            return;
        }

        motoristaLogado = {
            nome: encontrado.nome,
            carro: encontrado.carro,
            placa: encontrado.placa,
            localizacao: null
        };

        loginBox.classList.add("hidden");
        appBox.classList.remove("hidden");
        nomeTxt.innerText = "Motorista: " + motoristaLogado.nome.toUpperCase();
    };

    // ===== ONLINE / OFFLINE =====
    statusBtn.onclick = () => {
        online = !online;

        statusBtn.textContent = online ? "🟢 ONLINE" : "🔴 OFFLINE";
        statusBtn.className = online ? "online" : "offline";

        if (online) {
            escutarCorridas();
            iniciarLocalizacao();
        } else {
            clearInterval(intervaloCorridas);
            corridaBox.classList.add("hidden");
        }
    };

    // ===== ESCUTA CORRIDAS DO CLIENTE =====
    function escutarCorridas() {
        intervaloCorridas = setInterval(() => {
            if (!online) return;

            const corrida = JSON.parse(localStorage.getItem("corrida"));

            if (corrida && corrida.status === "aguardando") {
                corridaAtual = corrida;
                mostrarCorrida(corrida);
            }
        }, 1500);
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
    document.getElementById("btnAceitar").onclick = () => {
        if (!corridaAtual) return;

        corridaAtual.status = "aceita";
        corridaAtual.motorista = motoristaLogado;

        localStorage.setItem("corrida", JSON.stringify(corridaAtual));

        corridaBox.classList.add("hidden");
        alert("✅ Corrida aceita!");
    };

    // ===== RECUSAR =====
    document.getElementById("btnRecusar").onclick = () => {
        corridaBox.classList.add("hidden");
        corridaAtual = null;
    };

    // ===== LOCALIZAÇÃO =====
    function iniciarLocalizacao() {
        if (!navigator.geolocation) return;

        navigator.geolocation.watchPosition(pos => {
            if (!corridaAtual) return;

            motoristaLogado.localizacao = {
                lat: pos.coords.latitude,
                lon: pos.coords.longitude
            };

            corridaAtual.motorista = motoristaLogado;
            localStorage.setItem("corrida", JSON.stringify(corridaAtual));
        });
    }

});
