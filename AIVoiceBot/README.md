# 🎙️ AI Voice Bot — Sarvam AI

A Python prototype for **Speech ↔ Text** conversion using [Sarvam AI](https://sarvam.ai/) APIs, with support for **11 Indian languages**.

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | 🎙️ Speech → Text | Record from mic and get a transcription (5 modes) |
| 2 | 🔊 Text → Speech | Type text and hear it spoken in any supported language |
| 3 | 🔄 Full Loop | Speak → Transcribe → Translate → Hear it in another language |

## Supported Languages

Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil, Telugu, English

## Quick Start

### 1. Get your API Key

Sign up at [dashboard.sarvam.ai](https://dashboard.sarvam.ai) and create an API key.

### 2. Setup

```bash
# Clone / navigate to the project
cd AIVoiceBot

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure API key
copy .env.example .env
# Edit .env and paste your actual API key
```

### 3. Run

```bash
python voice_bot.py
```

## Transcription Modes (Speech → Text)

| Mode | Description |
|------|-------------|
| `transcribe` | Original language transcription (default) |
| `translate` | Translate audio to English |
| `verbatim` | Word-for-word transcription |
| `translit` | Romanized transliteration |
| `codemix` | Mixed script output |

## Project Structure

```
AIVoiceBot/
├── voice_bot.py       # Main application (menu + all features)
├── recorder.py        # Mic recording utility (PyAudio)
├── requirements.txt   # Python dependencies
├── .env.example       # API key template
├── .env               # Your actual API key (git-ignored)
└── README.md
```

## Troubleshooting

- **PyAudio install fails on Windows?** → Install from pre-built wheel:
  ```
  pip install pipwin
  pipwin install pyaudio
  ```
- **No audio playback?** → The file is saved to temp; open it manually if `playsound` fails.
- **API errors?** → Double-check your API key in `.env`.
