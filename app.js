
import { sdk } from "https://esm.sh/@farcaster/miniapp-sdk";
import { Attribution } from "https://esm.sh/ox/erc8021";

const DOMAIN = "nurrabby.com";
const HOME_URL = "https://nurrabby.com/";
const USDC_CONTRACT = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const USDC_DECIMALS = 6;

// Recipient must be a valid checksummed address for production.
// NOTE: If you want tips to go to your address, replace this constant.
const RECIPIENT = "0x1111111111111111111111111111111111111111";

// Required builder attribution constant (if left as TODO, sending is disabled gracefully).
const BUILDER_CODE = "TODO_REPLACE_BUILDER_CODE";
const dataSuffix = Attribution.toDataSuffix({ codes: [BUILDER_CODE] });

/** ---------- Mini App bootstrap (MUST) ---------- **/
const ctxBadge = document.getElementById("ctxBadge");
const toastEl = document.getElementById("toast");

let ethereumProvider = null;

function toast(msg, ms = 2200) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  window.clearTimeout(toastEl._t);
  toastEl._t = window.setTimeout(() => toastEl.classList.remove("show"), ms);
}

function isProbablyMiniApp() {
  // Heuristic only. Real detection is in host. We still behave safely on the web.
  return window !== window.top || /miniApp=true/i.test(location.search);
}

(async () => {
  try {
    // Acquire provider early; ready() after first render to avoid splash flicker.
    ethereumProvider = await sdk.wallet.getEthereumProvider();
    ctxBadge.textContent = "mini app: wallet ready";
  } catch (e) {
    ctxBadge.textContent = "wallet unavailable (web?)";
  } finally {
    // Always call ready() so the splash screen goes away in Mini App hosts.
    await sdk.actions.ready();
  }
})();

/** ---------- Sequencer (TxHash → drums) ---------- **/
const hashInput = document.getElementById("hashInput");
const randomBtn = document.getElementById("randomBtn");
const gridEl = document.getElementById("grid");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");
const bpmEl = document.getElementById("bpm");
const bpmVal = document.getElementById("bpmVal");
const swingEl = document.getElementById("swing");
const swingVal = document.getElementById("swingVal");

// URL param support: https://nurrabby.com/?tx=0x...
try {
  const url = new URL(window.location.href);
  const tx = url.searchParams.get("tx");
  if (tx) {
    hashInput.value = tx;
  }
} catch {}


const STEPS = 64;            // 64 steps = 4 bars @ 16th notes
const COLS = 16;             // UI is 16 columns; wraps to 4 rows
let pattern = new Array(STEPS).fill("off"); // "kick" | "snare" | "off"
let isPlaying = false;
let stepIndex = 0;
let timer = null;

let audio = null;

function ensureAudio() {
  if (audio) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  audio = new AudioCtx();
}

function kick(time) {
  ensureAudio();
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(150, time);
  o.frequency.exponentialRampToValueAtTime(52, time + 0.08);
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.95, time + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
  o.connect(g).connect(audio.destination);
  o.start(time);
  o.stop(time + 0.14);
}

function snare(time) {
  ensureAudio();
  // Noise buffer
  const bufferSize = Math.floor(audio.sampleRate * 0.13);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const hp = audio.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 1100;

  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(0.75, time + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.11);

  noise.connect(hp).connect(g).connect(audio.destination);
  noise.start(time);
  noise.stop(time + 0.13);
}

function validTxHash(input) {
  const s = input.trim();
  return /^0x[0-9a-fA-F]{64}$/.test(s);
}

function txHashToPattern(txHash) {
  const hex = txHash.trim().slice(2); // drop 0x
  const out = [];
  for (const ch of hex) {
    if (/[0-9]/.test(ch)) out.push("kick");
    else if (/[a-fA-F]/.test(ch)) out.push("snare");
    else out.push("off");
  }
  // If input isn't exactly 64 chars, pad/truncate.
  while (out.length < STEPS) out.push("off");
  return out.slice(0, STEPS);
}

function renderGrid() {
  gridEl.innerHTML = "";
  for (let i = 0; i < STEPS; i++) {
    const cell = document.createElement("div");
    cell.className = "step";
    if (pattern[i] === "kick") cell.classList.add("step--kick");
    if (pattern[i] === "snare") cell.classList.add("step--snare");
    cell.dataset.i = String(i);
    cell.title = `Step ${i + 1}`;
    cell.addEventListener("click", () => {
      pattern[i] = pattern[i] === "kick" ? "snare" : pattern[i] === "snare" ? "off" : "kick";
      renderGrid();
    });
    gridEl.appendChild(cell);
  }
  highlightStep(stepIndex);
}

