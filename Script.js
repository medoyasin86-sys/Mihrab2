// دالة لتحديث التاريخ الهجري مع مراعاة التعديل اليدوي
async function updateHijriWithOffset() {
    const dateInput = document.getElementById('date-picker').value;
    const offset = parseInt(document.getElementById('hijri-offset').value) || 0;
    const dateObj = dateInput ? parseLocalYMD(dateInput) : new Date();
    
    // إضافة أو نقص الأيام يدوياً
    const adjustedDate = new Date(dateObj);
    adjustedDate.setDate(adjustedDate.getDate() + offset);

    const hijri = await getHijriData(adjustedDate);
    if (hijri) {
        const display = document.getElementById('hijri-display');
        display.innerText = `${hijri.day} ${hijri.month.ar} ${hijri.year} هـ`;
        
        // تحديث تنبيه رمضان بناءً على التعديل اليدوي
        const hint = document.getElementById('ramadan-day-hint');
        if (hijri.month.en === "Ramadan") {
            hint.style.display = 'block';
            hint.innerHTML = `🌙 اليوم هو <b>${hijri.day} رمضان</b> — تقبّل الله منا ومنكم`;
            document.getElementById('decor-container').style.display = 'block';
        } else {
            hint.style.display = 'none';
            document.getElementById('decor-container').style.display = 'none';
        }
    }
}

// تأكد من استدعاء هذه الدالة عند تغيير تاريخ الميلادي أيضاً
document.getElementById('date-picker').addEventListener('change', () => {
    updateHijriWithOffset();
    renderDateDebug();
});
