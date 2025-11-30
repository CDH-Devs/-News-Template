const POSTIMG_API_ENDPOINT = 'https://postimages.org/json/rr';
const POSTIMG_TOKEN_URL = 'https://postimages.org/';

// Auto-fill headline from URL parameter on page load
window.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const headlineParam = params.get('text');
    
    if (headlineParam) {
        try {
            const decodedHeadline = decodeURIComponent(headlineParam);
            const headlineInput = document.getElementById('headlineInput');
            
            if (headlineInput) {
                headlineInput.value = decodedHeadline;
                document.getElementById('charCount').textContent = decodedHeadline.length;
                
                // Trigger the template generation
                generateTemplate();
                
                console.log('✅ Headline auto-filled from URL and template generated');
            }
        } catch (error) {
            console.error('Error processing headline parameter:', error);
        }
    }
});

// Auto-generate template on headline input
document.getElementById('headlineInput').addEventListener('input', (e) => {
    document.getElementById('charCount').textContent = e.target.value.length;
    if (e.target.value.trim().length > 0) {
        generateTemplate();
    }
});

// Get date string (auto-generated - today's date)
function getDateString() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${month}/${day}/${year}`;
}

// GitHub raw content URL for template.png
const GITHUB_TEMPLATE_URL = 'https://raw.githubusercontent.com/CDH-Devs/-News-Template/main/template.png';

// Generate template using Canvas composition (same as bot)
function generateTemplate() {
    const headline = document.getElementById('headlineInput').value.trim();
    if (!headline) {
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
                document.getElementById('result').style.display = 'block';
                autoUploadToPostimg();
            };
            
            templateImg.onerror = function() {
                console.error('Failed to load template from GitHub');
                composeTemplateFallback(headline);
                document.getElementById('result').style.display = 'block';
                autoUploadToPostimg();
            };
            
            templateImg.src = URL.createObjectURL(blob);
        })
        .catch(error => {
            console.error('Failed to fetch template:', error);
            composeTemplateFallback(headline);
            document.getElementById('result').style.display = 'block';
            autoUploadToPostimg();
        });
}

// Compose template on canvas (same logic as bot's image-template.js)
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

    // Scale factors for Instagram (1080x1350) vs bot standard (920x1000)
    const scaleX = canvasWidth / 920;
    const scaleY = canvasHeight / 1000;

    // Draw date box with white background (scaled from bot positioning)
    const dateStr = getDateString();
    const dateBoxTop = Math.round(200 * scaleY);
    const dateBoxLeft = Math.round(52 * scaleX);
    const dateBoxWidth = Math.round(220 * scaleX);
    const dateBoxHeight = Math.round(60 * scaleY);
    const dateBoxFontSize = Math.round(32 * scaleX);
    
    ctx.fillStyle = 'white';
    ctx.fillRect(dateBoxLeft, dateBoxTop, dateBoxWidth, dateBoxHeight);
    
    // Draw date text (right-aligned in box)
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${dateBoxFontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(dateStr, dateBoxLeft + dateBoxWidth - 10, dateBoxTop + dateBoxHeight / 2);

    // Draw headline (image box disabled - headline only mode)
    drawHeadlineTextScaled(ctx, headline, canvasWidth, canvasHeight);

    // Show result
    document.getElementById('result').style.display = 'block';
    window.scrollTo(0, document.getElementById('result').offsetTop - 100);
}

// Fallback if GitHub fetch fails
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

    // Header with title
    ctx.fillStyle = '#CC0000';
    ctx.fillRect(0, 0, canvasWidth, 150);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('CDH NEWS ALERT', canvasWidth / 2, 100);

    // Footer bar
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(0, canvasHeight - 135, canvasWidth, 135);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 50px Arial';
    ctx.fillText('CDH NEWS', canvasWidth / 2, canvasHeight - 50);

    // Date box (scaled)
    const scaleX = canvasWidth / 920;
    const scaleY = canvasHeight / 1000;
    const dateBoxTop = Math.round(200 * scaleY);
    const dateBoxLeft = Math.round(52 * scaleX);
    const dateBoxWidth = Math.round(220 * scaleX);
    const dateBoxHeight = Math.round(60 * scaleY);
    const dateBoxFontSize = Math.round(32 * scaleX);
    
    ctx.fillStyle = 'white';
    ctx.fillRect(dateBoxLeft, dateBoxTop, dateBoxWidth, dateBoxHeight);
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${dateBoxFontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const dateStr = getDateString();
    ctx.fillText(dateStr, dateBoxLeft + dateBoxWidth - 10, dateBoxTop + dateBoxHeight / 2);

    // Draw headline (image box disabled)
    drawHeadlineTextScaled(ctx, headline, canvasWidth, canvasHeight);

    // Show result
    document.getElementById('result').style.display = 'block';
    window.scrollTo(0, document.getElementById('result').offsetTop - 100);
}

// Wrap text helper (same logic as bot)
function wrapTextHelper(text, fontSize, maxWidth) {
    const charWidth = fontSize * 0.56;
    const maxCharsPerLine = Math.floor(maxWidth / charWidth);
    const hasSpaces = text.includes(' ');
    
    if (!hasSpaces && text.length > maxCharsPerLine) {
        const lines = [];
        for (let i = 0; i < text.length; i += maxCharsPerLine) {
            lines.push(text.substring(i, i + maxCharsPerLine));
        }
        return lines.slice(0, 8);
    } else {
        const words = text.split(' ');
        const lines = [];
        let line = '';
        for (const word of words) {
            const test = line ? line + ' ' + word : word;
            if (test.length > maxCharsPerLine && line) {
                lines.push(line);
                line = word;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
        return lines.slice(0, 8);
    }
}

// Draw headline with automatic sizing and wrapping (same logic as bot)
function drawHeadlineTextScaled(ctx, headline, canvasWidth, canvasHeight) {
    const scaleX = canvasWidth / 920;
    const scaleY = canvasHeight / 1000;
    
    // Scaled constraints from bot
    const maxWidth = 880 * scaleX;
    const maxHeight = 400 * scaleY;
    
    // Start with larger bold font, but ensure it fits based on headline length
    let fontSize = Math.round(56 * scaleX);
    if (headline.length > 100) fontSize = Math.round(32 * scaleX);
    else if (headline.length > 80) fontSize = Math.round(36 * scaleX);
    else if (headline.length > 60) fontSize = Math.round(40 * scaleX);
    else if (headline.length > 50) fontSize = Math.round(44 * scaleX);
    else if (headline.length > 40) fontSize = Math.round(48 * scaleX);
    else if (headline.length > 30) fontSize = Math.round(52 * scaleX);
    
    let lines = wrapTextHelper(headline, fontSize, maxWidth);
    let finalFontSize = fontSize;
    
    // Reduce font if text doesn't fit in headline box
    while ((lines.length * Math.ceil(finalFontSize * 1.3) + 30) > maxHeight && finalFontSize > Math.round(24 * scaleX)) {
        finalFontSize -= 2;
        lines = wrapTextHelper(headline, finalFontSize, maxWidth);
    }
    
    const lineHeight = Math.ceil(finalFontSize * 1.3);
    const headlineTop = Math.round(420 * scaleY);
    const headlineLeft = Math.round(50 * scaleX);
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${finalFontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // Draw each line
    for (let i = 0; i < lines.length; i++) {
        const y = headlineTop + (i * lineHeight);
        ctx.fillText(lines[i], canvasWidth / 2, y);
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

// Get token from postimages.org homepage
async function getPostimgToken() {
    try {
        const response = await fetch(POSTIMG_TOKEN_URL);
        const html = await response.text();
        const tokenMatch = html.match(/["']token["']\s*,\s*["'](\w+)["']/);
        if (tokenMatch && tokenMatch[1]) {
            return tokenMatch[1];
        }
        console.warn('Could not extract token, using default');
        return 'default';
    } catch (error) {
        console.error('Token extraction error:', error);
        return 'default';
    }
}

// Upload image to postimg.cc
async function uploadToPostimg(blob) {
    try {
        const token = await getPostimgToken();
        const sessionUpload = Date.now().toString().substring(0, 13);
        const uploadSession = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
        const uploadReferer = 'aHR0cHM6Ly9wb3N0aW1nLmNjLw==';
        
        const formData = new FormData();
        formData.append('file', blob, 'lk-news-template.png');
        formData.append('token', token);
        formData.append('expire', '0');
        formData.append('numfiles', '1');
        formData.append('optsize', '0');
        formData.append('session_upload', sessionUpload);
        formData.append('upload_referer', uploadReferer);
        formData.append('upload_session', uploadSession);
        formData.append('adult', '0');
        
        const response = await fetch(POSTIMG_API_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (data.url) {
            return data.url;
        } else {
            throw new Error('No URL in response');
        }
    } catch (error) {
        console.error('Postimg upload error:', error);
        throw error;
    }
}

// Auto-upload to postimg after template is generated
async function autoUploadToPostimg() {
    const canvas = document.getElementById('templateCanvas');
    
    // Always store canvas as data URL for bot fallback
    const canvasDataUrl = canvas.toDataURL('image/png');
    document.documentElement.setAttribute('data-canvas-image', canvasDataUrl);
    
    canvas.toBlob(async (blob) => {
        try {
            const shareUrl = await uploadToPostimg(blob);
            const linkElement = document.getElementById('postimgLink');
            linkElement.href = shareUrl;
            linkElement.textContent = shareUrl;
            
            // Store URL in data attribute for easy bot access
            document.documentElement.setAttribute('data-postimg-url', shareUrl);
            
            // Also store in a hidden meta tag for extra reliability
            let metaTag = document.querySelector('meta[name="postimg-url"]');
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.name = 'postimg-url';
                document.head.appendChild(metaTag);
            }
            metaTag.content = shareUrl;
            
            document.getElementById('linkSection').style.display = 'block';
            console.log('✅ Image hosted on Postimg.cc:', shareUrl);
        } catch (error) {
            console.error('Upload error:', error);
            console.error('Could not auto-upload to postimg - will use canvas image fallback');
        }
    }, 'image/png');
}

// Copy postimg link
function copyPostimgLink() {
    const link = document.getElementById('postimgLink').textContent;
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ Link copied to clipboard!');
    }).catch(() => {
        alert('Could not copy link');
    });
}
