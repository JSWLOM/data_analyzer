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

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
        fileName.textContent = '✅ ' + fileInput.files[0].name;
    }
});

function setQuestion(q) {
    document.getElementById('questionInput').value = q;
}

async function analyze() {
    const file = fileInput.files[0];
    const question = document.getElementById('questionInput').value.trim();

    if (!file) { showError('⚠️ Please upload a CSV or Excel file first!'); return; }
    if (!question) { showError('⚠️ Please enter a question!'); return; }

    // Reset UI
    analyzeBtn.disabled = true;
    btnText.textContent = 'Analyzing...';
    resultBox.style.display = 'none';
    errorBox.style.display = 'none';
    document.getElementById('chartBox').style.display = 'none';
    resultContent.innerHTML = '<div class="loading">🤖 AI is analyzing your data...</div>';
    resultBox.style.display = 'block';

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
            // Show dataset info
            datasetInfo.style.display = 'block';
            document.getElementById('infoText').textContent =
                `📊 ${data.rows} rows × ${data.columns} columns | Columns: ${data.column_names.join(', ')}`;

            // Show text answer
            resultContent.textContent = data.answer;
            resultBox.style.display = 'block';

            // Show chart if available
            if (data.chart && data.chart.type) {
                currentChartData = data.chart;
                document.getElementById('chartTitle').textContent = '📈 ' + data.chart.title;
                renderChart(data.chart.type, data.chart.labels, data.chart.values);
                document.getElementById('chartBox').style.display = 'block';
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

function renderChart(type, labels, values) {
    // Destroy previous chart if exists
    if (currentChart) {
        currentChart.destroy();
    }

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
                    ? 'rgba(102, 126, 234, 0.2)'
                    : colors.slice(0, labels.length),
                borderColor: type === 'line'
                    ? '#667eea'
                    : colors.slice(0, labels.length),
                borderWidth: 2,
                fill: type === 'line',
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function switchChart(type) {
    if (!currentChartData) return;
    renderChart(type, currentChartData.labels, currentChartData.values);
}

function showError(msg) {
    errorBox.style.display = 'block';
    document.getElementById('errorText').textContent = msg;
}

function copyResult() {
    navigator.clipboard.writeText(resultContent.textContent);
    const btn = document.querySelector('.copy-btn');
    btn.textContent = 'Copied! ✅';
    setTimeout(() => btn.textContent = 'Copy 📋', 2000);
}

document.getElementById('questionInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') analyze();
});

// Dark mode toggle
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

// Remember theme on page reload
window.addEventListener('load', () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark');
        document.getElementById('themeBtn').textContent = '☀️ Light';
    }
});