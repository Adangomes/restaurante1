console.log("cliente.js carregou");

let origemCoord = null;
let destinoCoord = null;
let distanciaKM = 0;
let valorCorrida = 0;

let origemSelecionada = false;
let destinoSelecionado = false;

// 📍 AUTOCOMPLETE DE ENDEREÇOS (JARAGUÁ DO SUL)
async function buscarEndereco(texto, container, onSelect) {
    if (texto.length < 2) {
        container.innerHTML = "";
        return;
    }

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        texto
    )}&bias=proximity:-49.0716,-26.4851&limit=5&apiKey=${GEOAPIFY_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    container.innerHTML = "";

    if (!data.features || !data.features.length) return;

    data.features.forEach(f => {
        const div = document.createElement("div");
        div.textContent = f.properties.formatted;

        div.onclick = () => {
            onSelect(f);
            container.innerHTML = "";
        };

        container.appendChild(div);
    });
}

// ===== INPUTS =====
const origemInput = document.getElementById("origem");
const destinoInput = document.getElementById("destino");

const origemSug = document.getElementById("origemSugestoes");
const destinoSug = document.getElementById("destinoSugestoes");

origemInput.addEventListener("input", () => {
    origemSelecionada = false;
    origemCoord = null;

    buscarEndereco(origemInput.value, origemSug, f => {
        origemInput.value = f.properties.formatted;
        origemCoord = f.geometry.coordinates;
        origemSelecionada = true;
        calcularCorrida();
    });
});

destinoInput.addEventListener("input", () => {
    destinoSelecionado = false;
    destinoCoord = null;

    buscarEndereco(destinoInput.value, destinoSug, f => {
        destinoInput.value = f.properties.formatted;
        destinoCoord = f.geometry.coordinates;
        destinoSelecionado = true;
        calcularCorrida();
    });
});

// ===== CALCULAR DISTÂNCIA / TEMPO / VALOR =====
async function calcularCorrida() {
    if (!origemCoord || !destinoCoord) return;

    const url = `https://api.geoapify.com/v1/routing?waypoints=${origemCoord[1]},${origemCoord[0]}|${destinoCoord[1]},${destinoCoord[0]}&mode=drive&apiKey=${GEOAPIFY_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || !data.features.length) return;

    const rota = data.features[0].properties;

    distanciaKM = (rota.distance / 1000).toFixed(2);
    const minutos = Math.ceil(rota.time / 60);

    valorCorrida = 5 + distanciaKM * 1;

    document.getElementById("distancia").innerText = `${distanciaKM} km`;
    document.getElementById("tempoViagem").innerText = `${minutos} min`;
    document.getElementById("valor").innerText = `R$ ${valorCorrida.toFixed(2)}`;
}

// ===== SOLICITAR CORRIDA =====
function solicitarCorrida() {
    if (!origemSelecionada || !destinoSelecionado) {
        alert("Selecione ruas válidas em Jaraguá do Sul");
        return;
    }

    const corrida = {
        origem: origemInput.value,
        destino: destinoInput.value,
        origemCoord,
        destinoCoord,
        distancia: distanciaKM,
        valor: valorCorrida,
        status: "aguardando",
        motorista: null
    };

    localStorage.setItem("corrida", JSON.stringify(corrida));

    document.getElementById("formCorrida").classList.add("hidden");
    document.getElementById("aguardando").classList.remove("hidden");

    aguardarMotorista();
}

// ===== ESCUTA MOTORISTA =====
function aguardarMotorista() {
    setInterval(() => {
        const corrida = JSON.parse(localStorage.getItem("corrida"));

        if (corrida && corrida.status === "aceita") {
            document.getElementById("aguardando").classList.add("hidden");
            document.getElementById("motoristaAceitou").classList.remove("hidden");

            document.getElementById("mNome").innerText = corrida.motorista.nome;
            document.getElementById("mCarro").innerText = corrida.motorista.carro;
            document.getElementById("mPlaca").innerText = corrida.motorista.placa;
        }
    }, 3000);
}
