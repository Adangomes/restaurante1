const GEOAPIFY_KEY = "208f6874a48c45e68761f3d994db6775";
// 🔑 COLOQUE SUA API KEY DO GEOAPIFY AQUI

console.log("cliente.js carregou");


let origemCoord = null;
let destinoCoord = null;
let distanciaKM = 0;
let valorCorrida = 0;

let origemSelecionada = false;
let destinoSelecionado = false;

async function buscarEndereco(texto, container, onSelect) {
    if (texto.length < 2) {
        container.innerHTML = "";
        return;
    }

    console.log("Buscando:", texto);

    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(texto)}&city=Jaraguá do Sul&country=Brazil&limit=5&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log("Resultado:", data);

    container.innerHTML = "";

    if (!data.features) return;

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

// ===== CALCULA DISTÂNCIA =====
async function calcularCorrida() {
    if (!origemCoord || !destinoCoord) return;

    const url = `https://api.geoapify.com/v1/routing?waypoints=${origemCoord[1]},${origemCoord[0]}|${destinoCoord[1]},${destinoCoord[0]}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.features || !data.features.length) return;

    const rota = data.features[0].properties;

    const metros = rota.distance;
    const segundos = rota.time;

    distanciaKM = (metros / 1000).toFixed(2);
    const minutos = Math.ceil(segundos / 60);

    // 💰 tarifa
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

    if (!origemCoord || !destinoCoord || distanciaKM <= 0) {
        alert("Não foi possível calcular a rota");
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

        if (corrida ? .status === "aceita") {
            document.getElementById("aguardando").classList.add("hidden");
            document.getElementById("motoristaAceitou").classList.remove("hidden");

            document.getElementById("mNome").innerText = corrida.motorista.nome;
            document.getElementById("mCarro").innerText = corrida.motorista.carro;
            document.getElementById("mPlaca").innerText = corrida.motorista.placa;

            if (corrida.motorista.localizacao) {
                calcularTempoMotorista(corrida.motorista.localizacao);
            }
        }
    }, 3000);
}

// ===== TEMPO DO MOTORISTA =====
async function calcularTempoMotorista(loc) {
    const url = `https://api.geoapify.com/v1/routing?waypoints=${loc.lat},${loc.lon}|${origemCoord[1]},${origemCoord[0]}&mode=drive&apiKey=${GEOAPIFY_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    const minutos = Math.ceil(data.features[0].properties.time / 60);
    document.getElementById("tempo").innerText = minutos + " min";
}