function highlightStep(i) {
  const nodes = gridEl.querySelectorAll(".step");
  nodes.forEach((n) => n.classList.remove("step--scan"));
  const node = nodes[i];
  if (node) node.classList.add("step--scan");
}

function setFromHash() {
  const v = hashInput.value;
  if (!validTxHash(v)) {
    toast("Invalid TxHash. Use 0x + 64 hex chars.");
    return;
  }
  pattern = txHashToPattern(v);
  stepIndex = 0;
  renderGrid();
}

hashInput.addEventListener("change", setFromHash);
hashInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") setFromHash();
});

randomBtn.addEventListener("click", () => {
  const chars = "0123456789abcdef";
  let h = "0x";
  for (let i = 0; i < 64; i++) h += chars[(Math.random() * chars.length) | 0];
  hashInput.value = h;
  setFromHash();
});

bpmEl.addEventListener("input", () => {
  bpmVal.textContent = bpmEl.value;
  if (isPlaying) restart();
});
swingEl.addEventListener("input", () => {
  swingVal.textContent = `${swingEl.value}%`;
  if (isPlaying) restart();
});

function stepDurationMs() {
  // 16th note duration in ms: (60 / bpm) seconds per beat, beat=quarter, so 1/4 beat is 16th.
  const bpm = Number(bpmEl.value);
  const sec = (60 / bpm) / 4;
  return sec * 1000;
}

function swingOffsetMs(step) {
  const swing = Number(swingEl.value) / 100; // 0..0.60
  // Apply swing on off-steps (odd 16th notes)
  return (step % 2 === 1) ? stepDurationMs() * swing : 0;
}

function tick() {
  const now = audio ? audio.currentTime : 0;
  const t = audio ? (now + 0.02) : 0;

  const kind = pattern[stepIndex];
  if (kind === "kick") kick(t);
  if (kind === "snare") snare(t);

  highlightStep(stepIndex);
  stepIndex = (stepIndex + 1) % STEPS;

  const base = stepDurationMs();
  const delay = base + swingOffsetMs(stepIndex);
  timer = window.setTimeout(tick, delay);
}

function start() {
  if (isPlaying) return;
  ensureAudio();
  // resume for iOS / mobile policies
  audio.resume?.();
  isPlaying = true;
  playBtn.textContent = "Playing…";
  toast("Scanner online.");
  tick();
}

function stop() {
  isPlaying = false;
  playBtn.textContent = "Play";
  window.clearTimeout(timer);
  timer = null;
  stepIndex = 0;
  highlightStep(stepIndex);
}

function restart() {
  if (!isPlaying) return;
  window.clearTimeout(timer);
  timer = null;
  tick();
}

playBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);

// initial render
setFromHash();

/** ---------- Share ---------- **/
document.getElementById("shareBtn").addEventListener("click", async () => {
  const url = new URL(HOME_URL);
  url.searchParams.set("tx", hashInput.value.trim());
  try {
    await sdk.actions.composeCast({
      text: "I just generated a beat from an onchain tx hash 🎛️🧬",
      embeds: [url.toString()],
    });
  } catch {
    // Web fallback: copy URL
    await navigator.clipboard.writeText(url.toString());
    toast("Copied share link.");
  }
});

/** ---------- Tip bottom sheet + ERC-5792 wallet_sendCalls ---------- **/
const tipBtn = document.getElementById("tipBtn");
const tipSheet = document.getElementById("tipSheet");
const tipBackdrop = document.getElementById("tipSheetBackdrop");
const sendTipBtn = document.getElementById("sendTipBtn");
const closeTipBtn = document.getElementById("closeTipBtn");
const customUsd = document.getElementById("customUsd");
const recipientLabel = document.getElementById("recipientLabel");

recipientLabel.textContent = RECIPIENT;

const TipState = {
  IDLE: "Send USDC",
  PREP: "Preparing tip…",
  CONFIRM: "Confirm in wallet",
  SENDING: "Sending…",
  AGAIN: "Send again",
};

let tipState = TipState.IDLE;
let selectedUsd = null;

function setTipState(next) {
  tipState = next;
  sendTipBtn.textContent = next;
  sendTipBtn.disabled = next === TipState.PREP || next === TipState.CONFIRM || next === TipState.SENDING;
}

