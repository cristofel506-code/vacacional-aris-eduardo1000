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
let resumenGlobal = null;

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. CARGAR BLOQUEOS
    const bloqueos = [];
    const snap = await getDocs(collection(db, "bloqueos"));
    snap.forEach(d => bloqueos.push(d.data().fecha));

    // 2. CALENDARIO
    flatpickr("#fecha", {
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: bloqueos,
        locale: { rangeSeparator: ' → ' },
        onClose: (sel) => {
            if(sel.length === 2) noches = Math.round((sel[1]-sel[0])/86400000);
        }
    });

    // 3. CALCULAR
    document.getElementById("calcularBtn").onclick = () => {
        const f = document.getElementById("fecha").value;
        const s = parseInt(document.getElementById("s").value) || 0;
        const a = parseInt(document.getElementById("a").value) || 0;
        const d = parseInt(document.getElementById("d").value) || 0;
        const t = parseInt(document.getElementById("t").value) || 0;
        const p = document.getElementById("personas").value || 0;

        if(!f || noches === 0) return alert("Elige tus fechas.");
        if(s+a+d+t === 0) return alert("Elige al menos una habitación.");

        const total = (s*1500 + a*2500 + d*3000 + t*4000) * noches;
        const adelanto = total * 0.5;

        resumenGlobal = { f, noches, h: `S:${s} A:${a} D:${d} T:${t}`, p, total, adelanto };

        document.getElementById("resultado").classList.remove("hidden");
        document.getElementById("resumenContent").innerHTML = `
            <h2 style="margin:5px 0">RD$ ${total.toLocaleString()}</h2>
            <p style="font-size:0.8rem">Adelanto: <b>RD$ ${adelanto.toLocaleString()}</b></p>
            <p style="font-size:0.8rem; color:#64748b">${f} (${noches} noches)</p>
        `;
    };

    // 4. CONFIRMAR (Redirección directa para móvil)
    document.getElementById("btnConfirmar").onclick = async () => {
        const btn = document.getElementById("btnConfirmar");
        btn.disabled = true; btn.innerText = "GUARDANDO...";

        await addDoc(collection(db, "reservas"), { ...resumenGlobal, creado: new Date().toLocaleString() });

        const texto = `🌴 *RESERVA ARIS*%0A📅 *Fechas:* ${resumenGlobal.f}%0A🌙 *Noches:* ${resumenGlobal.noches}%0A👥 *Personas:* ${resumenGlobal.p}%0A💰 *Total:* RD$ ${resumenGlobal.total.toLocaleString()}%0A💳 *Adelanto:* RD$ ${resumenGlobal.adelanto.toLocaleString()}`;
        
        window.location.href = `https://wa.me/18092823624?text=${texto}`;
    };

    // 5. ADMIN
    document.getElementById("adminBtn").onclick = () => document.getElementById("adminPanel").classList.toggle("hidden");
    document.getElementById("closeAdmin").onclick = () => document.getElementById("adminPanel").classList.add("hidden");

    document.getElementById("loginAdmin").onclick = async () => {
        if(document.getElementById("adminCode").value === "1234") {
            document.getElementById("adminLoginArea").classList.add("hidden");
            document.getElementById("adminContent").classList.remove("hidden");
            const rSnap = await getDocs(query(collection(db, "reservas"), orderBy("creado", "desc")));
            let h = "";
            rSnap.forEach(d => h += `<div style="font-size:0.7rem; border-bottom:1px solid #eee; padding:5px"><b>${d.data().f}</b> - RD$ ${d.data().total.toLocaleString()}</div>`);
            document.getElementById("reservasLista").innerHTML = h || "No hay reservas.";
        }
    };

    flatpickr("#pickerBloqueo", { dateFormat: "d/m/Y" });
    document.getElementById("btnBloquear").onclick = async () => {
        const v = document.getElementById("pickerBloqueo").value;
        if(v) { await addDoc(collection(db, "bloqueos"), { fecha: v }); location.reload(); }
    };
});
