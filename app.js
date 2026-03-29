import { db, collection } from './firebase-config.js';
import { 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    deleteDoc, 
    doc, 
    getDocs, 
    writeBatch, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const colRef = collection(db, "transaksi");

// Element Selector
const form = document.getElementById('transaction-form');
const historyList = document.getElementById('history-list');
const incomeDisplay = document.getElementById('total-income');
const expenseDisplay = document.getElementById('total-expense');
const balanceDisplay = document.getElementById('total-balance');
const amountInput = document.getElementById('amount');
const clearBtn = document.getElementById('clear-btn');
const emptyState = document.getElementById('empty-state');

let myChart;

// --- 1. FUNGSI FORMATTING ---

// Format ribuan otomatis SAAT MENGETIK (50000 -> 50.000)
amountInput.addEventListener('keyup', function() {
    let value = this.value.replace(/[^0-9]/g, ''); 
    this.value = value ? new Intl.NumberFormat('id-ID').format(value) : '';
});

// Fungsi pembuat format Rupiah (50000 -> Rp 50.000)
const formatIDR = (num) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency', 
        currency: 'IDR', 
        maximumFractionDigits: 0
    }).format(num);
};

// --- 2. FUNGSI GRAFIK ---

function updateChart(totalIn, totalOut) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myChart) { myChart.destroy(); }
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Masuk', 'Keluar'],
            datasets: [{
                data: [totalIn, totalOut],
                backgroundColor: ['#10b981', '#f43f5e'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } 
            },
            cutout: '70%'
        }
    });
}

// --- 3. REAL-TIME DATABASE LISTENER ---

const q = query(colRef, orderBy('createdAt', 'desc'));

onSnapshot(q, (snapshot) => {
    historyList.innerHTML = '';
    let totalIn = 0;
    let totalOut = 0;

    if (snapshot.empty) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
        
        snapshot.docs.forEach((docSnap) => {
            const t = docSnap.data();
            const id = docSnap.id;
            const isInc = t.type === 'pemasukan';
            
            // Hitung Total
            isInc ? totalIn += t.amount : totalOut += t.amount;

            // Render List dengan Format Ribuan (formatIDR)
            const li = document.createElement('li');
            li.className = 'p-6 flex justify-between items-center hover:bg-slate-50 transition-all item-anim';
            li.innerHTML = `
                <div class="flex items-center gap-5">
                    <div class="w-10 h-10 rounded-xl ${isInc ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} flex items-center justify-center">
                        <i class="fas ${isInc ? 'fa-arrow-up' : 'fa-arrow-down'}"></i>
                    </div>
                    <div>
                        <p class="font-bold text-slate-800 text-sm">${t.name}</p>
                        <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">${t.dateString}</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="font-extrabold text-sm ${isInc ? 'text-emerald-600' : 'text-slate-800'}">
                        ${isInc ? '+' : '-'}${formatIDR(t.amount)}
                    </span>
                    <button onclick="deleteData('${id}')" class="text-slate-300 hover:text-rose-500 p-2 transition-all active:scale-125">
                        <i class="fas fa-trash-can"></i>
                    </button>
                </div>
            `;
            historyList.appendChild(li);
        });
    }

    // Update Angka di Card Atas (dengan format ribuan)
    incomeDisplay.innerText = formatIDR(totalIn);
    expenseDisplay.innerText = formatIDR(totalOut);
    balanceDisplay.innerText = formatIDR(totalIn - totalOut);
    
    // Update Grafik
    updateChart(totalIn, totalOut);
});

// --- 4. TAMBAH DATA ---

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Ambil nilai dari input, hapus titik (.) agar tersimpan sebagai angka murni
    const rawAmount = amountInput.value.replace(/\./g, ''); 
    const amountValue = parseFloat(rawAmount);

    if (!amountValue) return alert("Isi nominal dulu!");

    try {
        await addDoc(colRef, {
            name: document.getElementById('name').value,
            amount: amountValue,
            type: document.getElementById('type').value,
            createdAt: serverTimestamp(),
            dateString: new Date().toLocaleDateString('id-ID', { 
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
            })
        });
        form.reset();
    } catch (err) {
        alert("Gagal simpan: " + err.message);
    }
});

// --- 5. HAPUS DATA & RESET ---

window.deleteData = async (id) => {
    if(confirm('Hapus data ini?')) {
        await deleteDoc(doc(db, "transaksi", id));
    }
};

clearBtn.addEventListener('click', async () => {
    if (confirm('Hapus seluruh riwayat transaksi di Cloud?')) {
        const querySnapshot = await getDocs(colRef);
        const batch = writeBatch(db);
        querySnapshot.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
    }
});

// --- 6. INISIALISASI TANGGAL ---

document.getElementById('current-date').innerText = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
});