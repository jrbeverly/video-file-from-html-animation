# Video "Recording" from HTML Page

Renders the existing 60-second Kiro "Starting Soon" HTML animation to MP4, headlessly and without real-time playback.

The experiment is mostly a proof of a larger presentation pipeline: generate narration + timestamped transcript separately, then use those timestamps to drive a pre-built HTML presentation. Animations, transitions, emphasis, and other visual changes happen against the narration timeline; final output rendered directly to video.

The existing Kiro starting screen was used as a convenient test fixture rather than building another presentation specifically for the experiment.

## Run

Requires Node.js 20+ and FFmpeg.

```sh
npm install
npm run render
```

Produces `starting-soon.mp4` at 1920×1080, 30 fps.

## Preview

<video src="./docs/preview.mp4" controls loop muted playsinline width="720"></video>

[preview.mp4](./docs/preview.mp4) (60s, 1280×720, ~2 MB)

## Notes

- Every frame rendered from an explicit timeline timestamp. No dependency on wall-clock playback or capture-machine performance.
- Chromium WebCodecs produces H.264 frames. FFmpeg muxes into MP4 without re-encoding.
- Source presentation copied into the experiment. No runtime dependency on the original project.
- Useful separation starting to emerge: narration defines timing; HTML defines visual behaviour; renderer samples deterministic output.
- Audio could be generated independently. Transcript timestamps become presentation cues rather than trying to infer animation timing from audio during rendering.
- Likely input shape: audio + timestamped words/sentences/sections + HTML presentation + cue metadata.
- Presentation does not need to run in real time. Can seek directly to arbitrary timestamps and render frame N.
- Possibly explore breaking these things up into smaller videos, then combining into a single one (think: Demos/recordings being stitched in)
- Opens up much slower/more expensive rendering techniques. Capture speed no longer tied to video duration.
- Existing web animation techniques remain usable. No separate video-animation system required.
- Potentially interesting for AI-generated presentations: generate narration first, establish timing, then modify visual state against known speech boundaries.
- Pauses probably matter as much as words. Useful cue points for transitions, diagrams, reveals, camera movement, or holding on a visual.
- Main unknown is authoring. Need some sane mapping between transcript events and presentation state without turning the HTML into a pile of timestamp-specific conditionals.
- Another unknown: whether generated narration + generated timing + generated visual cues actually compose into something good, or merely produce synchronized slop.
- Current test only establishes deterministic HTML → video rendering. Narration-driven orchestration still theoretical.
