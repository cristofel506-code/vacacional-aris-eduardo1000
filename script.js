import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, doc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDyIdyX_sH9FGB6VPL4Mz9dPlKmyMDYlFc",
    authDomain: "vacacional-aris-543d8.firebaseapp.com",
    projectId: "vacacional-aris-543d8",
    storageBucket: "vacacional-aris-543d8.firebasestorage.app",
    messagingSenderId: "745069402487",
    appId: "1:745069402487:web:3c0d9828fbb52ca8e2e972"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let nochesGlobal = 0;
let fp;

// INICIALIZAR CALENDARIO
function setupCalendar(blockedDates = []) {
    fp = flatpickr("#fecha", {
        locale: "es",
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: blockedDates,
        disableMobile: "true", // Forzar interfaz bonita en móviles
        onChange: function(selectedDates) {
            if (selectedDates.length === 2) {
                const diff = selectedDates[1] - selectedDates[0];
                nochesGlobal = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
        }
    });
}

// SINCRONIZACIÓN REAL
onSnapshot(collection(db, "reservas"), (snapshot) => {
    const disabled = [];
    const all = [];
    snapshot.forEach(doc => {
        const d = { id: doc.id, ...doc.data() };
        all.push(d);
        if (d.estado !== "Pendiente" && d.rango) {
            disabled.push({ from: d.rango[0], to: d.rango[1] });
        }
    });
    setupCalendar(disabled);
    renderAdmin(all);
});

// CALCULAR
document.getElementById("calcularBtn").onclick = () => {
    const s = parseInt(document.getElementById("s").value) || 0;
    const a = parseInt(document.getElementById("a").value) || 0;
    const d = parseInt(document.getElementById("d").value) || 0;
    const fechas = document.getElementById("fecha").value;

    if (!fechas || nochesGlobal === 0) return alert("Por favor, selecciona las fechas en el calendario.");
    if (s+a+d === 0) return alert("Elige al menos una habitación.");

    const total = (s*1500 + a*2500 + d*3000) * nochesGlobal;
    const adelanto = total * 0.5;

    const res = document.getElementById("resultado");
    res.classList.remove("hidden");
    document.getElementById("resumenContent").innerHTML = `
        <div class="ticket-header">Resumen de Estancia</div>
        <div class="ticket-price">RD$ ${total.toLocaleString()}</div>
        <p>${fechas} • <b>${nochesGlobal} Noches</b></p>
        <div class="pago-destacado">
            APARTA CON: <b>RD$ ${adelanto.toLocaleString()}</b>
        </div>
    `;

    document.getElementById("btnConfirmar").onclick = async () => {
        const range = fp.selectedDates.map(d => d.getTime());
        await addDoc(collection(db, "reservas"), {
            fechas,
            rango: range,
            total,
            estado: "Pendiente",
            creado: new Date().getTime()
        });
        const msg = `Hola Aris! Quiero reservar: %0A📅 Fechas: ${fechas}%0A🌙 Noches: ${nochesGlobal}%0A💰 Total: RD$ ${total.toLocaleString()}`;
        window.location.href = `https://wa.me/18092823624?text=${msg}`;
    };
};

// ADMIN
window.toggleAdmin = () => {
    const panel = document.getElementById("adminPanel");
    if (panel.classList.contains("hidden")) {
        if (prompt("Clave de acceso:") === "1234") panel.classList.remove("hidden");
    } else {
        panel.classList.add("hidden");
    }
};

window.updateStatus = async (id, st) => {
    await updateDoc(doc(db, "reservas", id), { estado: st });
};

window.deleteRes = async (id) => {
    if(confirm("¿Eliminar reserva?")) await deleteDoc(doc(db, "reservas", id));
};

function renderAdmin(list) {
    const container = document.getElementById("adminList");
    container.innerHTML = "";
    list.sort((a,b) => b.creado - a.creado).forEach(r => {
        const div = document.createElement("div");
        div.className = `admin-card st-${r.estado.toLowerCase()}`;
        div.innerHTML = `
            <div><b>${r.fechas}</b><br><small>RD$ ${r.total.toLocaleString()} (${r.estado})</small></div>
            <div class="admin-btns">
                <button onclick="updateStatus('${r.id}', 'Apartada')">50%</button>
                <button onclick="updateStatus('${r.id}', 'Pagada')">100%</button>
                <button onclick="deleteRes('${r.id}')">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}
