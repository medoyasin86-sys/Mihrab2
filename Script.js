/* ========= إعدادات Firebase ========= */
const firebaseConfig = { 
    apiKey: "AIzaSyDBa3kZK5ibQEIRRjVIHL7JIOHixX_7rVs", 
    authDomain: "ebada-656e1.firebaseapp.com", 
    databaseURL: "https://ebada-656e1-default-rtdb.firebaseio.com", 
    projectId: "ebada-656e1" 
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ========= الحالة العامة ========= */
let currentUser = null;
const users = ['محمد', 'شيماء', 'أحمد', 'ياسين'];
const APP_TZ = 'Asia/Muscat';
const prayersCache = { slot1: null, slot2: null };

/* ========= أدوات الوقت والتواريخ ========= */
function ymdInTz(d, tz) {
    try {
        const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
        let y='', m='', day='';
        for (const p of parts) { 
            if (p.type==='year') y=p.value; 
            else if (p.type==='month') m=p.value; 
            else if (p.type==='day') day=p.value; 
        }
        return `${y}-${m}-${day}`;
    } catch(e) {
        return d.toISOString().split('T')[0];
    }
}

function todayYMDMuscat() { return ymdInTz(new Date(), APP_TZ); }
function parseLocalYMD(ymd) { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d); }

/* ✅ دالة تحديث التاريخ الهجري مع التعديل اليدوي (طلبك الأساسي) */
async function updateHijriWithOffset() {
    const picker = document.getElementById('date-picker');
    if (!picker.value) picker.value = todayYMDMuscat();
    
    const offset = parseInt(document.getElementById('hijri-offset').value) || 0;
    const baseDate = parseLocalYMD(picker.value);
    
    // تطبيق التعديل اليدوي على التاريخ قبل الإرسال للـ API
    const adjustedDate = new Date(baseDate);
    adjustedDate.setDate(adjustedDate.getDate() + offset);

    try {
        const res = await fetch(`https://api.aladhan.com/v1/gToH/${adjustedDate.getDate()}-${adjustedDate.getMonth()+1}-${adjustedDate.getFullYear()}`);
        const data = await res.json();
        const hj = data.data.hijri;
        
        document.getElementById('hijri-display').innerText = `${hj.day} ${hj.month.ar} ${hj.year} هـ`;
        
        const hint = document.getElementById('ramadan-day-hint');
        const decor = document.getElementById('decor-container');
        
        // إذا كان الشهر رمضان بناءً على التعديل اليدوي
        if (hj.month.en === "Ramadan") {
            hint.style.display = 'block';
            hint.innerHTML = `🌙 اليوم هو <b>${hj.day} رمضان</b> — تقبّل الله منا ومنكم`;
            decor.style.display = 'block';
            showRamadanToastOnce();
        } else {
            hint.style.display = 'none';
            decor.style.display = 'none';
        }
    } catch(e) { 
        document.getElementById('hijri-display').innerText = "خطأ في الاتصال"; 
    }
}

/* ========= منطق مواقيت الصلاة ========= */
function normalizeDigits(str) { 
    return String(str || '').replace(/[٠-٩]/g, d => "0123456789"["٠١٢٣٤٥٦٧٨٩".indexOf(d)]); 
}

function format12h(t) {
    if (!t) return "";
    let [h, m] = normalizeDigits(t).split(':');
    h = parseInt(h);
    const sfx = h >= 12 ? "م" : "ص";
    return `${h % 12 || 12}:${m} ${sfx}`;
}

async function fetchCityPrayers(city, country, rowId, label, slot) {
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=5`);
        const data = await res.json();
        const t = data.data.timings;
        prayersCache[slot] = { label, timings: t, tz: data.data.meta.timezone };
        document.getElementById(rowId).innerHTML = `
            <td>${label}</td>
            <td>${format12h(t.Fajr)}</td>
            <td>${format12h(t.Dhuhr)}</td>
            <td>${format12h(t.Asr)}</td>
            <td>${format12h(t.Maghrib)}</td>
            <td>${format12h(t.Isha)}</td>`;
    } catch(e) { 
        document.getElementById(rowId).innerHTML = `<td>${label}</td><td colspan="5">خطأ في التحميل</td>`; 
    }
}

/* ========= التفاعل والواجهة ========= */
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }

function showRamadanToastOnce() {
    const key = 'ramadanToast_2026';
    if (localStorage.getItem(key)) return;
    const toast = document.getElementById('toast-ramadan');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 5000);
    localStorage.setItem(key, 'true');
}

/* ✅ تهيئة التطبيق عند التشغيل */
window.onload = async () => {
    // تحديد التاريخ الحالي
    const today = todayYMDMuscat();
    document.getElementById('date-picker').value = today;
    
    // تفعيل المستمعات
    document.getElementById('date-picker').addEventListener('change', updateHijriWithOffset);
    
    // تعبئة خيارات المدن
    const citySelect1 = document.getElementById('city-select-1');
    const citySelect2 = document.getElementById('city-select-2');
    const cityOptions = [
        {k:'Salalah|Oman', n:'صلالة', c:'Oman', a:'Salalah'},
        {k:'Muscat|Oman', n:'مسقط', c:'Oman', a:'Muscat'},
        {k:'Kafr El Sheikh|Egypt', n:'كفر الشيخ', c:'Egypt', a:'Kafr El Sheikh'},
        {k:'Cairo|Egypt', n:'القاهرة', c:'Egypt', a:'Cairo'}
    ];
    
    const optionsHtml = cityOptions.map(c => `<option value="${c.k}">${c.n}</option>`).join('');
    citySelect1.innerHTML = optionsHtml;
    citySelect2.innerHTML = optionsHtml;
    
    citySelect1.value = 'Salalah|Oman';
    citySelect2.value = 'Kafr El Sheikh|Egypt';

    // التشغيل الأولي
    await updateHijriWithOffset();
    await fetchCityPrayers('Salalah', 'Oman', 'row-salalah', 'صلالة', 'slot1');
    await fetchCityPrayers('Kafr El Sheikh', 'Egypt', 'row-kafr', 'كفر الشيخ', 'slot2');

    // تفعيل التحديث عند تغيير المدينة
    citySelect1.onchange = (e) => {
        const [a, c] = e.target.value.split('|');
        const label = e.target.options[e.target.selectedIndex].text;
        fetchCityPrayers(a, c, 'row-salalah', label, 'slot1');
    };
    citySelect2.onchange = (e) => {
        const [a, c] = e.target.value.split('|');
        const label = e.target.options[e.target.selectedIndex].text;
        fetchCityPrayers(a, c, 'row-kafr', label, 'slot2');
    };
};

// وظيفة زر التحديث
document.getElementById('btn-refresh').onclick = () => location.reload();
