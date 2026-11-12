# 📷 LearnCamera - Interactive Camera Academy & Simulator

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-orange.svg)](#)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Vanilla%20JS%20%2F%20HTML5%20%2F%20CSS3-blue.svg)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#)

**LearnCamera** is an open-source, interactive web application designed to help photographers, students, and engineers master the mechanics, exposure physics, optical projection models, and creative techniques of digital cameras.

---

## 🌟 Key Application Modules

### 1. 🎓 Camera Academy & Learning Hub
- **Interactive Lessons**: Deep-dive into Aperture (depth of field & bokeh), Shutter Speed (action freezing vs. motion blur), ISO (sensor gain & noise), the Exposure Triangle (EV calculations), Focal Lengths, and Sensor Crop Factors.
- **"Try in Simulator" Actions**: One click tunes the simulator directly to each lesson's concept.
- **Skill Challenges & Missions**: Real interactive missions (Action Hero, Dreamy Bokeh, Deep Landscape, Low-Light Stalker) that evaluate your camera settings with live feedback.
- **Quick Scenario Presets**: One-click professional setups for *Creamy Portrait*, *Fast Sports*, *Night Astro*, *Street Documentary*, *Deep Landscape*, and *Motion Panning*.
- **Interactive Photography Quiz**: 5-question mastery quiz with immediate answer validation and detailed optical explanations.
- **Optics Glossary**: Comprehensive dictionary covering Bokeh, Circle of Confusion (CoC), Exposure Value (EV), Hyperfocal Distance, and the Sunny 16 rule.

### 2. 📷 Camera Simulator (Virtual Lab)
- **Exposure Triangle Controls**:
  - **Aperture**: $f/1.2$ to $f/22$ with true depth-of-field bokeh blurring based on circle of confusion formulas.
  - **Shutter Speed**: $1/4000\text{s}$ to $1\text{s}$ with angular velocity motion blur on rotating objects.
  - **ISO**: $100$ to $12,800$ with dynamic stochastic sensor grain noise.
- **Body & Lens Parameters**:
  - Full Frame ($1.0\times$), APS-C ($1.5\times$), and Micro Four Thirds ($2.0\times$) sensor crop factors.
  - Variable Focal Length ($18\text{mm}$ to $200\text{mm}$) and Focus Distance ($1.0\text{m}$ to $10.0\text{m}$).
- **Viewfinder HUD**:
  - Real-time digital EV meter needle ($-3\text{ EV}$ to $+3\text{ EV}$).
  - Live overexposure and underexposure warnings.
  - 3x3 compositional rule-of-thirds grid overlay.
  - Audio-synthesized mechanical shutter sound (via Web Audio API) with screen flash and a persistent **Camera Roll** film strip.

### 3. 🧪 Webcam Clone Lab
- **Multi-Shot Compositor**: Capture up to 4 clone layers using your real webcam or an interactive holographic simulation fallback.
- **Split-Screen & Brush Masking**: Slice or manually paint clones into a single frame using soft-edged alpha brushes.
- **Vintage Film Profiles**: *Chrome Gold*, *Noir Mono*, *Cyberpunk Indigo*, and *Polaroid Faded*.
- **Export**: One-click master composite JPEG download.

### 4. 📐 Camera Physics & Optics Explorer
- **Pinhole Camera Model**: Explains the mathematical projection from 3D space $(X, Y, Z)$ to 2D digital sensor pixels $(u, v)$:
  $$\begin{aligned}
  u &= f \cdot \frac{X}{Z} + u_0 \\
  v &= f \cdot \frac{Y}{Z} + v_0
  \end{aligned}$$
- **Camera Intrinsic Matrix ($K$)**: Formulates focal lengths in pixel units, sensor center shifts, and skew.
- **Interactive 3D-to-2D Sandbox**: Drag 3D coordinates $(X, Y, Z)$ and watch the projected pixel location update in real-time.

---

## 🚀 Quick Start & How to Run

### Option 1: Direct Browser Access
Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended for PWA & Webcam)
Using Python:
```bash
cd learn-camera
python -m http.server 8000
```
Then navigate to:
```
http://localhost:8000
```

---

## 📱 Progressive Web App (PWA)
LearnCamera includes a `manifest.json` and `sw.js` (Service Worker). You can install it as a standalone desktop or mobile application directly from your browser's address bar icon.

---

## 🛠️ Project Structure
```
learn-camera/
├── index.html        # Main application layout, HUD, Academy, and labs
├── style.css         # Dark-carbon theme, glassmorphism, responsive styles
├── app.js            # Core simulation engine, Web Audio, PWA & Academy logic
├── manifest.json     # PWA standalone manifest
├── sw.js             # Offline Service Worker cache
├── icon.svg          # Vector application logo & app icon
├── .gitignore        # Git ignored files
└── README.md         # Documentation & guide
```

---

## 📄 License
MIT License. Created for interactive learning and optics simulation.
