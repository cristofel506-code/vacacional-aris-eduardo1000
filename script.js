import flatpickr from "https://cdn.jsdelivr.net/npm/flatpickr/+esm";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = { 
  apiKey : "AIzaSyAftAGJCLVZGh1mqralhIJa8W7jPvV69iU" , 
  authDomain : "vacacional0.firebaseapp.com" , 
  projectId : "vacacional0" , 
  storageBucket : "vacacional0.firebasestorage.app" , 
  messagingSenderId : "212872737369" , 
  appId : "1:212872737369:web:400033a5197248d6f8b748" 
};

// Inicializar Firebase
const app = initializeApp ( firebaseConfig );
const db = getFirestore(app);

let noches = 0;
let reservaActual = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. CARGAR FECHAS BLOQUEADAS
    let bloqueadas = [];
    const loadBloqueos = async () => {
        const snap = await getDocs(collection(db, "bloqueos"));
        snap.forEach(doc => bloqueadas.push(doc.data().fecha));
    };
    await loadBloqueos();

    // 2. INICIALIZAR CALENDARIO CLIENTE
    const fp = flatpickr("#fecha", {
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: bloqueadas,
        locale: { rangeSeparator: '  →  ' },
        onClose: (sel) => {
            if(sel.length === 2) noches = Math.round((sel[1]-sel[0])/86400000);
        }
    });

    // 3. LÓGICA DE CÁLCULO
    document.getElementById("calcularBtn").onclick = () => {
        const f = document.getElementById("fecha").value;
        const s = parseInt(document.getElementById("s").value) || 0;
        const a = parseInt(document.getElementById("a").value) || 0;
        const d = document.getElementById("d").value;
        const t = document.getElementById("t").value;
        const p = document.getElementById("personas").value;

        if(!f || noches === 0) return alert("Selecciona tus fechas.");
        
        const total = (s*1500 + a*2000 + d*2500 + t*2800) * noches;
        const adelanto = total * 0.5;

        reservaActual = { fechas: f, noches, habitaciones: `S:${s} A:${a} D:${d} T:${t}`, personas: p, total, adelanto };

        document.getElementById("resultado").classList.remove("hidden");
        document.getElementById("resumenContent").innerHTML = `
            <p>📅 <b>${f}</b> (${noches} noches)</p>
            <p>💰 Total: <b>RD$ ${total.toLocaleString()}</b></p>
            <p style="color:green">💳 Adelanto: <b>RD$ ${adelanto.toLocaleString()}</b></p>
        `;
    };

    // 4. WHATSAPP & FIREBASE
    document.getElementById("btnConfirmar").onclick = async () => {
        const btn = document.getElementById("btnConfirmar");
        btn.disabled = true; btn.innerText = "⏳...";

        await addDoc(collection(db, "reservas"), { ...reservaActual, creado: new Date().toLocaleString() });

        const msg = `🌴 *RESERVA ARIS*%0A📅 *Fechas:* ${reservaActual.fechas}%0A🌙 *Noches:* ${reservaActual.noches}%0A👥 *Pers:* ${reservaActual.personas}%0A💰 *Total:* RD$ ${reservaActual.total.toLocaleString()}%0A💳 *Adelanto:* RD$ ${reservaActual.adelanto.toLocaleString()}`;
        window.open(`https://wa.me/18092823624?text=${msg}`);
        location.reload();
    };

    // 5. ADMIN SYSTEM
    const adminBtn = document.getElementById("adminBtn");
    const adminPanel = document.getElementById("adminPanel");
    
    adminBtn.onclick = () => adminPanel.classList.toggle("hidden");
    document.getElementById("closeAdmin").onclick = () => adminPanel.classList.add("hidden");

    document.getElementById("loginAdmin").onclick = async () => {
        if(document.getElementById("adminCode").value === "251210cej") {
            document.getElementById("adminContent").classList.remove("hidden");
            document.getElementById("loginAdmin").classList.add("hidden");
            document.getElementById("adminCode").classList.add("hidden");

            // Cargar Reservas en Admin
            const q = query(collection(db, "reservas"), orderBy("creado", "desc"));
            const rSnap = await getDocs(q);
            let h = "";
            rSnap.forEach(doc => {
                const r = doc.data();
                h += `<div class="reserva-item"><b>${r.fechas}</b><br>RD$ ${r.total.toLocaleString()}</div>`;
            });
            document.getElementById("reservasLista").innerHTML = h || "Sin reservas.";
        }
    };

    // Bloqueo desde Admin
    const fAdmin = flatpickr("#pickerBloqueo", { dateFormat: "d/m/Y" });
    document.getElementById("btnBloquear").onclick = async () => {
        const val = document.getElementById("pickerBloqueo").value;
        if(val) {
            await addDoc(collection(db, "bloqueos"), { fecha: val });
            alert("Fecha bloqueada!");
            location.reload();
        }
    };
});