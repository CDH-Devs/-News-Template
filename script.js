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

// GitHub raw content URL for template.png
const GITHUB_TEMPLATE_URL = 'https://raw.githubusercontent.com/CDH-Devs/-News-Template/main/template.png';

// Generate template using Canvas composition (same as bot)
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

    // Load template from GitHub
    fetch(GITHUB_TEMPLATE_URL)
        .then(response => response.blob())
        .then(blob => {
            const templateImg = new Image();
            templateImg.crossOrigin = 'anonymous';
            
            templateImg.onload = function() {
                composeTemplate(templateImg, headline);
            };
            
            templateImg.onerror = function() {
                console.error('Failed to load template from GitHub');
                composeTemplateFallback(headline);
            };
            
            templateImg.src = URL.createObjectURL(blob);
        })
        .catch(error => {
            console.error('Failed to fetch template:', error);
            composeTemplateFallback(headline);
        });
}

// Compose template on canvas (Date and Image are in original positions)
function composeTemplate(templateImg, headline) {
    const canvas = document.getElementById('templateCanvas');
    const ctx = canvas.getContext('2d');

    // Canvas dimensions - Instagram post size (portrait)
    const canvasWidth = 1080;
    const canvasHeight = 1350;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Draw template background (scale to fit)
    ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);

    // Draw date box with white background (Original Y-position: 170)
    const dateStr = getDateString();
    ctx.fillStyle = 'white';
    ctx.fillRect(65, 170, 265, 72); 
    
    // Draw date text (right-aligned in box, Original Y-position: 215)
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, 315, 215);

    // Draw user image in image box with cover mode (Original Y-position: 280)
    const imageBoxX = 65;
    const imageBoxY = 280; // Reverted to original 280
    const imageBoxWidth = 1000;
    const imageBoxHeight = 626;
    
    // Calculate cover scaling (same as bot)
    const imgAspect = uploadedImage.width / uploadedImage.height;
    const boxAspect = imageBoxWidth / imageBoxHeight;
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > boxAspect) {
        // Image is wider than box - fit height, center horizontally
        drawHeight = imageBoxHeight;
        drawWidth = drawHeight * imgAspect;
        drawY = imageBoxY;
        drawX = imageBoxX - (drawWidth - imageBoxWidth) / 2;
    } else {
        // Image is taller than box - fit width, center vertically
        drawWidth = imageBoxWidth;
        drawHeight = drawWidth / imgAspect;
        drawX = imageBoxX;
        drawY = imageBoxY - (drawHeight - imageBoxHeight) / 2;
    }
    
    // Clip to image box and draw
    ctx.save();
    ctx.beginPath();
    ctx.rect(imageBoxX, imageBoxY, imageBoxWidth, imageBoxHeight);
    ctx.clip();
    ctx.drawImage(uploadedImage, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    // Draw headline text at bottom (will draw on template's red footer)
    drawHeadlineText(ctx, headline, canvasWidth);

    // Show result
    document.getElementById('result').style.display = 'block';
    window.scrollTo(0, document.getElementById('result').offsetTop - 100);
}

// Fallback if GitHub fetch fails (Date and Image are in original positions)
function composeTemplateFallback(headline) {
    const canvas = document.getElementById('templateCanvas');
    const ctx = canvas.getContext('2d');

    const canvasWidth = 1080;
    const canvasHeight = 1350;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Red background (CDH NEWS branding)
    ctx.fillStyle = '#8b0000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Blue background for news area
    ctx.fillStyle = '#003d7a';
    ctx.fillRect(0, 0, canvasWidth, 230);

    // Date box (Original Y-position: 170)
    ctx.fillStyle = 'white';
    ctx.fillRect(65, 170, 265, 72);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 38px Arial';
    ctx.textAlign = 'right';
    const dateStr = getDateString();
    ctx.fillText(dateStr, 315, 215);

    // Draw image with cover mode (Original Y-position: 280)
    const imageBoxX = 65;
    const imageBoxY = 280; // Reverted to original 280
    const imageBoxWidth = 1000;
    const imageBoxHeight = 626;
    
    const imgAspect = uploadedImage.width / uploadedImage.height;
    const boxAspect = imageBoxWidth / imageBoxHeight;
    let drawWidth, drawHeight, drawX, drawY;
    
    if (imgAspect > boxAspect) {
        drawHeight = imageBoxHeight;
        drawWidth = drawHeight * imgAspect;
        drawY = imageBoxY;
        drawX = imageBoxX - (drawWidth - imageBoxWidth) / 2;
    } else {
        drawWidth = imageBoxWidth;
        drawHeight = drawWidth / imgAspect;
        drawX = imageBoxX;
        drawY = imageBoxY - (drawHeight - imageBoxHeight) / 2;
    }
    
    ctx.save();
    ctx.beginPath();
    ctx.rect(imageBoxX, imageBoxY, imageBoxWidth, imageBoxHeight);
    ctx.clip();
    ctx.drawImage(uploadedImage, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    // Draw headline
    drawHeadlineText(ctx, headline, canvasWidth);

    // Show result
    document.getElementById('result').style.display = 'block';
    window.scrollTo(0, document.getElementById('result').offsetTop - 100);
}

// Draw headline with automatic sizing and wrapping
function drawHeadlineText(ctx, headline, canvasWidth) {
    const maxWidth = 1020;
    let fontSize = 68;

    if (headline.length > 50) fontSize = 38;
    else if (headline.length > 40) fontSize = 46;
    else if (headline.length > 30) fontSize = 53;
    else if (headline.length > 20) fontSize = 62;

    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.letterSpacing = '0px';

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
        fontSize = Math.max(30, fontSize - 15);
        ctx.font = `bold ${fontSize}px Arial`;
    } else if (lines.length > 2) {
        fontSize = Math.max(35, fontSize - 8);
        ctx.font = `bold ${fontSize}px Arial`;
    }

    const newLineHeight = Math.ceil(fontSize * 1.4);
    
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

    // Headline Y-position set far down (1050)
    let startY = 1050 + fontSize + 20;

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