function openSheet() {
  tipBackdrop.classList.add("show");
  tipSheet.classList.add("show");
  tipBackdrop.setAttribute("aria-hidden", "false");
  tipSheet.setAttribute("aria-hidden", "false");
}

function closeSheet() {
  tipBackdrop.classList.remove("show");
  tipSheet.classList.remove("show");
  tipBackdrop.setAttribute("aria-hidden", "true");
  tipSheet.setAttribute("aria-hidden", "true");
}

tipBtn.addEventListener("click", () => {
  setTipState(TipState.IDLE);
  openSheet();
});

tipBackdrop.addEventListener("click", closeSheet);
closeTipBtn.addEventListener("click", closeSheet);

document.querySelectorAll(".preset").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedUsd = btn.getAttribute("data-usd");
    customUsd.value = "";
    toast(`Selected $${selectedUsd}`);
  });
});

function parseUsdToUsdcUnits(usdString) {
  const s = (usdString || "").trim();
  if (!s) return null;
  if (!/^\d+(\.\d{0,6})?$/.test(s)) return null; // up to 6 decimals
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "000000").slice(0, 6);
  const units = BigInt(whole) * 1000000n + BigInt(fracPadded);
  return units;
}

function isValidEvmAddress(addr) {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function pad32(hexNo0x) {
  return hexNo0x.padStart(64, "0");
}

function encodeErc20Transfer(to, amountUnits) {
  // selector a9059cbb
  const selector = "a9059cbb";
  const toClean = to.toLowerCase().replace(/^0x/, "");
  const amtHex = amountUnits.toString(16);
  return "0x" + selector + pad32(toClean) + pad32(amtHex);
}

async function getFromAddress() {
  const accounts = await ethereumProvider.request({ method: "eth_requestAccounts", params: [] });
  if (!accounts || !accounts[0]) throw new Error("No accounts returned.");
  return accounts[0];
}

async function ensureBaseMainnet() {
  const chainId = await ethereumProvider.request({ method: "eth_chainId", params: [] });
  if (chainId === "0x2105") return;
  // Attempt switch to Base mainnet
  try {
    await ethereumProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x2105" }],
    });
  } catch (e) {
    throw new Error("Please switch to Base Mainnet (0x2105) in your wallet.");
  }
}

function missingRecipientOrBuilderCode() {
  if (!isValidEvmAddress(RECIPIENT)) return "Recipient address is invalid.";
  if (BUILDER_CODE === "TODO_REPLACE_BUILDER_CODE") return "Builder code is not set (BUILDER_CODE).";
  return null;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

sendTipBtn.addEventListener("click", async () => {
  // State machine: if "Send again", treat as idle.
  if (tipState === TipState.AGAIN) setTipState(TipState.IDLE);

  const todo = missingRecipientOrBuilderCode();
  if (todo) {
    toast(todo);
    sendTipBtn.disabled = true;
    await sleep(900);
    sendTipBtn.disabled = false;
    return;
  }

  if (!ethereumProvider) {
    toast("Wallet provider unavailable. Open inside a Farcaster Mini App host.");
    return;
  }

  const usd = (customUsd.value && customUsd.value.trim()) ? customUsd.value.trim() : selectedUsd;
  const amountUnits = parseUsdToUsdcUnits(usd);
  if (!amountUnits || amountUnits <= 0n) {
    toast("Enter a valid tip amount.");
    return;
  }

  setTipState(TipState.PREP);
  // Mandatory pre-transaction UX: animate 1–1.5s before wallet UI blocks screen.
  await sleep(1200);

  try {
    setTipState(TipState.CONFIRM);
    await ensureBaseMainnet();

    const from = await getFromAddress();

    const data = encodeErc20Transfer(RECIPIENT, amountUnits);
    const params = [{
      version: "2.0.0",
      from,
      chainId: "0x2105",
      atomicRequired: true,
      calls: [{
        to: USDC_CONTRACT,
        value: "0x0",
        data
      }],
      capabilities: {
        dataSuffix
      }
    }];

    setTipState(TipState.SENDING);
    await ethereumProvider.request({ method: "wallet_sendCalls", params });

    toast("Tip sent. Thank you.");
    setTipState(TipState.AGAIN);
  } catch (e) {
    // Graceful reset on user rejection or errors.
    const msg = (e && typeof e === "object" && "message" in e) ? String(e.message) : "Transaction cancelled.";
    if (/user rejected|rejected/i.test(msg)) toast("Cancelled.");
    else toast(msg);
    setTipState(TipState.IDLE);
  }
});
