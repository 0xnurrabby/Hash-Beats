<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,17,24&height=180&section=header&text=Hash-Beats&fontSize=52&fontColor=000000&fontAlignY=38&desc=Turn+any+transaction+hash+into+a+64-step+drum+beat&descAlignY=58&descSize=14&animation=fadeIn" width="100%"/>

<div align="center">

[![Live](https://img.shields.io/badge/Live%20App-bbf7d0?style=for-the-badge&logoColor=000)](https://hash-beats.vercel.app)
[![License](https://img.shields.io/badge/MIT-bfdbfe?style=for-the-badge&logoColor=000)](LICENSE)
[![Platform](https://img.shields.io/badge/Farcaster%20Mini%20App-fde68a?style=for-the-badge&logoColor=000)]()
[![Tech](https://img.shields.io/badge/JavaScript%20%2B%20WebAudio-fca5a5?style=for-the-badge&logoColor=000)]()

</div>

<div align="center">
<i>Paste a transaction hash and watch it become music .... 0-9 digits map to kick drums, A-F hex letters map to snares, 64 steps from the 64 hash characters.</i>
</div>

---

```
TX Hash: 0x7a2b4c8d1e0f9a6b...
0-9 = Kick   A-F = Snare   64 steps from the hash (ignoring 0x)

[K][ ][S][ ][K][K][ ][S]...  ->  playing
```

---

## ✦ Features

<div align="center">

| | Feature | What it does |
|:---:|---|---|
| 🎵 | Hash to beat | Each hex character in a tx hash maps to a drum sound in a 64-step sequence |
| 🥁 | Kick + Snare | Digits 0-9 trigger kick, A-F trigger snare |
| 🎲 | Random hash | Generate a random hash to discover new beats |
| 💵 | USDC tip | Built-in tip flow on Base Mainnet |
| 📤 | Share | Share your beat's hash with others |
| 📱 | Farcaster native | Runs inside Warpcast / Base app as a mini app |

</div>

---

## ✦ Download & Run

**Step 1** .... Clone the repo

```bash
git clone https://github.com/0xnurrabby/Hash-Beats
cd Hash-Beats
```

**Step 2** .... Serve the files

```bash
# Open directly in browser
start index.html

# Or use a local server (recommended for ES modules)
npx serve .
# Open http://localhost:3000
```

**Step 3** .... Paste any Ethereum tx hash and press Play

---

## ✦ Setup

```
1. Clone the repo
2. Open index.html in a modern browser
   (Chrome/Firefox/Edge recommended for WebAudio support)
3. Paste any Ethereum/Base transaction hash in the input field
4. Click Play to hear the beat
5. Use the Random button to generate a new hash to explore
6. For Farcaster: deploy to Vercel and open inside Warpcast
```

---

## ✦ Project Structure

```
Hash-Beats/
  index.html     ->  app UI with hash input, beat visualizer, controls
  app.js         ->  beat engine: hash parsing, WebAudio drum synthesis
  styles.css     ->  dark theme UI styles
  assets/        ->  icons, splash images, embed images
  .well-known/   ->  Farcaster app manifest
```

---

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,17,24&height=100&section=footer&animation=fadeIn" width="100%"/>

<div align="center">MIT License .... built by <a href="https://github.com/0xnurrabby">0xnurrabby</a></div>
