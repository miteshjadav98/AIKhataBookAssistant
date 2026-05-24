"""
AI Voice Bot — Speech-to-Text & Text-to-Speech using Sarvam AI APIs.

Features:
  1. 🎙️  Speech → Text   : Record from mic, transcribe via Saaras v3
  2. 🔊  Text → Speech   : Type text, generate audio via Sarvam TTS
  3. 🔄  Full Loop       : Speak → Transcribe → Translate → Speak back

Requires: SARVAM_API_KEY in .env or environment variable.
"""

import os
import sys
import base64
import tempfile
import uuid

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.prompt import Prompt, IntPrompt
from rich import box

# Load environment variables from .env
load_dotenv()

console = Console()

# ─── Sarvam AI Client ───────────────────────────────────────────────

def get_client():
    """Initialize and return the SarvamAI client."""
    from sarvamai import SarvamAI

    api_key = os.getenv("SARVAM_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        console.print(Panel(
            "[bold red]API key not configured![/bold red]\n\n"
            "1. Get your key from [link=https://dashboard.sarvam.ai]dashboard.sarvam.ai[/link]\n"
            "2. Create a [bold].env[/bold] file with:\n"
            "   [cyan]SARVAM_API_KEY=your_actual_key[/cyan]",
            title="⚠️  Setup Required",
            border_style="red",
        ))
        sys.exit(1)

    return SarvamAI(api_subscription_key=api_key)


# ─── Language Config ─────────────────────────────────────────────────

LANGUAGES = {
    "1": ("Hindi",      "hi-IN"),
    "2": ("Bengali",    "bn-IN"),
    "3": ("Gujarati",   "gu-IN"),
    "4": ("Kannada",    "kn-IN"),
    "5": ("Malayalam",  "ml-IN"),
    "6": ("Marathi",    "mr-IN"),
    "7": ("Odia",       "od-IN"),
    "8": ("Punjabi",    "pa-IN"),
    "9": ("Tamil",      "ta-IN"),
    "10": ("Telugu",    "te-IN"),
    "11": ("English",   "en-IN"),
}


def pick_language(prompt_text: str = "Select target language") -> str:
    """Show a language picker and return the language code."""
    table = Table(box=box.ROUNDED, border_style="bright_cyan", show_header=False)
    table.add_column("No.", style="bold cyan", width=4)
    table.add_column("Language", style="white")
    table.add_column("Code", style="dim")

    for key, (name, code) in LANGUAGES.items():
        table.add_row(key, name, code)

    console.print()
    console.print(table)

    choice = Prompt.ask(
        f"\n  {prompt_text}",
        choices=list(LANGUAGES.keys()),
        default="1",
    )
    name, code = LANGUAGES[choice]
    console.print(f"  → [bold green]{name}[/bold green] ({code})\n")
    return code


# ─── Feature 1: Speech to Text ──────────────────────────────────────

def speech_to_text(client):
    """Record audio from microphone and transcribe it."""
    from recorder import record_audio

    console.print(Panel(
        "[bold]🎙️  Speech → Text[/bold]\n"
        "Record your voice and get a transcription.",
        border_style="magenta",
    ))

    # Choose transcription mode
    console.print("  [bold]Transcription modes:[/bold]")
    modes = {
        "1": ("transcribe", "Original language transcription"),
        "2": ("translate",  "Translate audio to English"),
        "3": ("verbatim",   "Word-for-word transcription"),
        "4": ("translit",   "Romanized transliteration"),
        "5": ("codemix",    "Mixed script output"),
    }
    for key, (mode, desc) in modes.items():
        console.print(f"    [cyan]{key}[/cyan] — {mode:12s} : {desc}")

    mode_choice = Prompt.ask("\n  Select mode", choices=list(modes.keys()), default="1")
    mode_name = modes[mode_choice][0]
    console.print(f"  → Mode: [bold green]{mode_name}[/bold green]\n")

    # Record from mic
    audio_path = record_audio()
    if not audio_path:
        return

    # Transcribe via Sarvam API
    console.print("\n  ⏳ [yellow]Transcribing...[/yellow]")
    try:
        with open(audio_path, "rb") as f:
            response = client.speech_to_text.transcribe(
                file=f,
                model="saaras:v3",
                mode=mode_name,
            )

        console.print()
        console.print(Panel(
            f"[bold white]{response.transcript}[/bold white]",
            title="📝 Transcription Result",
            border_style="green",
            padding=(1, 2),
        ))

        # Show extra details if available
        if hasattr(response, 'language_code') and response.language_code:
            console.print(f"  🌐 Detected language: [cyan]{response.language_code}[/cyan]")

    except Exception as e:
        console.print(f"\n  [bold red]❌ Error:[/bold red] {e}")
    finally:
        # Clean up recorded file
        if os.path.exists(audio_path):
            os.remove(audio_path)


