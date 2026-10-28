# Slide Exercise Generator

A browser-based physics practice tool that shuffles **original presentation slides**. It preserves the exercise wording, numbers, diagrams, and any answers already printed on the slide. It does not invent questions or randomize numerical values.

Features include chapter and exercise-type filters, text search, a shuffle without repeats, back/forward navigation, additional slides for multi-part examples, printing, and working notes saved in browser storage.

## What is included

- `index.html`, `styles.css`, and `app.js`: the responsive interface, with no framework or build step.
- `bank.js`: an empty starter bank, replaced when you run the builder.
- `exercises.json`: a slide-selection index for 336 exercise groups in the 13 PHYS 270 presentations. It contains filenames, titles, and slide numbers, **not the slide images or question text**.
- `build.py`: renders your local PowerPoint files and creates the browser bank.

Course presentations, rendered slide images, and the personal study guide are not included in this public repository. The starter page has no exercises until you build a bank.

## Build the exercise bank

Install Python 3.10 or newer and [LibreOffice](https://www.libreoffice.org/download/download-libreoffice/). LibreOffice is only needed for building, not for hosting or practicing.

```sh
git clone https://github.com/BSafronov-ukr/slide-exercise-generator.git
cd slide-exercise-generator
python -m pip install -r requirements.txt
```

Create a `source` directory and place your presentations inside it. For the provided PHYS 270 selection, the filenames must match the `decks` list in `exercises.json`. Then run:

```sh
python build.py
```

On Windows, if LibreOffice is not on your PATH:

```powershell
python build.py --soffice "C:\Program Files\LibreOffice\program\soffice.exe"
```

The builder produces `bank.js` and `slides/*.jpg`. It renders the original pages instead of reconstructing their equations from extracted text. Open `index.html` in a browser, or serve the folder with:

```sh
python -m http.server 8000
```

Then visit `http://localhost:8000`. No server-side application, API keys, or database is needed. A private offline copy works by keeping the HTML, CSS, JavaScript files, and `slides/` together.

## Host it yourself

Upload `index.html`, `styles.css`, `app.js`, `practice-core.js`, the generated `bank.js`, and the complete `slides` folder to any static web host. The presentations and Python dependencies are not required on the host.

### GitHub Pages

1. Fork this repository.
2. Build your exercise bank locally, then commit and push `bank.js` and `slides/` to your fork.
3. In the fork, open **Settings → Pages**.
4. Choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save.
5. Open the URL GitHub supplies after deployment completes.

The initial repository can be hosted as-is, but it displays an empty bank until you add generated content. A public Pages deployment exposes whatever slides you put in it; the private source files stay excluded by `.gitignore`.

## Use different presentations

Edit `exercises.json` to select the original slides you want to practice. Slide numbers are one-based and refer to file order, not a number printed within the slide.

```json
{
  "decks": [{"id": 1, "name": "My Lecture.pptx"}],
  "exercises": [{
    "deck": 1,
    "title": "Problem 1",
    "type": "Problem",
    "slides": [12, 13]
  }]
}
```

Use `Problem`, `Worked example`, or `Concept check` as the type. The first listed slide appears immediately; remaining slides appear when requested. The Question tab can conceal answer areas with configured percentage rectangles; the Answers tab always shows the original slide unchanged. The builder validates missing files, slide ranges, and duplicate starting slides before writing the bank.

Search uses text stored in the PowerPoint XML. Words contained only in scanned pictures are visible in the images but are not searchable. Browser notes are local to the browser and are not uploaded or shared.

## Two attempts and hidden answers

The Question tab provides a separate labeled answer box for each requested output in a multi-part exercise. Checked numeric keys automatically create one box per value; explicit `answerParts` metadata also covers conceptual parts, symbolic answers, and image-only questions. Feedback appears beside each box, so correct entries can stay while other entries are revised. The two valid submissions apply to the whole exercise. Blank fields, malformed numerical entries, and identical repeated submissions do not use a try. All boxes must be valid before grading feedback is shown. Answers unlock after two attempts, or when every requested part has a checked correct answer. Parts without a checked key are saved for source comparison. Opening the Answers tab remains an explicit choice. Attempts and separate drafts persist when changing filters, shuffling, or reloading. Existing saved comma-separated numeric drafts are migrated into their corresponding boxes. Start a new round from Answers to retry.

83 exercise groups have checked numerical or multiple-choice keys. Numerical checks use 2% rounding tolerance and the units and parts shown beside the input. The other groups record free-text attempts for source comparison; they are never falsely marked wrong. Some source slides provide no separate worked answer; the interface identifies that limit.

Optional fields in `exercises.json`:

- `answerKey`: a checked key (`kind: "numeric"`, `values`, `labels`, tolerances; or `kind: "text"`, `accepted` aliases), plus `display` text for reveal.
- `answerParts`: an ordered list of `{ "label": "Part A — speed (m/s)", "keyIndex": 0 }` objects. `keyIndex` maps a field to its original numeric key index; use `null` for parts requiring source comparison. This supports exercises where only some outputs have verified keys. Include every requested output, splitting quantities within a lettered part when appropriate. Omit this property to derive fields from the numeric key or use a single response box.
- `hiddenRegions`: rectangles in percentages, keyed by the zero-based image index. Each rectangle is `[left, top, width, height]` and conceals a source solution area only in Question view.
- `questionImages`: zero-based indices of prompt slides to show (default `[0]`).
- `removeAnswerLines`: build a question-only text prompt by removing lines labeled Ans. or Answer: when answers are interleaved with the text.

Always check source slides before choosing masks or enabling an automatic key. Multi-part keys should label exactly which quantities are checked. The sample index merges solution-only build slides with their questions.

This is a study aid, not an exam-security system: static keys and source images can be inspected in the downloaded files. No answers or notes are sent to a server. Fonts load from Google Fonts when online; system fallbacks work offline.

## License

The application code is available under the GPL-3.0 license already selected for this repository. Presentation contents retain their existing ownership and are not included under that license.


## Tutoring videos

The page includes 13 topic-organized lessons from The Organic Chemistry Tutor, covering vectors through oscillations. Each link opens the official YouTube video in a new tab. No player, video thumbnail, or YouTube script loads before a visitor chooses a link. Internet access is needed to watch; exercise practice still works offline. The tutorials have independent examples and do not change the slide exercise numbers.

`tutoring-videos.json` records the verified titles, official channel, topic fit, and source links. The resource cards are static HTML in `index.html`; edit that section to change the displayed selection. This metadata and the generator code contain no course slide content or study guide.


## Instructor explanation clips and focused review

Save an exercise for review using its star button. The session filter can show saved exercises, previously missed exercises, or exercises with verified instructor clips. Bookmarks, attempts, and notes remain in this browser.

The Answers view can show a problem-specific MP4 after the existing answer gate has unlocked and the user explicitly opens Answers. It loads only after pressing **Load explanation**. Native video controls, replay, and playback speed are provided. Changing exercises removes the previous player. Exercises without a verified recording display an honest unavailable message.

`study-tools.js` implements these features. Include it and `instructor-clips.js` alongside the other scripts when self-hosting. The public clip manifest is empty: instructor recordings, Canvas links, and private timestamp mappings are excluded. Only add recordings you are permitted to use and keep your course deployment private as appropriate. `.gitignore` excludes MP4 files and `lecture-clips/`.

To add your own clips, key `window.INSTRUCTOR_CLIPS.exercises` by the generated exercise ID (shown beside Save for review). Each entry is an array of `{title, recording, startLabel, endLabel, src, canvasUrl}` objects. `src` points to a local trimmed MP4; timestamps describe its location in the original recording. `canvasUrl` is a normal sign-in-protected course page, never an access token or signed media URL. The player uses the trimmed file from its beginning. Playback works offline when the MP4 files are included; the Canvas fallback needs internet access.
