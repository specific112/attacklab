import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { resolve } from "path";

const outDir = resolve("public");

const ogHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0a0f 100%);
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(106,255,240,.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(106,255,240,.04) 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .glow {
    position: absolute;
    width: 500px; height: 500px;
    border-radius: 50%;
    filter: blur(120px);
    opacity: .15;
  }
  .glow-cyan { background: #6afff0; top: -100px; right: -50px; }
  .glow-purple { background: #7c3aed; bottom: -150px; left: -50px; }
  .content {
    position: relative; z-index: 2;
    text-align: center;
    padding: 0 80px;
  }
  .badge {
    display: inline-block;
    background: rgba(106,255,240,.12);
    border: 1px solid rgba(106,255,240,.25);
    color: #6afff0;
    font-size: 14px;
    font-weight: 700;
    padding: 6px 16px;
    border-radius: 20px;
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  h1 {
    color: #fff;
    font-size: 56px;
    font-weight: 900;
    line-height: 1.1;
    margin-bottom: 16px;
    letter-spacing: -.02em;
  }
  h1 span { color: #6afff0; }
  .sub {
    color: rgba(255,255,255,.55);
    font-size: 22px;
    font-weight: 400;
    line-height: 1.5;
    max-width: 700px;
    margin: 0 auto 28px;
  }
  .stats {
    display: flex;
    gap: 32px;
    justify-content: center;
  }
  .stat {
    text-align: center;
  }
  .stat-val {
    color: #6afff0;
    font-size: 28px;
    font-weight: 900;
  }
  .stat-label {
    color: rgba(255,255,255,.4);
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-top: 2px;
  }
  .url {
    position: absolute;
    bottom: 28px;
    right: 32px;
    color: rgba(255,255,255,.3);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: .02em;
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="glow glow-cyan"></div>
  <div class="glow glow-purple"></div>
  <div class="content">
    <div class="badge">Ethical Hacking Platform</div>
    <h1><span>ATTACKLAB</span></h1>
    <div class="sub">Master ethical hacking, penetration testing &amp; bug bounty hunting through hands-on labs and real-world simulations.</div>
    <div class="stats">
      <div class="stat"><div class="stat-val">30+</div><div class="stat-label">Courses</div></div>
      <div class="stat"><div class="stat-val">40K+</div><div class="stat-label">Researchers</div></div>
      <div class="stat"><div class="stat-val">100+</div><div class="stat-label">Labs</div></div>
      <div class="stat"><div class="stat-val">Free</div><div class="stat-label">To Start</div></div>
    </div>
  </div>
  <div class="url">attacklab.vercel.app</div>
</body>
</html>`;

const appleTouchHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 180px; height: 180px;
    background: linear-gradient(135deg, #0a0a0f, #0d1117);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', sans-serif;
    overflow: hidden;
  }
  .icon {
    color: #6afff0;
    font-size: 64px;
    font-weight: 900;
    letter-spacing: -.04em;
    text-shadow: 0 0 40px rgba(106,255,240,.3);
  }
</style>
</head>
<body>
  <div class="icon">A</div>
</body>
</html>`;

async function generate() {
  const browser = await chromium.launch({ headless: true });

  // OG Image (1200x630)
  console.log("Generating OG image...");
  const ogPage = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await ogPage.setContent(ogHtml, { waitUntil: "networkidle" });
  await ogPage.waitForTimeout(1500); // wait for font load
  const ogBuffer = await ogPage.screenshot({ type: "png" });
  writeFileSync(resolve(outDir, "og-image.png"), ogBuffer);
  console.log("  -> public/og-image.png");

  // Apple Touch Icon (180x180)
  console.log("Generating apple-touch-icon...");
  const atiPage = await browser.newPage({ viewport: { width: 180, height: 180 } });
  await atiPage.setContent(appleTouchHtml, { waitUntil: "networkidle" });
  await atiPage.waitForTimeout(1500);
  const atiBuffer = await atiPage.screenshot({ type: "png" });
  writeFileSync(resolve(outDir, "apple-touch-icon.png"), atiBuffer);
  console.log("  -> public/apple-touch-icon.png");

  await browser.close();
  console.log("Done!");
}

generate().catch(console.error);
