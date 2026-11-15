import QRCode from 'qrcode';

/**
 * Standard A4 Landscape at ~175-300 DPI resolution
 */
export const CERT_WIDTH = 2000;
export const CERT_HEIGHT = 1414;

/**
 * Preloads an image safely so canvas can draw it without crashing if missing/offline.
 */
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Formats a clean certificate ID based on user unique code or fallback
 */
export function generateCertificateId(user, workshopId = '') {
  const baseCode = (user?.unique_code || user?.id || user?.user_id || 'PARTICIPANT')
    .toString()
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase();
  const wsTag = (workshopId || 'WS').toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  const hash = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CERT-DHN-${wsTag}-${baseCode.slice(-6)}-${hash}`;
}

/**
 * Draws decorative guilloche / vintage corner brackets
 */
function drawCornerFlourish(ctx, x, y, size, angle, strokeColor) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2.5;

  // L-corner
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, size);
  ctx.stroke();

  // Diagonal flourish
  ctx.beginPath();
  ctx.arc(size * 0.4, size * 0.4, size * 0.35, Math.PI, 1.5 * Math.PI, false);
  ctx.stroke();

  // Small rosette pip
  ctx.fillStyle = strokeColor;
  ctx.beginPath();
  ctx.arc(size * 0.35, size * 0.35, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draws an official golden ribbon badge or medallion
 */
function drawOfficialSeal(ctx, x, y, radius, theme) {
  ctx.save();
  ctx.translate(x, y);

  const isDark = theme === 'luxury-dark';
  const gold = isDark ? '#FFB800' : '#D4AF37';
  const ember = isDark ? '#FF5722' : '#8B0000';

  // Outer serrated/rayed rim
  const teeth = 36;
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const angle = (i * Math.PI * 2) / teeth;
    const r = i % 2 === 0 ? radius : radius - 7;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = gold;
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, radius - 14, 0, Math.PI * 2);
  ctx.fillStyle = isDark ? '#140E0A' : '#FAF8F5';
  ctx.fill();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dotted decorative ring
  ctx.beginPath();
  ctx.arc(0, 0, radius - 20, 0, Math.PI * 2);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Seal text
  ctx.fillStyle = isDark ? '#FFD700' : '#8B0000';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ OFFICIAL ★', 0, -18);
  ctx.font = '900 13px sans-serif';
  ctx.fillText('VERIFIED', 0, -2);
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('CREDENTIAL', 0, 14);

  // Ribbons hanging from seal
  ctx.restore();
}

/**
 * Draws simulated handwritten calligraphy signature
 */
function drawSignature(ctx, x, y, name, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Cursive loop flourish
  ctx.beginPath();
  ctx.moveTo(-60, 0);
  ctx.bezierCurveTo(-40, -24, -20, -32, 0, -12);
  ctx.bezierCurveTo(20, 8, 40, -20, 60, -6);
  ctx.bezierCurveTo(75, 4, 85, -15, 95, -2);
  ctx.stroke();

  // Elegant underline stroke
  ctx.beginPath();
  ctx.moveTo(-75, 12);
  ctx.bezierCurveTo(-20, 10, 40, 16, 90, 8);
  ctx.stroke();

  ctx.restore();
}

/**
 * Main certificate canvas rendering engine
 */
export async function renderCertificateCanvas(canvas, options = {}) {
  if (!canvas) return;

  const {
    participantName = 'Participant Name',
    college = '',
    workshopTitle = 'Workshop Name',
    workshopDate = 'March 2026',
    issueDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    certificateId = 'CERT-DHN-WS-0001',
    certificateType = 'Certificate of Participation',
    theme = 'luxury-dark', // 'luxury-dark' | 'classic-parchment'
    signatories = [
      { name: 'Dr. Kurmananda V.', title: 'Faculty Coordinator, IIST' },
      { name: 'Chief Convener', title: 'Convener, Dhanak' },
    ],
    verificationUrl = '',
    nameYOffset = 0,
    nameFontSize = 64,
  } = options;

  canvas.width = CERT_WIDTH;
  canvas.height = CERT_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isDark = theme === 'luxury-dark';

  // Palette
  const bgFill = isDark ? '#090807' : '#FCFBF8';
  const frameGold = isDark ? '#D4AF37' : '#B8860B';
  const textPrimary = isDark ? '#FFFFFF' : '#1A1815';
  const textSecondary = isDark ? '#C7BEB3' : '#4A4640';
  const textGold = isDark ? '#FFCA28' : '#9E6D00';
  const accentEmber = isDark ? '#FF6B00' : '#C0392B';

  // 1. Background Fill
  ctx.fillStyle = bgFill;
  ctx.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);

  if (isDark) {
    // Subtle radial aura in center
    const radial = ctx.createRadialGradient(
      CERT_WIDTH / 2,
      CERT_HEIGHT / 2,
      100,
      CERT_WIDTH / 2,
      CERT_HEIGHT / 2,
      CERT_WIDTH * 0.65
    );
    radial.addColorStop(0, 'rgba(255, 107, 0, 0.08)');
    radial.addColorStop(0.5, 'rgba(197, 85, 0, 0.03)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);
  } else {
    // Subtle parchment texture gradient
    const linGrad = ctx.createLinearGradient(0, 0, CERT_WIDTH, CERT_HEIGHT);
    linGrad.addColorStop(0, 'rgba(245, 238, 225, 0.5)');
    linGrad.addColorStop(1, 'rgba(255, 255, 255, 0.7)');
    ctx.fillStyle = linGrad;
    ctx.fillRect(0, 0, CERT_WIDTH, CERT_HEIGHT);
  }

  // 2. Multi-tier Guilloche Borders
  const m1 = 44; // outer margin
  const m2 = 58; // inner margin
  const m3 = 66; // hairline margin

  // Outer border
  ctx.strokeStyle = frameGold;
  ctx.lineWidth = 4.5;
  ctx.strokeRect(m1, m1, CERT_WIDTH - m1 * 2, CERT_HEIGHT - m1 * 2);

  // Inner border
  ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.45)' : 'rgba(184, 134, 11, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m2, m2, CERT_WIDTH - m2 * 2, CERT_HEIGHT - m2 * 2);

  // Accent hairline
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.strokeRect(m3, m3, CERT_WIDTH - m3 * 2, CERT_HEIGHT - m3 * 2);

  // 3. Ornate Corner Flourishes
  const cSize = 65;
  drawCornerFlourish(ctx, m1, m1, cSize, 0, frameGold);
  drawCornerFlourish(ctx, CERT_WIDTH - m1, m1, cSize, Math.PI / 2, frameGold);
  drawCornerFlourish(ctx, CERT_WIDTH - m1, CERT_HEIGHT - m1, cSize, Math.PI, frameGold);
  drawCornerFlourish(ctx, m1, CERT_HEIGHT - m1, cSize, -Math.PI / 2, frameGold);

  // 4. Preload and Draw Logos
  const [iistLogo, dhanakLogo] = await Promise.all([
    loadImage('/assets/iist.png'),
    loadImage('/assets/logo.png'),
  ]);

  if (iistLogo) {
    ctx.drawImage(iistLogo, 140, 105, 120, 120);
  } else {
    // Elegant fallback crest
    ctx.strokeStyle = frameGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(140, 110, 100, 100);
    ctx.fillStyle = textGold;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IIST', 190, 165);
  }

  if (dhanakLogo) {
    ctx.drawImage(dhanakLogo, CERT_WIDTH - 260, 105, 120, 120);
  } else {
    ctx.strokeStyle = frameGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(CERT_WIDTH - 240, 110, 100, 100);
    ctx.fillStyle = textGold;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DHANAK', CERT_WIDTH - 190, 165);
  }

  // 5. Institution & Festival Header
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Institution Line
  ctx.fillStyle = textGold;
  ctx.font = '600 24px "Space Grotesk", sans-serif';
  ctx.letterSpacing = '6px';
  ctx.fillText('INDIAN INSTITUTE OF SPACE SCIENCE AND TECHNOLOGY', CERT_WIDTH / 2, 115);

  // Subtitle / Location
  ctx.fillStyle = textSecondary;
  ctx.font = '400 15px sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(
    'Valiamala, Thiruvananthapuram, Kerala · Deemed to be University under Dept. of Space, Govt. of India',
    CERT_WIDTH / 2,
    155
  );

  // Festival branding
  ctx.fillStyle = accentEmber;
  ctx.font = 'bold 16px sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('DHANAK 2027 · ANNUAL FESTIVAL', CERT_WIDTH / 2, 185);
  ctx.letterSpacing = '0px';

  // Decorative divider below header
  ctx.strokeStyle = isDark ? 'rgba(212, 175, 55, 0.35)' : 'rgba(184, 134, 11, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CERT_WIDTH / 2 - 320, 222);
  ctx.lineTo(CERT_WIDTH / 2 + 320, 222);
  ctx.stroke();

  // Little diamond in divider
  ctx.fillStyle = frameGold;
  ctx.beginPath();
  ctx.arc(CERT_WIDTH / 2, 222, 4.5, 0, Math.PI * 2);
  ctx.fill();

  // 6. Certificate Title Banner
  const bannerY = 270;
  ctx.fillStyle = textGold;
  ctx.font = 'bold 44px "Cinzel", "Playfair Display", "Times New Roman", serif';
  ctx.letterSpacing = '7px';
  ctx.fillText(certificateType.toUpperCase(), CERT_WIDTH / 2, bannerY);
  ctx.letterSpacing = '0px';

  // 7. Presentation Line
  ctx.fillStyle = textSecondary;
  ctx.font = 'italic 21px "Georgia", serif';
  ctx.fillText('This certificate is proudly awarded to', CERT_WIDTH / 2, 360);

  // 8. Participant Name (Exact Dynamic Coordinate Anchor Point!)
  // This is the core coordinate target: X=1000 (centered), Y=460+offset
  const nameY = 460 + nameYOffset;

  ctx.fillStyle = isDark ? '#FFFFFF' : '#1A140E';
  ctx.font = `bold ${nameFontSize}px "Cinzel", "Playfair Display", "Georgia", "Times New Roman", serif`;
  ctx.fillText(participantName, CERT_WIDTH / 2, nameY);

  // Decorative underline beneath participant name
  const nameWidth = ctx.measureText(participantName).width;
  const underlineW = Math.max(nameWidth * 1.08, 420);
  const underlineY = nameY + nameFontSize + 14;

  const grad = ctx.createLinearGradient(
    CERT_WIDTH / 2 - underlineW / 2,
    0,
    CERT_WIDTH / 2 + underlineW / 2,
    0
  );
  grad.addColorStop(0, 'rgba(212, 175, 55, 0)');
  grad.addColorStop(0.5, frameGold);
  grad.addColorStop(1, 'rgba(212, 175, 55, 0)');

  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(CERT_WIDTH / 2 - underlineW / 2, underlineY);
  ctx.lineTo(CERT_WIDTH / 2 + underlineW / 2, underlineY);
  ctx.stroke();

  // 9. College / Affiliation (if known)
  let nextY = underlineY + 36;
  if (college && college.trim()) {
    ctx.fillStyle = textSecondary;
    ctx.font = '500 20px sans-serif';
    ctx.fillText(`from ${college.trim()}`, CERT_WIDTH / 2, nextY);
    nextY += 44;
  }

  // 10. Completion & Workshop Statement
  ctx.fillStyle = textSecondary;
  ctx.font = '400 20px "Georgia", serif';
  ctx.fillText(
    'for active participation and successful completion of the intensive technical workshop on',
    CERT_WIDTH / 2,
    nextY
  );

  // Workshop Title (Golden & Prominent)
  nextY += 46;
  ctx.fillStyle = textGold;
  ctx.font = 'bold 36px "Space Grotesk", sans-serif';
  ctx.fillText(workshopTitle, CERT_WIDTH / 2, nextY);

  // Workshop Context / Dates
  nextY += 56;
  ctx.fillStyle = textSecondary;
  ctx.font = '400 19px "Georgia", serif';
  ctx.fillText(
    `conducted during Dhanak 2027 at Indian Institute of Space Science and Technology · ${workshopDate}`,
    CERT_WIDTH / 2,
    nextY
  );

  // 11. Signatures, Seals, and QR Verification Section
  const bottomSectionY = 1040;

  // Left Signatory (Faculty Coordinator)
  const leftSigX = 360;
  const sig1 = signatories[0] || { name: 'Dr. Kurmananda V.', title: 'Faculty Coordinator, IIST' };
  drawSignature(ctx, leftSigX, bottomSectionY + 20, sig1.name, isDark ? '#E5C07B' : '#4A3B2C');

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftSigX - 140, bottomSectionY + 54);
  ctx.lineTo(leftSigX + 140, bottomSectionY + 54);
  ctx.stroke();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(sig1.name, leftSigX, bottomSectionY + 68);
  ctx.fillStyle = textSecondary;
  ctx.font = '14px sans-serif';
  ctx.fillText(sig1.title, leftSigX, bottomSectionY + 94);

  // Center: Official Seal & Scannable QR Code
  const centerSealX = CERT_WIDTH / 2;
  drawOfficialSeal(ctx, centerSealX, bottomSectionY + 40, 68, theme);

  // Right Signatory (Convener)
  const rightSigX = CERT_WIDTH - 360;
  const sig2 = signatories[1] || { name: 'Convener', title: 'Convener, Dhanak' };
  drawSignature(ctx, rightSigX, bottomSectionY + 20, sig2.name, isDark ? '#E5C07B' : '#4A3B2C');

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(rightSigX - 140, bottomSectionY + 54);
  ctx.lineTo(rightSigX + 140, bottomSectionY + 54);
  ctx.stroke();

  ctx.fillStyle = textPrimary;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(sig2.name, rightSigX, bottomSectionY + 68);
  ctx.fillStyle = textSecondary;
  ctx.font = '14px sans-serif';
  ctx.fillText(sig2.title, rightSigX, bottomSectionY + 94);

  // 12. Dynamic QR Code (Scannable verification badge)
  const qrTarget =
    verificationUrl ||
    `https://conscientia.co.in/certificate/verify?id=${encodeURIComponent(
      certificateId
    )}&name=${encodeURIComponent(participantName)}&ws=${encodeURIComponent(workshopTitle)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(qrTarget, {
      width: 140,
      margin: 1,
      color: {
        dark: isDark ? '#000000' : '#140E0A',
        light: '#FFFFFF',
      },
    });
    const qrImg = await loadImage(qrDataUrl);
    if (qrImg) {
      const qrSize = 100;
      const qrX = 140;
      const qrY = CERT_HEIGHT - 210;

      // QR border/background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);
      ctx.strokeStyle = frameGold;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(qrX - 6, qrY - 6, qrSize + 12, qrSize + 12);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = textSecondary;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Scan to verify authenticity', qrX + qrSize + 16, qrY + 36);
      ctx.fillStyle = textGold;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(certificateId, qrX + qrSize + 16, qrY + 58);
    }
  } catch (err) {
    console.warn('[CertificateGenerator] QR rendering skipped:', err);
  }

  // 13. Certificate Bottom Metadata Footer
  ctx.textAlign = 'right';
  ctx.fillStyle = textSecondary;
  ctx.font = '13px monospace';
  ctx.fillText(`Issued: ${issueDate}`, CERT_WIDTH - 140, CERT_HEIGHT - 130);
  ctx.fillText(`Doc ID: ${certificateId}`, CERT_WIDTH - 140, CERT_HEIGHT - 105);

  ctx.textAlign = 'center';
  ctx.font = '12px sans-serif';
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  ctx.fillText(
    'Indian Institute of Space Science and Technology · Valid Certificate of Participation',
    CERT_WIDTH / 2,
    CERT_HEIGHT - 85
  );
}

/**
 * Downloads the rendered canvas as a high-resolution PNG file.
 */
export function downloadCanvasAsPNG(canvas, filename = 'certificate.png') {
  if (!canvas) return;
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Opens a print-friendly window for the certificate.
 */
export function printCanvasCertificate(canvas, title = 'Certificate') {
  if (!canvas) return;
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the certificate.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
          }
          img {
            width: 100vw;
            height: 100vh;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print();window.close();" />
      </body>
    </html>
  `);
  printWindow.document.close();
}

