import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// INICIALIZACIÓN FORZADA DEL CALENDARIO
document.addEventListener("DOMContentLoaded", async () => {
    
    const bloqueos = [];
    try {
        const querySnapshot = await getDocs(collection(db, "bloqueos"));
        querySnapshot.forEach((doc) => bloqueos.push(doc.data().fecha));
    } catch (e) { console.log("Sin bloqueos"); }

    const fp = flatpickr("#fecha", {
        locale: "es",
        mode: "range",
        minDate: "today",
        dateFormat: "d/m/Y",
        disable: bloqueos,
        clickOpens: true,
        allowInput: false,
        onClose: function(selectedDates) {
            if (selectedDates.length === 2) {
                const inicio = selectedDates[0];
                const fin = selectedDates[1];
                const diffTime = Math.abs(fin - inicio);
                nochesGlobal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
        }
    });

    // Si el input falla, esto obliga al calendario a abrirse al tocar el recuadro
    document.getElementById("trigger-fecha").onclick = () => {
        fp.open();
    };

    // Lógica para quitar el 0
    const inputsHab = document.querySelectorAll('.qty-input');
    inputsHab.forEach(input => {
        input.onclick = function() { if(this.value == "0") this.value = ""; };
        input.onblur = function() { if(this.value == "") this.value = "0"; };
    });

    // Botón Calcular
    document.getElementById("calcularBtn").onclick = () => {
        const f = document.getElementById("fecha").value;
        const s = parseInt(document.getElementById("s").value) || 0;
        const a = parseInt(document.getElementById("a").value) || 0;
        const d = parseInt(document.getElementById("d").value) || 0;
        const t = parseInt(document.getElementById("t").value) || 0;
        const p = document.getElementById("personas").value || 0;

        if(!f || nochesGlobal === 0) return alert("Selecciona entrada y salida");
        if(s+a+d+t === 0) return alert("Elige habitación");

        const total = (s*1500 + a*2500 + d*3000 + t*4000) * nochesGlobal;
        const adelanto = total * 0.5;

        const ticket = document.getElementById("resultado");
        ticket.classList.remove("hidden");
        document.getElementById("resumenContent").innerHTML = `
            <h2 style="margin:0; font-size:1.8rem;">RD$ ${total.toLocaleString()}</h2>
            <p style="color:#64748b; margin-bottom:15px;">${f} (${nochesGlobal} noches)</p>
            <div style="background:#f0fdf4; padding:15px; border-radius:12px; border:1px solid #bcf0da">
                <span style="color:#16a34a; font-weight:800; font-size:0.8rem;">PAGO DE RESERVA (50%)</span>
                <h3 style="margin:0; color:#16a34a;">RD$ ${adelanto.toLocaleString()}</h3>
            </div>
        `;
        ticket.scrollIntoView({ behavior: 'smooth' });

        // Confirmar WhatsApp
        document.getElementById("btnConfirmar").onclick = async () => {
            const btn = document.getElementById("btnConfirmar");
            btn.innerText = "⏳ ESPERE...";
            btn.disabled = true;

            await addDoc(collection(db, "reservas"), {
                fecha: f,
                noches: nochesGlobal,
                total: total,
                adelanto: adelanto,
                creado: new Date().toLocaleString()
            });

            const msg = `🌴 *RESERVA ARIS*%0A📍 Villa Altagracia, KM 40%0A📅 *Fechas:* ${f}%0A🌙 *Noches:* ${nochesGlobal}%0A👥 *Personas:* ${p}%0A💰 *Total:* RD$ ${total.toLocaleString()}%0A💳 *Adelanto (50%):* RD$ ${adelanto.toLocaleString()}`;
            window.location.href = `https://wa.me/18092823624?text=${msg}`;
        };
    };
});
