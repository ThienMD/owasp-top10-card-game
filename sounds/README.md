# Sound Effects Guide

The game supports sound effects for various game events. Download free sounds and place them here.

## How to Add Sounds

1. **Download free sounds** from one of these sites (no signup required):
   - [Zapsplat](https://www.zapsplat.com/) - Huge free library
   - [Freesound](https://freesound.org/) - Community sounds
   - [BBC Sound Effects](https://sound-effects.bbcrewind.co.uk/) - High quality
   - [Pixabay](https://pixabay.com/sound-effects/) - Royalty-free

2. **Recommended Sounds to Download**:
   - `coin-flip.mp3` - Coin toss sound (search: "coin flip" or "coins")
   - `attack.mp3` - Impact/hit sound (search: "impact" or "punch")
   - `defend.mp3` - Shield/protection sound (search: "magic" or "shield")
   - `damage.mp3` - Damage/whoosh sound (search: "hit" or "whoosh")
   - `win.mp3` - Victory/bell sound (search: "victory" or "bells")
   - `lose.mp3` - Failure sound (search: "error" or "sad")

3. **Or use the download script** (macOS/Linux):
   ```bash
   chmod +x download-sounds.sh
   ./download-sounds.sh
   ```

4. **Audio Requirements**:
   - Format: MP3, WAV, or OGG
   - Duration: 0.5 - 2 seconds (shorter is better)
   - Quality: 128kbps or higher

## Current Sound Support

The game will automatically play sounds for:
- Coin flip animation
- Attack action
- Defend action
- Damage on assets
- Win condition
- Lose condition

Sounds are optional - the game works fine without them!
