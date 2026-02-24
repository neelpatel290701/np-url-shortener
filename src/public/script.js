const form = document.getElementById('shortenForm');
const resultDiv = document.getElementById('result');
const submitBtn = document.getElementById('submitBtn');
const originalBtnText = submitBtn.innerHTML;

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const longUrl = document.getElementById('longUrl').value;

    // UI Loading State
    submitBtn.innerHTML = '<span class="spinner"></span> Processing...';
    submitBtn.disabled = true;
    resultDiv.classList.remove('visible');

    try {
        const response = await fetch('/api/urls/shorten', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ longUrl })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess(data);
        } else {
            showError(data.error || 'Something went wrong');
        }
    } catch (err) {
        showError('Network error. Please try again.');
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});

function showSuccess(data) {
    resultDiv.innerHTML = `
        <div class="success-box">
            <a href="${data.shortUrl}" target="_blank" class="short-url">${data.shortUrl}</a>
            <button class="copy-btn" id="copyBtn">COPY</button>
        </div>
    `;
    resultDiv.classList.add('visible');

    document.getElementById('copyBtn').addEventListener('click', function () {
        copyToClipboard(data.shortUrl, this);
    });
}

function showError(message) {
    resultDiv.innerHTML = `<div class="error-msg">${message}</div>`;
    resultDiv.classList.add('visible');
}

window.copyToClipboard = async (text, btn) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "absolute";
            textArea.style.left = "-9999px";
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }

        const originalText = btn.innerText;
        btn.innerText = 'COPIED!';
        btn.style.borderColor = '#fff';
        btn.style.color = '#fff';

        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.borderColor = '';
            btn.style.color = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy', err);
        btn.innerText = 'ERROR';
        btn.style.borderColor = 'red';
        setTimeout(() => {
            btn.innerText = 'COPY';
            btn.style.borderColor = '';
        }, 2000);
    }
};
