const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const datasetInfo = document.getElementById('datasetInfo');
const resultBox = document.getElementById('resultBox');
const resultContent = document.getElementById('resultContent');
const errorBox = document.getElementById('errorBox');
const analyzeBtn = document.getElementById('analyzeBtn');
const btnText = document.getElementById('btnText');

let currentChart = null;
let currentChartData = null;

// ===== FILE INPUT =====
fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
        fileName.textContent = '✅ ' + fileInput.files[0].name;
        // Bounce the upload icon
        const icon = document.querySelector('.upload-icon');
        icon.style.transform = 'scale(1.3) rotate(-5deg)';
        setTimeout(() => icon.style.transform = '', 400);
    }
});

function setQuestion(q) {
    document.getElementById('questionInput').value = q;
    // Flash the input
    const input = document.getElementById('questionInput');
    input.style.borderColor = '#764ba2';
    input.focus();
    setTimeout(() => input.style.borderColor = '', 600);
}

// ===== SHOW SKELETON LOADER =====
function showSkeleton() {
    resultBox.style.display = 'block';
    resultBox.style.animation = 'none';
    resultContent.innerHTML = `
        <div class="spinner-wrap">
            <div class="spinner"></div>
            <span class="spinner-text">AI is analyzing your data...</span>
        </div>
        <div class="skeleton-box" style="background:transparent;border:none;padding:10px 0;">
            <div class="skeleton-line" style="width:90%"></div>
            <div class="skeleton-line" style="width:75%"></div>
            <div class="skeleton-line" style="width:85%"></div>
            <div class="skeleton-line" style="width:60%"></div>
            <div class="skeleton-line" style="width:80%"></div>
        </div>
    `;
}

// ===== TYPEWRITER EFFECT =====
function typewriterEffect(element, text, speed = 18) {
    element.textContent = '';
    element.classList.add('typing');
    let i = 0;
    const interval = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(interval);
            element.classList.remove('typing');
        }
    }, speed);
}

// ===== MAIN ANALYZE FUNCTION =====
async function analyze() {
    const file = fileInput.files[0];
    const question = document.getElementById('questionInput').value.trim();

    if (!file) { showError('⚠️ Please upload a CSV, Excel or PDF file first!'); return; }
    if (!question) { showError('⚠️ Please enter a question!'); return; }

    // Reset UI
    analyzeBtn.disabled = true;
    btnText.textContent = 'Analyzing... ⏳';
    errorBox.style.display = 'none';
    document.getElementById('chartBox').style.display = 'none';

    // Show skeleton loader
    showSkeleton();

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('question', question);

        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            showError('❌ ' + data.error);
            resultBox.style.display = 'none';
        } else {
            // Show dataset info with animation
            datasetInfo.style.display = 'block';
            datasetInfo.style.animation = 'fadeSlideUp 0.4s ease both';
            if (data.file_type === 'pdf') {
                document.getElementById('infoText').textContent = '📄 PDF uploaded and analyzed successfully!';
            } else {
                document.getElementById('infoText').textContent =
                    `📊 ${data.rows} rows × ${data.columns} columns | Columns: ${data.column_names.join(', ')}`;
            }

            // Bounce in result box
            resultBox.style.animation = 'bounceIn 0.5s ease both';
            resultContent.style.animation = '';

            // Typewriter effect for answer
            typewriterEffect(resultContent, data.answer, 15);

            resultBox.style.display = 'block';

            // Show chart if available
            if (data.chart && data.chart.type) {
                setTimeout(() => {
                    currentChartData = data.chart;
                    document.getElementById('chartTitle').textContent = '📈 ' + data.chart.title;
                    renderChart(data.chart.type, data.chart.labels, data.chart.values);
                    const chartBox = document.getElementById('chartBox');
                    chartBox.style.display = 'block';
                    chartBox.style.animation = 'bounceIn 0.5s ease both';
                }, 300);
            }
        }

    } catch (err) {
        showError('❌ Something went wrong. Make sure the server is running!');
        resultBox.style.display = 'none';
    } finally {
        analyzeBtn.disabled = false;
        btnText.textContent = 'Analyze 🔍';
    }
}

// ===== RENDER CHART =====
function renderChart(type, labels, values) {
    if (currentChart) currentChart.destroy();

    const ctx = document.getElementById('myChart').getContext('2d');

    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#4facfe',
        '#43e97b', '#fa709a', '#fee140', '#a18cd1',
        '#fda085', '#84fab0'
    ];

    currentChart = new Chart(ctx, {
        type: type,
        data: {
            labels: labels,
            datasets: [{
                label: currentChartData.title,
                data: values,
                backgroundColor: type === 'line'
                    ? 'rgba(102,126,234,0.15)'
                    : colors.slice(0, labels.length),
                borderColor: type === 'line'
                    ? '#667eea'
                    : colors.slice(0, labels.length),
                borderWidth: 2,
                fill: type === 'line',
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointRadius: 5,
                pointHoverRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 800,
                easing: 'easeOutBounce'
            },
            plugins: {
                legend: {
                    display: type === 'pie',
                    position: 'bottom'
                }
            },
            scales: type === 'pie' ? {} : {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' }
                },
                x: { grid: { display: false } }
            }
        }
    });
}

function switchChart(type) {
    if (!currentChartData) return;
    renderChart(type, currentChartData.labels, currentChartData.values);
}

// ===== ERROR =====
function showError(msg) {
    errorBox.style.display = 'block';
    errorBox.style.animation = 'bounceIn 0.4s ease both';
    document.getElementById('errorText').textContent = msg;
}

// ===== COPY RESULT =====
function copyResult() {
    navigator.clipboard.writeText(resultContent.textContent);
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied! ✅';
    setTimeout(() => btn.textContent = 'Copy 📋', 2000);
}

// ===== ENTER KEY =====
document.getElementById('questionInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyze();
});

// ===== DARK MODE =====
function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('themeBtn');
    body.classList.toggle('dark');
    if (body.classList.contains('dark')) {
        btn.textContent = '☀️ Light';
        localStorage.setItem('theme', 'dark');
    } else {
        btn.textContent = '🌙 Dark';
        localStorage.setItem('theme', 'light');
    }
}

window.addEventListener('load', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeBtn').textContent = '☀️ Light';
    }
});