const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

let currentDate = new Date();

// Load data dan konversi format lama (jika ada) ke format array multi-agenda
let rawEvents = JSON.parse(localStorage.getItem('calendar_events')) || {};
let events = {};

// Migrasi data jika struktur lama masih berupa Objek bukan Array
Object.keys(rawEvents).forEach(key => {
    if (Array.isArray(rawEvents[key])) {
        events[key] = rawEvents[key];
    } else if (typeof rawEvents[key] === 'object' && rawEvents[key] !== null) {
        events[key] = [rawEvents[key]]; // Ubah objek tunggal ke array
    }
});

// Element references
const selectMonth = document.getElementById('select-month');
const selectYear = document.getElementById('select-year');
const filterCategory = document.getElementById('filter-category');
const calendarGrid = document.getElementById('calendar-grid');
const agendaModal = document.getElementById('agenda-modal');

const modalTitle = document.getElementById('modal-title');
const selectedDateKey = document.getElementById('selected-date-key');
const agendaText = document.getElementById('agenda-text');
const agendaCategory = document.getElementById('agenda-category');
const agendaList = document.getElementById('agenda-list');

// Inisialisasi Pilihan Bulan dan Tahun
function initSelectors() {
    months.forEach((m, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = m;
        selectMonth.appendChild(opt);
    });

    updateSelectorValues();
}

function updateSelectorValues() {
    selectMonth.value = currentDate.getMonth();
    selectYear.value = currentDate.getFullYear();
}

function renderCalendar() {
    calendarGrid.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const activeFilter = filterCategory.value;

    // Render cell kosong sebelum tanggal 1
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty');
        calendarGrid.appendChild(emptyCell);
    }

    // Render hari
    const today = new Date();
    for (let day = 1; day <= totalDays; day++) {
        const cell = document.createElement('div');
        cell.classList.add('day-cell');

        const monthStr = String(month + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateKey = `${year}-${monthStr}-${dayStr}`;

        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            cell.classList.add('today');
        }

        const dayNum = document.createElement('div');
        dayNum.classList.add('day-number');
        dayNum.textContent = day;
        cell.appendChild(dayNum);

        // Render multi-agenda
        if (events[dateKey] && events[dateKey].length > 0) {
            events[dateKey].forEach(ev => {
                if (activeFilter === 'semua' || ev.category === activeFilter) {
                    const badge = document.createElement('div');
                    badge.classList.add('agenda-item', `cat-${ev.category}`);
                    badge.textContent = ev.text;
                    cell.appendChild(badge);
                }
            });
        }

        cell.onclick = () => openModal(dateKey);

        calendarGrid.appendChild(cell);
    }
}

function changeMonthYear() {
    const m = parseInt(selectMonth.value);
    const y = parseInt(selectYear.value);
    currentDate = new Date(y, m, 1);
    renderCalendar();
}

function prevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateSelectorValues();
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateSelectorValues();
    renderCalendar();
}

// Modal Functions
function openModal(dateKey) {
    selectedDateKey.value = dateKey;
    const formattedDate = dateKey.split('-').reverse().join('-');
    
    modalTitle.textContent = `Agenda Tanggal: ${formattedDate}`;
    agendaText.value = '';
    agendaCategory.value = 'kerja';

    renderModalAgendaList(dateKey);
    agendaModal.style.display = 'flex';
}

function renderModalAgendaList(dateKey) {
    agendaList.innerHTML = '';
    
    const dayEvents = events[dateKey] || [];

    if (dayEvents.length === 0) {
        agendaList.innerHTML = '<li class="empty-list">Belum ada agenda</li>';
        return;
    }

    dayEvents.forEach((ev, index) => {
        const li = document.createElement('li');
        li.classList.add('agenda-list-item');

        const infoSpan = document.createElement('span');
        infoSpan.classList.add(`badge-cat`, `cat-${ev.category}`);
        infoSpan.textContent = ev.text;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '✕';
        deleteBtn.classList.add('btn-delete-item');
        deleteBtn.onclick = () => deleteAgendaItem(dateKey, index);

        li.appendChild(infoSpan);
        li.appendChild(deleteBtn);
        agendaList.appendChild(li);
    });
}

function closeModal() {
    agendaModal.style.display = 'none';
}

function addAgenda() {
    const dateKey = selectedDateKey.value;
    const text = agendaText.value.trim();
    const category = agendaCategory.value;

    if (text === '') {
        alert('Judul agenda tidak boleh kosong!');
        return;
    }

    if (!events[dateKey]) {
        events[dateKey] = [];
    }

    events[dateKey].push({ text, category });
    localStorage.setItem('calendar_events', JSON.stringify(events));

    agendaText.value = ''; // Reset input text
    renderModalAgendaList(dateKey);
    renderCalendar();
}

function deleteAgendaItem(dateKey, index) {
    if (events[dateKey]) {
        events[dateKey].splice(index, 1);

        // Jika tidak ada agenda tersisa di tanggal tersebut, hapus key-nya
        if (events[dateKey].length === 0) {
            delete events[dateKey];
        }

        localStorage.setItem('calendar_events', JSON.stringify(events));
        renderModalAgendaList(dateKey);
        renderCalendar();
    }
}

// Event Listeners
document.getElementById('btn-prev').addEventListener('click', prevMonth);
document.getElementById('btn-next').addEventListener('click', nextMonth);
selectMonth.addEventListener('change', changeMonthYear);
selectYear.addEventListener('change', changeMonthYear);
filterCategory.addEventListener('change', renderCalendar);

document.getElementById('btn-save').addEventListener('click', addAgenda);
document.getElementById('btn-close').addEventListener('click', closeModal);

// Init
initSelectors();
renderCalendar();