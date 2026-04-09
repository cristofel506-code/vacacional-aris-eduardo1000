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
let rData = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. CARGAR BLOQUEOS
    let bloqueos = [];
    const snap = await getDocs(collection(db, "bloqueos"));
    snap.forEach(d => bloqueos.push(d.data().fecha));

    // 2. CONFIG CALENDARIO
    const fp = flatpickr("#fecha", {
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: bloqueos,
        locale: { rangeSeparator: '  →  ' },
        onClose: (sel) => {
            if(sel.length === 2) noches = Math.round((sel[1]-sel[0])/86400000);
        }
    });

    // 3. CÁLCULO
    document.getElementById("calcularBtn").onclick = () => {
        const f = document.getElementById("fecha").value;
        const s = parseInt(document.getElementById("s").value) || 0;
        const a = parseInt(document.getElementById("a").value) || 0;
        const d = parseInt(document.getElementById("d").value) || 0;
        const t = parseInt(document.getElementById("t").value) || 0;
        const p = document.getElementById("personas").value;

        if(!f || noches === 0) return alert("Selecciona tus fechas de viaje.");
        if(s+a+d+t === 0) return alert("Selecciona al menos una habitación.");

        const total = (s*1500 + a*2500 + d*3000 + t*4000) * noches;
        const adelanto = total * 0.5;

        rData = { f, noches, habits: `S:${s} A:${a} D:${d} T:${t}`, p, total, adelanto };

        document.getElementById("resultado").classList.remove("hidden");
        document.getElementById("resumenContent").innerHTML = `
            <h2 style="margin:10px 0; color:#0f172a">RD$ ${total.toLocaleString()}</h2>
            <p style="font-size:0.8rem; color:#64748b">RESERVA: <b>RD$ ${adelanto.toLocaleString()}</b> (50%)</p>
            <p style="font-size:0.9rem; margin-top:10px">📅 ${f} • 🌙 ${noches} noches</p>
        `;
    };

    // 4. WHATSAPP (Ajustado para celular)
    document.getElementById("btnConfirmar").onclick = async () => {
        const btn = document.getElementById("btnConfirmar");
        btn.disabled = true; btn.innerText = "⏳ GUARDANDO...";

        await addDoc(collection(db, "reservas"), { ...rData, creado: new Date().toLocaleString() });

        const msg = `🌴 *VACACIONAL ARIS EDUARDO*%0A📅 *Estadía:* ${rData.f}%0A🌙 *Noches:* ${rData.noches}%0A👥 *Personas:* ${rData.p}%0A💰 *Total:* RD$ ${rData.total.toLocaleString()}%0A💳 *Adelanto:* RD$ ${rData.adelanto.toLocaleString()}`;
        
        window.location.href = `https://wa.me/18092823624?text=${msg}`;
    };

    // 5. ADMIN
    const adminBtn = document.getElementById("adminBtn");
    const adminPanel = document.getElementById("adminPanel");
    adminBtn.onclick = () => adminPanel.classList.toggle("hidden");
    document.getElementById("closeAdmin").onclick = () => adminPanel.classList.add("hidden");

    document.getElementById("loginAdmin").onclick = async () => {
        if(document.getElementById("adminCode").value === "1234") { // <--- CAMBIA TU CLAVE AQUÍ
            document.getElementById("adminLoginArea").classList.add("hidden");
            document.getElementById("adminContent").classList.remove("hidden");
            
            // Ver Reservas
            const q = query(collection(db, "reservas"), orderBy("creado", "desc"));
            const rSnap = await getDocs(q);
            let h = "";
            rSnap.forEach(d => {
                const r = d.data();
                h += `<div style="padding:10px; border-bottom:1px solid #eee; font-size:0.8rem">
                        <b>${r.f}</b> - RD$ ${r.total.toLocaleString()}
                      </div>`;
            });
            document.getElementById("reservasLista").innerHTML = h || "No hay reservas.";
        }
    };

    // Bloquear Fecha
    const fAdmin = flatpickr("#pickerBloqueo", { dateFormat: "d/m/Y" });
    document.getElementById("btnBloquear").onclick = async () => {
        const val = document.getElementById("pickerBloqueo").value;
        if(val) {
            await addDoc(collection(db, "bloqueos"), { fecha: val });
            alert("¡Fecha Bloqueada!");
            location.reload();
        }
    };
});
