import flatpickr from "https://cdn.jsdelivr.net/npm/flatpickr/+esm";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let noches = 0;
let resumen = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    const bloqueadas = [];
    try {
        const snap = await getDocs(collection(db, "bloqueos"));
        snap.forEach(d => bloqueadas.push(d.data().fecha));
    } catch(e) {}

    flatpickr("#fecha", {
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: bloqueadas,
        disableMobile: "true",
        locale: { rangeSeparator: ' → ' },
        onClose: (sel) => {
            if(sel.length === 2) noches = Math.round((sel[1]-sel[0])/86400000);
        }
    });

    const inputsQty = document.querySelectorAll('.qty-input');
    inputsQty.forEach(input => {
        input.addEventListener('focus', function() { if (this.value === "0") this.value = ""; });
        input.addEventListener('blur', function() { if (this.value === "") this.value = "0"; });
    });

    document.getElementById("calcularBtn").onclick = () => {
        const f = document.getElementById("fecha").value;
        const s = parseInt(document.getElementById("s").value) || 0;
        const a = parseInt(document.getElementById("a").value) || 0;
        const d = parseInt(document.getElementById("d").value) || 0;
        const t = parseInt(document.getElementById("t").value) || 0;
        const p = document.getElementById("personas").value || 0;

        if(!f || noches === 0) return alert("Selecciona tus fechas.");
        if(s+a+d+t === 0) return alert("Elige al menos 1 habitación.");

        const total = (s*1500 + a*2500 + d*3000 + t*4000) * noches;
        const adelanto = total * 0.50;

        resumen = { f, noches, h: `S:${s} A:${a} D:${d} T:${t}`, p, total, adelanto };

        document.getElementById("resultado").classList.remove("hidden");
        document.getElementById("resumenContent").innerHTML = `
            <h2 style="margin:5px 0; color:#0f172a; font-weight:800">RD$ ${total.toLocaleString()}</h2>
            <p style="font-size:0.85rem; color:#64748b; margin-bottom:15px">${f} • ${noches} noches</p>
            <div style="background:#fff; border:1px solid #e2e8f0; padding:12px; border-radius:12px">
                <span style="font-size:0.75rem; font-weight:700; color:#16a34a">ADELANTO (50%)</span>
                <h3 style="margin:0; color:#16a34a">RD$ ${adelanto.toLocaleString()}</h3>
            </div>
        `;
        document.getElementById("resultado").scrollIntoView({ behavior: 'smooth' });
    };

    document.getElementById("btnConfirmar").onclick = async () => {
        const b = document.getElementById("btnConfirmar");
        b.disabled = true; b.innerText = "⏳ PROCESANDO...";
        await addDoc(collection(db, "reservas"), { ...resumen, creado: new Date().toLocaleString() });
        
        // Mensaje con la nueva ubicación
        const msg = `🌴 *RESERVA VACACIONAL ARIS*%0A📍 *Lugar:* Villa Altagracia, KM 40 (Chono)%0A📅 *Fechas:* ${resumen.f}%0A🌙 *Noches:* ${resumen.noches}%0A👥 *Personas:* ${resumen.p}%0A💰 *Total:* RD$ ${resumen.total.toLocaleString()}%0A💳 *Adelanto (50%):* RD$ ${resumen.adelanto.toLocaleString()}`;
        window.location.href = `https://wa.me/18092823624?text=${msg}`;
    };

    document.getElementById("adminBtn").onclick = () => document.getElementById("adminPanel").classList.toggle("hidden");
    document.getElementById("closeAdmin").onclick = () => document.getElementById("adminPanel").classList.add("hidden");

    document.getElementById("loginAdmin").onclick = async () => {
        if(document.getElementById("adminCode").value === "1234") {
            document.getElementById("adminLoginArea").classList.add("hidden");
            document.getElementById("adminContent").classList.remove("hidden");
            const q = query(collection(db, "reservas"), orderBy("creado", "desc"));
            const rSnap = await getDocs(q);
            let h = "";
            rSnap.forEach(d => h += `<div style="font-size:0.75rem; border-bottom:1px solid #eee; padding:8px"><b>${d.data().f}</b><br>RD$ ${d.data().total.toLocaleString()}</div>`);
            document.getElementById("reservasLista").innerHTML = h || "No hay reservas.";
        }
    };

    flatpickr("#pickerBloqueo", { dateFormat: "d/m/Y" });
    document.getElementById("btnBloquear").onclick = async () => {
        const val = document.getElementById("pickerBloqueo").value;
        if(val) { await addDoc(collection(db, "bloqueos"), { fecha: val }); location.reload(); }
    };
});
