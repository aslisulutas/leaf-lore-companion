/** Browser-only: draws a shareable plant card on a canvas and returns it as a PNG blob. */

export type CardData = {
  image: string;
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number;
  facts: { label: string; value: string }[];
  appName: string;
  footer: string;
};

const W = 1080;
const H = 1350;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, bad) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => bad(new Error("image load failed"));
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    const last = lines[maxLines - 1] ?? "";
    lines[maxLines - 1] = `${last.slice(0, Math.max(0, last.length - 1))}…`;
  }
  return lines;
}

export async function renderPlantCard(data: CardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  const [img] = await Promise.all([
    loadImage(data.image),
    document.fonts.ready.then(() =>
      Promise.all([
        document.fonts.load('600 72px "Fraunces"'),
        document.fonts.load('400 34px "Nunito"'),
        document.fonts.load('700 30px "Nunito"'),
      ]),
    ),
  ]);

  ctx.fillStyle = "#f4f6f1";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 64);
  ctx.clip();

  // Cover-crop the photo into the card.
  const scale = Math.max(W / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // Readability gradient over the lower half.
  const grad = ctx.createLinearGradient(0, H * 0.32, 0, H);
  grad.addColorStop(0, "rgba(20,32,24,0)");
  grad.addColorStop(0.35, "rgba(20,32,24,0.8)");
  grad.addColorStop(1, "rgba(16,26,20,0.95)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.32, W, H * 0.68);

  const pad = 76;
  let y = H - 76;

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = '700 30px "Nunito", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  ctx.fillText(data.footer, pad, y);
  y -= 66;

  ctx.font = '400 30px "Nunito", sans-serif';
  for (const fact of data.facts.slice(0, 3).reverse()) {
    const valueLines = wrap(ctx, fact.value, W - pad * 2, 2);
    for (const line of valueLines.reverse()) {
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      ctx.fillText(line, pad, y);
      y -= 40;
    }
    ctx.fillStyle = "rgba(196,226,201,0.95)";
    ctx.fillText(fact.label.toUpperCase(), pad, y);
    y -= 54;
  }

  ctx.font = 'italic 400 34px "Nunito", sans-serif';
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(`${data.scientificName} · ${data.family}`, pad, y);
  y -= 74;

  ctx.font = '600 72px "Fraunces", serif';
  ctx.fillStyle = "#ffffff";
  const nameLines = wrap(ctx, data.commonName, W - pad * 2, 2).reverse();
  for (const line of nameLines) {
    y -= line === nameLines[0] ? 0 : 84;
    ctx.fillText(line, pad, y);
    y -= 84;
  }

  // Top pills: app name and match percentage.
  const pill = (text: string, x: number, alignRight: boolean) => {
    ctx.font = '700 28px "Nunito", sans-serif';
    const w = ctx.measureText(text).width + 56;
    const px = alignRight ? x - w : x;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    roundRect(ctx, px, 60, w, 66, 33);
    ctx.fill();
    ctx.fillStyle = "#1e3a29";
    ctx.fillText(text, px + 28, 104);
  };
  pill(data.appName, pad, false);
  pill(`%${Math.round(data.confidence)}`, W - pad, true);

  ctx.restore();
  return new Promise<Blob>((ok, bad) => canvas.toBlob((b) => (b ? ok(b) : bad(new Error("encode failed"))), "image/png"));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function shareBlob(blob: Blob, filename: string, title: string): Promise<boolean> {
  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    await nav.share({ files: [file], title });
    return true;
  }
  return false;
}
