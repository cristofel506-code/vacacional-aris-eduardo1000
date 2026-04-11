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

// 1. FUNCIÓN PARA INICIALIZAR/ACTUALIZAR CALENDARIO
function initCalendar(blockedDates = []) {
    if (fp) fp.destroy();
    fp = flatpickr("#fecha", {
        locale: "es",
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: blockedDates,
        onClose: function(selectedDates) {
            if (selectedDates.length === 2) {
                const diff = selectedDates[1] - selectedDates[0];
                nochesGlobal = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
        }
    });
}

// 2. ESCUCHAR RESERVAS (BLOQUEO DE FECHAS Y PANEL)
onSnapshot(collection(db, "reservas"), (snapshot) => {
    const disableDates = [];
    const reservasList = [];

    snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() };
        reservasList.push(data);
        
        // Si está apartada o pagada, bloqueamos el rango en el calendario
        if (data.estado !== "Pendiente" && data.rango) {
            disableDates.push({ from: data.rango[0], to: data.rango[1] });
        }
    });

    initCalendar(disableDates);
    renderAdmin(reservasList);
});

// 3. CALCULAR PRESUPUESTO
document.getElementById("calcularBtn").onclick = () => {
    const f = document.getElementById("fecha").value;
    const s = parseInt(document.getElementById("s").value) || 0;
    const a = parseInt(document.getElementById("a").value) || 0;
    const d = parseInt(document.getElementById("d").value) || 0;
    const t = parseInt(document.getElementById("t").value) || 0;

    if (!f || nochesGlobal === 0) return alert("Selecciona fechas");
    if (s+a+d+t === 0) return alert("Elige habitaciones");

    const total = (s*1500 + a*2500 + d*3000 + t*4000) * nochesGlobal;
    const adelanto = total * 0.5;

    document.getElementById("resultado").classList.remove("hidden");
    document.getElementById("resumenContent").innerHTML = `
        <h2 style="margin:0;">RD$ ${total.toLocaleString()}</h2>
        <p style="color:#64748b;">${f} (${nochesGlobal} noches)</p>
        <div class="pago-box">
            <span style="color:#16a34a; font-weight:800;">RESERVA CON:</span>
            <h3 style="margin:0; color:#16a34a;">RD$ ${adelanto.toLocaleString()}</h3>
        </div>
    `;

    document.getElementById("btnConfirmar").onclick = async () => {
        const selDates = fp.selectedDates;
        await addDoc(collection(db, "reservas"), {
            fechas: f,
            rango: [selDates[0].getTime(), selDates[1].getTime()],
            total: total,
            estado: "Pendiente",
            creado: new Date().getTime()
        });

        const msg = `🌴 *RESERVA ARIS*%0A📅 *Fechas:* ${f}%0A💰 *Total:* RD$ ${total.toLocaleString()}%0A💳 *Adelanto:* RD$ ${adelanto.toLocaleString()}`;
        window.location.href = `https://wa.me/18092823624?text=${msg}`;
    };
};

// 4. FUNCIONES DE ADMINISTRACIÓN
window.toggleAdmin = () => {
    const adminPanel = document.getElementById("adminPanel");
    if (adminPanel.classList.contains("hidden")) {
        const pass = prompt("Clave de Admin:");
        if (pass === "1234") adminPanel.classList.remove("hidden");
    } else {
        adminPanel.classList.add("hidden");
    }
};

window.updateStatus = async (id, status) => {
    await updateDoc(doc(db, "reservas", id), { estado: status });
};

window.deleteReserva = async (id) => {
    if (confirm("¿Eliminar reserva?")) await deleteDoc(doc(db, "reservas", id));
};

function renderAdmin(reservas) {
    const list = document.getElementById("adminList");
    list.innerHTML = "";
    reservas.sort((a,b) => b.creado - a.creado).forEach(res => {
        const item = document.createElement("div");
        item.className = `admin-item st-${res.estado.toLowerCase()}`;
        item.innerHTML = `
            <div>
                <strong>${res.fechas}</strong><br>
                <small>Total: RD$ ${res.total.toLocaleString()} (${res.estado})</small>
            </div>
            <div class="admin-btns">
                <button onclick="updateStatus('${res.id}', 'Apartada')">50%</button>
                <button onclick="updateStatus('${res.id}', 'Pagada')">100%</button>
                <button onclick="deleteReserva('${res.id}')" style="color:red">🗑️</button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Limpiar inputs al tocar
document.querySelectorAll('.qty-input').forEach(i => {
    i.addEventListener('focus', function() { if(this.value === "0") this.value = ""; });
    i.addEventListener('blur', function() { if(this.value === "") this.value = "0"; });
});
