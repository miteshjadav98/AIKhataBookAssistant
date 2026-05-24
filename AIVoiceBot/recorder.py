"""
Microphone recording utility using PyAudio.
Records audio from the default input device and saves as WAV.
"""

import pyaudio
import wave
import os
import threading
from rich.console import Console
from rich.live import Live
from rich.text import Text

console = Console()

# Audio recording settings
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # 16kHz is optimal for Sarvam's Saaras model


def record_audio(output_path: str = "recording.wav", max_duration: int = 30) -> str:
    """
    Record audio from the microphone until the user presses Enter.
    
    Args:
        output_path: Path to save the recorded WAV file.
        max_duration: Maximum recording duration in seconds (safety limit).
    
    Returns:
        Path to the recorded audio file.
    """
    audio = pyaudio.PyAudio()

    stream = audio.open(
        format=FORMAT,
        channels=CHANNELS,
        rate=RATE,
        input=True,
        frames_per_buffer=CHUNK,
    )

    frames = []
    stop_event = threading.Event()

    def listen_for_enter():
        """Background thread to wait for Enter key press."""
        input()
        stop_event.set()

    # Start the listener thread
    listener = threading.Thread(target=listen_for_enter, daemon=True)
    listener.start()

    console.print()
    console.print("  🔴 [bold red]Recording...[/bold red] Press [bold cyan]Enter[/bold cyan] to stop.\n")

    elapsed = 0.0
    try:
        while not stop_event.is_set() and elapsed < max_duration:
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
            elapsed = len(frames) * CHUNK / RATE

            # Print a simple timer
            secs = int(elapsed)
            bar = "█" * min(secs, 50)
            print(f"\r  ⏱  {secs:02d}s  {bar}", end="", flush=True)
    except KeyboardInterrupt:
        pass

    print()  # newline after the timer

    # Cleanup
    stream.stop_stream()
    stream.close()
    audio.terminate()

    if not frames:
        console.print("  [yellow]⚠ No audio recorded.[/yellow]")
        return ""

    # Save to WAV file
    with wave.open(output_path, "wb") as wf:
        wf.setnchannels(CHANNELS)
        wf.setsampwidth(audio.get_sample_size(FORMAT))
        wf.setframerate(RATE)
        wf.writeframes(b"".join(frames))

    duration = round(elapsed, 1)
    console.print(f"  ✅ [green]Recorded {duration}s of audio → [bold]{output_path}[/bold][/green]")
    return output_path
