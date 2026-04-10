import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// 1. INICIALIZAR CALENDARIO DE UNA VEZ
const fp = flatpickr("#fecha", {
    locale: "es",
    mode: "range",
    minDate: "today",
    dateFormat: "d/m/Y",
    onClose: function(selectedDates) {
        if (selectedDates.length === 2) {
            const diff = selectedDates[1] - selectedDates[0];
            nochesGlobal = Math.ceil(diff / (1000 * 60 * 60 * 24));
        }
    }
});

// 2. QUITAR EL 0 AL TOCAR
const inputs = document.querySelectorAll('.qty-input');
inputs.forEach(input => {
    input.addEventListener('focus', function() { if(this.value === "0") this.value = ""; });
    input.addEventListener('blur', function() { if(this.value === "") this.value = "0"; });
});

// 3. BOTÓN CALCULAR
document.getElementById("calcularBtn").onclick = () => {
    const f = document.getElementById("fecha").value;
    const s = parseInt(document.getElementById("s").value) || 0;
    const a = parseInt(document.getElementById("a").value) || 0;
    const d = parseInt(document.getElementById("d").value) || 0;
    const t = parseInt(document.getElementById("t").value) || 0;

    if (!f || nochesGlobal === 0) return alert("Selecciona fechas en el calendario");
    if (s+a+d+t === 0) return alert("Elige al menos 1 habitación");

    const total = (s*1500 + a*2500 + d*3000 + t*4000) * nochesGlobal;
    const adelanto = total * 0.50;

    document.getElementById("resultado").classList.remove("hidden");
    document.getElementById("resumenContent").innerHTML = `
        <h2 style="margin:0;">RD$ ${total.toLocaleString()}</h2>
        <p style="color:#64748b;">${f} (${nochesGlobal} noches)</p>
        <div style="background:#f0fdf4; padding:15px; border-radius:12px; margin-top:10px; border:1px solid #bcf0da">
            <span style="color:#16a34a; font-weight:800;">RESERVA CON:</span>
            <h3 style="margin:0; color:#16a34a;">RD$ ${adelanto.toLocaleString()}</h3>
        </div>
    `;

    document.getElementById("btnConfirmar").onclick = async () => {
        const btn = document.getElementById("btnConfirmar");
        btn.disabled = true;
        btn.innerText = "⏳ ENVIANDO...";
        
        await addDoc(collection(db, "reservas"), {
            fecha: f,
            total: total,
            creado: new Date().toLocaleString()
        });

        const msg = `🌴 *RESERVA ARIS*%0A📅 *Fechas:* ${f}%0A🌙 *Noches:* ${nochesGlobal}%0A💰 *Total:* RD$ ${total.toLocaleString()}%0A💳 *Adelanto:* RD$ ${adelanto.toLocaleString()}`;
        window.location.href = `https://wa.me/18092823624?text=${msg}`;
    };
};
