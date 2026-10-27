# Slide Exercise Generator

A browser-based physics practice tool that shuffles **original presentation slides**. It preserves the exercise wording, numbers, diagrams, and any answers already printed on the slide. It does not invent questions or randomize numerical values.

Features include chapter and exercise-type filters, text search, a shuffle without repeats, back/forward navigation, additional slides for multi-part examples, printing, and working notes saved in browser storage.

## What is included

- `index.html`: the complete interface, with no framework or build step.
- `bank.js`: an empty starter bank, replaced when you run the builder.
- `exercises.json`: a slide-selection index for 344 entries in the 13 PHYS 270 presentations. It contains filenames, titles, and slide numbers, **not the slide images or question text**.
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

Then visit `http://localhost:8000`. No server-side application, API keys, or database is needed. A private offline copy works by keeping `index.html`, `bank.js`, and `slides/` together.

## Host it yourself

Upload `index.html`, the generated `bank.js`, and the complete `slides` folder to any static web host. The presentations and Python dependencies are not required on the host.

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

Use `Problem`, `Worked example`, or `Concept check` as the type. The first listed slide appears immediately; remaining slides appear when requested. A slide containing both a prompt and its answer is shown unchanged. The builder validates missing files, slide ranges, and duplicate starting slides before writing the bank.

Search uses text stored in the PowerPoint XML. Words contained only in scanned pictures are visible in the images but are not searchable. Browser notes are local to the browser and are not uploaded or shared.

## License

The application code is available under the GPL-3.0 license already selected for this repository. Presentation contents retain their existing ownership and are not included under that license.

