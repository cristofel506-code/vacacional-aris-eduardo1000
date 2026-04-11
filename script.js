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

function initCalendar(blockedDates = []) {
    if (fp) fp.destroy();
    fp = flatpickr("#fecha", {
        locale: "es",
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: blockedDates,
        disableMobile: "true",
        clickOpens: true,
        allowInput: false,
        onClose: function(selectedDates) {
            if (selectedDates.length === 2) {
                const diff = selectedDates[1] - selectedDates[0];
                nochesGlobal = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
        }
    });
}

document.getElementById('calendar-trigger').onclick = () => { if(fp) fp.open(); };

onSnapshot(collection(db, "reservas"), (snapshot) => {
    const disableDates = [];
    const allReservas = [];
    snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        allReservas.push(data);
        if (data.estado !== "Pendiente" && data.rango) {
            disableDates.push({ from: data.rango[0], to: data.rango[1] });
        }
    });
    initCalendar(disableDates);
    renderAdmin(allReservas);
});

document.getElementById("calcularBtn").onclick = () => {
    const f = document.getElementById("fecha").value;
    const s = parseInt(document.getElementById("s").value) || 0;
    const a = parseInt(document.getElementById("a").value) || 0;
    const d = parseInt(document.getElementById("d").value) || 0;
    const t = parseInt(document.getElementById("t").value) || 0;

    if (!f || nochesGlobal === 0) return alert("Selecciona tus fechas en el calendario");
    if (s+a+d+t === 0) return alert("Elige al menos 1 habitación");

    const total = (s*1500 + a*2000 + d*2500 + t*2800) * nochesGlobal;
    const adelanto = total * 0.5;

    document.getElementById("resultado").classList.remove("hidden");
    document.getElementById("resumenContent").innerHTML = `
        <div class="ticket-info">
            <h2 style="margin:0; font-size:1.8rem;">RD$ ${total.toLocaleString()}</h2>
            <p style="color:#64748b; margin:5px 0;">${f} (${nochesGlobal} noches)</p>
            <div class="pago-box">
                <small>APARTA CON EL 50%:</small>
                <h3 style="margin:0; color:#16a34a;">RD$ ${adelanto.toLocaleString()}</h3>
            </div>
        </div>
    `;

    document.getElementById("btnConfirmar").onclick = async () => {
        const range = fp.selectedDates.map(d => d.getTime());
        await addDoc(collection(db, "reservas"), {
            fechas: f,
            rango: range,
            total: total,
            estado: "Pendiente",
            creado: new Date().getTime()
        });
        const msg = `🌴 *RESERVA ARIS*%0A📅 *Fechas:* ${f}%0A🌙 *Noches:* ${nochesGlobal}%0A💰 *Total:* RD$ ${total.toLocaleString()}%0A💳 *Adelanto:* RD$ ${adelanto.toLocaleString()}`;
        window.location.href = `https://wa.me/18092823624?text=${msg}`;
    };
};

window.toggleAdmin = () => {
    const p = document.getElementById("adminPanel");
    if (p.classList.contains("hidden")) {
        if (prompt("Clave:") === "1234") p.classList.remove("hidden");
    } else { p.classList.add("hidden"); }
};

window.setStatus = async (id, st) => { await updateDoc(doc(db, "reservas", id), { estado: st }); };
window.deleteRes = async (id) => { if(confirm("¿Eliminar?")) await deleteDoc(doc(db, "reservas", id)); };

function renderAdmin(arr) {
    const list = document.getElementById("adminList");
    list.innerHTML = "";
    arr.sort((a,b) => b.creado - a.creado).forEach(res => {
        const div = document.createElement("div");
        div.className = `admin-card st-${res.estado.toLowerCase()}`;
        div.innerHTML = `
            <div><b>${res.fechas}</b><br><small>RD$ ${res.total.toLocaleString()} (${res.estado})</small></div>
            <div class="admin-btns">
                <button onclick="setStatus('${res.id}', 'Apartada')">50%</button>
                <button onclick="setStatus('${res.id}', 'Pagada')">100%</button>
                <button onclick="deleteRes('${res.id}')">🗑️</button>
            </div>
        `;
        list.appendChild(div);
    });
}