# ─── Feature 2: Text to Speech ──────────────────────────────────────

def text_to_speech(client):
    """Convert typed text to speech audio."""
    console.print(Panel(
        "[bold]🔊  Text → Speech[/bold]\n"
        "Type text and hear it spoken aloud.",
        border_style="cyan",
    ))

    text = Prompt.ask("  ✏️  Enter text to speak")
    if not text.strip():
        console.print("  [yellow]⚠ Empty text, skipping.[/yellow]")
        return

    lang_code = pick_language("Select speech language")

    # If target language is not English, offer to translate the text first
    if lang_code != "en-IN":
        translate_confirm = Prompt.ask(
            "  🔄 Would you like to translate this text to the target language first?",
            choices=["y", "n"],
            default="y"
        )
        if translate_confirm.lower() == "y":
            console.print("  ⏳ [yellow]Translating text to target language...[/yellow]")
            try:
                translate_response = client.text.translate(
                    input=text,
                    source_language_code="auto",
                    target_language_code=lang_code,
                    speaker_gender="Male",
                )
                text = translate_response.translated_text
                console.print(Panel(
                    f"[bold white]{text}[/bold white]",
                    title="🌐 Translated Text (to be spoken)",
                    border_style="blue",
                ))
            except Exception as trans_err:
                console.print(f"  [yellow]⚠ Translation failed, using original text: {trans_err}[/yellow]")

    console.print("  ⏳ [yellow]Generating speech...[/yellow]")
    try:
        response = client.text_to_speech.convert(
            text=text,
            target_language_code=lang_code,
            model="bulbul:v3",
        )

        # The response contains base64-encoded audio
        if hasattr(response, 'audios') and response.audios:
            audio_b64 = response.audios[0]
            audio_bytes = base64.b64decode(audio_b64)

            # Save to temp file and play
            filename = f"sarvam_tts_{uuid.uuid4().hex[:8]}.wav"
            output_path = os.path.join(tempfile.gettempdir(), filename)
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

            console.print(f"  ✅ [green]Audio generated → [bold]{output_path}[/bold][/green]")
            console.print("  🔊 [cyan]Playing audio...[/cyan]\n")

            try:
                from playsound import playsound
                playsound(output_path)
            except Exception as play_err:
                console.print(f"  [yellow]⚠ Could not auto-play: {play_err}[/yellow]")
                console.print(f"  📂 Open the file manually: [bold]{output_path}[/bold]")
            finally:
                # Try to clean up the temporary file
                try:
                    if os.path.exists(output_path):
                        os.remove(output_path)
                except Exception:
                    pass
        else:
            console.print(Panel(
                f"[bold white]Response:[/bold white]\n{response}",
                title="🔊 TTS Result",
                border_style="green",
            ))

    except Exception as e:
        console.print(f"\n  [bold red]❌ Error:[/bold red] {e}")


# ─── Feature 3: Full Loop (Speak → Transcribe → Translate → Speak) ──

