# Theme Audio Files

This directory contains background music for different themes in the Planning Poker application.

## Required Audio Files

Please add the following royalty-free audio files to this directory:

1. `modern-ambient.mp3` - Calm, professional ambient music for the default theme
2. `retro90s-chiptune.mp3` - 90s-style chiptune/8-bit music for the Retro 90s theme
3. `nordic-ambient.mp3` - Minimalist, calm ambient music for the Nordic theme
4. `synthwave-retrowave.mp3` - 80s-inspired synthwave music for the Synthwave theme

## Audio File Requirements

- Format: MP3
- Duration: 2-3 minutes (they will loop automatically)
- File size: Keep under 2MB each for optimal performance
- Volume: Ensure consistent volume levels across all tracks

## Where to Find Royalty-Free Music

You can find suitable royalty-free music from these sources:

1. [Pixabay](https://pixabay.com/music/) - Free music, no attribution required
2. [Free Music Archive](https://freemusicarchive.org/) - Check license requirements
3. [ccMixter](http://ccmixter.org/) - Creative Commons music
4. [Incompetech](https://incompetech.com/music/royalty-free/music.html) - Requires attribution
5. [Bensound](https://www.bensound.com/) - Free with attribution

## Implementation Details

The audio player component automatically selects the appropriate audio file based on the current theme. The audio will loop continuously and can be toggled on/off with the audio control button in the bottom-right corner of the screen.

Each theme has a uniquely styled audio control button that matches its visual aesthetic. 