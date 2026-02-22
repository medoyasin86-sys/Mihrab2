// إعدادات Firebase (ستستبدلها بكودك الخاص)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// الاستماع للتغييرات اللحظية
db.ref('mihrab/status').on('value', (snapshot) => {
    document.getElementById('live-data').innerText = snapshot.val() || "لا يوجد نشاط حالياً";
});

// دالة التحديث اللحظي للجميع
function updateStatus(msg) {
    db.ref('mihrab/status').set(msg);
}