def full_loop(client):
    """Record speech, transcribe, translate to another language, then speak it."""
    console.print(Panel(
        "[bold]🔄  Full Voice Translation Loop[/bold]\n"
        "Speak → Transcribe → Translate → Hear it in another language!",
        border_style="yellow",
    ))

    # Step 1: Record
    from recorder import record_audio

    console.print("  [bold]Step 1:[/bold] Record your voice\n")
    audio_path = record_audio()
    if not audio_path:
        return

    # Step 2: Transcribe
    console.print("\n  [bold]Step 2:[/bold] Transcribing...")
    try:
        with open(audio_path, "rb") as f:
            stt_response = client.speech_to_text.transcribe(
                file=f,
                model="saaras:v3",
                mode="transcribe",
            )
        transcript = stt_response.transcript
        console.print(Panel(
            f"[white]{transcript}[/white]",
            title="📝 You said",
            border_style="green",
        ))
    except Exception as e:
        console.print(f"\n  [bold red]❌ Transcription error:[/bold red] {e}")
        return
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

    # Step 3: Translate
    console.print("\n  [bold]Step 3:[/bold] Choose target language for translation")
    target_lang = pick_language("Translate to")

    console.print("  ⏳ [yellow]Translating...[/yellow]")
    try:
        translate_response = client.text.translate(
            input=transcript,
            source_language_code="auto",
            target_language_code=target_lang,
            speaker_gender="Male",
        )
        translated = translate_response.translated_text
        console.print(Panel(
            f"[bold white]{translated}[/bold white]",
            title="🌐 Translation",
            border_style="blue",
        ))
    except Exception as e:
        console.print(f"\n  [bold red]❌ Translation error:[/bold red] {e}")
        return

    # Step 4: Speak the translation
    console.print("\n  [bold]Step 4:[/bold] Speaking the translation...")
    try:
        tts_response = client.text_to_speech.convert(
            text=translated,
            target_language_code=target_lang,
            model="bulbul:v3",
        )

        if hasattr(tts_response, 'audios') and tts_response.audios:
            audio_b64 = tts_response.audios[0]
            audio_bytes = base64.b64decode(audio_b64)

            filename = f"sarvam_loop_{uuid.uuid4().hex[:8]}.wav"
            output_path = os.path.join(tempfile.gettempdir(), filename)
            with open(output_path, "wb") as f:
                f.write(audio_bytes)

            console.print(f"  ✅ [green]Audio ready → [bold]{output_path}[/bold][/green]")
            console.print("  🔊 [cyan]Playing...[/cyan]\n")

            try:
                from playsound import playsound
                playsound(output_path)
            except Exception as play_err:
                console.print(f"  [yellow]⚠ Could not auto-play: {play_err}[/yellow]")
                console.print(f"  📂 Open the file manually: [bold]{output_path}[/bold]")
            finally:
                # Try to clean up the temporary file
                try:
                    if os.path.exists(output_path):
                        os.remove(output_path)
                except Exception:
                    pass
        else:
            console.print(f"  TTS Response: {tts_response}")

    except Exception as e:
        console.print(f"\n  [bold red]❌ TTS error:[/bold red] {e}")


# ─── Main Menu ───────────────────────────────────────────────────────

def show_banner():
    """Display the app banner."""
    banner = """
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║     █████╗ ██╗    ██╗   ██╗ ██████╗ ██╗ ██████╗███████╗      ║
║    ██╔══██╗██║    ██║   ██║██╔═══██╗██║██╔════╝██╔════╝      ║
║    ███████║██║    ██║   ██║██║   ██║██║██║     █████╗        ║
║    ██╔══██║██║    ╚██╗ ██╔╝██║   ██║██║██║     ██╔══╝        ║
║    ██║  ██║██║     ╚████╔╝ ╚██████╔╝██║╚██████╗███████╗      ║
║    ╚═╝  ╚═╝╚═╝      ╚═══╝   ╚═════╝ ╚═╝ ╚═════╝╚══════╝      ║
║                                                               ║
║          Powered by Sarvam AI  •  Indian Languages            ║
╚═══════════════════════════════════════════════════════════════╝"""
    console.print(banner, style="bold bright_cyan")
    console.print()


def main():
    """Main application loop."""
    show_banner()
    client = get_client()
    console.print("  ✅ [green]Connected to Sarvam AI[/green]\n")

    while True:
        # Menu
        table = Table(
            title="🎯 What would you like to do?",
            box=box.DOUBLE_EDGE,
            border_style="bright_magenta",
            title_style="bold white",
            show_header=False,
            padding=(0, 2),
        )
        table.add_column("Option", style="bold cyan", width=3)
        table.add_column("Feature", style="white")
        table.add_column("Description", style="dim")

        table.add_row("1", "🎙️  Speech → Text",   "Record from mic & transcribe")
        table.add_row("2", "🔊  Text → Speech",   "Type text & hear it spoken")
        table.add_row("3", "🔄  Full Loop",        "Speak → Transcribe → Translate → Speak")
        table.add_row("0", "🚪  Exit",             "Quit the application")

        console.print(table)

        choice = Prompt.ask("\n  Your choice", choices=["0", "1", "2", "3"], default="1")

        if choice == "0":
            console.print("\n  👋 [bold cyan]Goodbye![/bold cyan]\n")
            break
        elif choice == "1":
            speech_to_text(client)
        elif choice == "2":
            text_to_speech(client)
        elif choice == "3":
            full_loop(client)

        console.print("\n" + "─" * 60 + "\n")


if __name__ == "__main__":
    main()
