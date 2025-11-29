let uploadedImage = null;
let selectedDate = null;

// Set today's date as default
document.getElementById('dateInput').valueAsDate = new Date();

// Upload area drag and drop
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');

uploadArea.addEventListener('click', () => imageInput.click());

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageUpload(files[0]);
    }
});

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageUpload(e.target.files[0]);
    }
});

// Handle image upload
function handleImageUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImage = new Image();
        uploadedImage.onload = () => {
            showImagePreview(e.target.result);
            checkFormComplete();
        };
        uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showImagePreview(dataUrl) {
    document.getElementById('previewImg').src = dataUrl;
    document.getElementById('imagePreview').style.display = 'block';
    uploadArea.style.display = 'none';
}

function clearImage() {
    uploadedImage = null;
    imageInput.value = '';
    document.getElementById('imagePreview').style.display = 'none';
    uploadArea.style.display = 'block';
    checkFormComplete();
}

// Update character count
document.getElementById('headlineInput').addEventListener('input', (e) => {
    document.getElementById('charCount').textContent = e.target.value.length;
    checkFormComplete();
});

// Check if form is complete
function checkFormComplete() {
    const hasImage = uploadedImage !== null;
    const hasHeadline = document.getElementById('headlineInput').value.trim().length > 0;
    document.getElementById('generateBtn').disabled = !(hasImage && hasHeadline);
}

// Get date string
function getDateString() {
    const dateInput = document.getElementById('dateInput').value;
    if (dateInput) {
        const date = new Date(dateInput + 'T00:00:00');
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

// Generate template
function generateTemplate() {
    if (!uploadedImage) {
        alert('Please upload an image');
        return;
    }

    const headline = document.getElementById('headlineInput').value.trim();
    if (!headline) {
        alert('Please enter a headline');
        return;
    }

    const canvas = document.getElementById('templateCanvas');
    const ctx = canvas.getContext('2d');

    // Canvas dimensions
    const canvasWidth = 920;
    const canvasHeight = 1000;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background (dark)
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Date box (top)
    const dateBoxHeight = 45;
    ctx.fillStyle = 'rgba(139, 0, 0, 0.85)';
    ctx.fillRect(52, 150, 920, dateBoxHeight);

    // Draw date text
    const dateStr = getDateString();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, 900, 180);

    // Draw image (covers 920x520)
    const imageBoxY = 195;
    const imageBoxHeight = 520;
    ctx.drawImage(uploadedImage, 52, imageBoxY, 920, imageBoxHeight);

    // Draw headline text box (bottom)
    const headlineBoxY = 745;
    drawHeadlineText(ctx, headline, canvasWidth);

    // Show result
    document.getElementById('result').style.display = 'block';
    window.scrollTo(0, document.getElementById('result').offsetTop - 100);
}

// Draw headline with automatic sizing and wrapping
function drawHeadlineText(ctx, headline, canvasWidth) {
    const maxWidth = 860;
    let fontSize = 56;

    if (headline.length > 50) fontSize = 32;
    else if (headline.length > 40) fontSize = 38;
    else if (headline.length > 30) fontSize = 44;
    else if (headline.length > 20) fontSize = 52;

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // Word wrapping
    const words = headline.split(' ');
    let lines = [];
    let currentLine = '';

    for (let word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);

        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    if (currentLine) lines.push(currentLine);

    // Adjust font size if too many lines
    if (lines.length > 4) {
        fontSize = Math.max(24, fontSize - 12);
        ctx.font = `bold ${fontSize}px Arial`;
    } else if (lines.length > 2) {
        fontSize = Math.max(28, fontSize - 6);
        ctx.font = `bold ${fontSize}px Arial`;
    }

    // Draw lines
    const lineHeight = Math.ceil(fontSize * 1.4);
    const totalHeight = lineHeight * lines.length;
    let startY = 745 + fontSize + 20;

    // Recalculate if needed
    if (lines.length > 2) {
        const testMetrics = ctx.measureText(lines[0]);
        if (testMetrics.width > maxWidth) {
            // Re-wrap with smaller font
            fontSize = 40;
            ctx.font = `bold ${fontSize}px Arial`;
            lines = [];
            currentLine = '';
            for (let word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);
        }
    }

    const newLineHeight = Math.ceil(fontSize * 1.4);
    startY = 745 + fontSize + 20;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], canvasWidth / 2, startY + (i * newLineHeight));
    }
}

// Download template
function downloadTemplate() {
    const canvas = document.getElementById('templateCanvas');
    const link = document.createElement('a');
    link.download = 'lk-news-template.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Copy to clipboard
async function copyToClipboard() {
    try {
        const canvas = document.getElementById('templateCanvas');
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                alert('✅ Template copied to clipboard!');
            } catch (err) {
                alert('Could not copy to clipboard');
            }
        });
    } catch (err) {
        alert('Error copying to clipboard');
    }
}
