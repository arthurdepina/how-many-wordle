# how-many-wordle

Given the Wordle guesses you've made and the colours the game showed you
(green / yellow / gray), figure out **how many words could still be the answer**
— and, if you want to peek, which ones.

Live site: enable GitHub Pages (see below) and it runs entirely in the browser.

## The idea (one function does the work)

Every Wordle rule — including the fiddly one about repeated letters — falls out
of a single function, `score(guess, answer)`, which returns the colour pattern
Wordle *would* show for a guess if a given word were the answer:

```
score("soare", "loose")  ->  "YGXXG"
```

It's computed in two passes:

1. **Greens** — mark exact-position matches and "use up" those letters from a
   tally of the answer's letters.
2. **Yellows** — for the remaining letters, award a yellow only while unused
   copies of that letter are left in the tally; otherwise it stays gray.

That count-based second pass is what makes duplicate letters behave like the
real game (e.g. guessing `SPEED` against `ABIDE` lights up only one `E`).

A word is **still possible** if, for *every* guess you made, it would have
produced exactly the feedback you actually got:

```python
def is_consistent(candidate, guesses):
    return all(score(g, candidate) == fb for g, fb in guesses)
```

Filter the whole dictionary through that check and you have your answer.

## Python

`wordle_solver.py` contains the fully-commented logic and a small CLI:

```
python wordle_solver.py CLINT XYXXX SOARE YGXXG
#   X = gray, Y = yellow, G = green
```

For the real game on 2026-08-15 (answer `LOOSE`), after `CLINT` and `SOARE`
there were **three** possibilities: `LOOSE`, `LOUSE`, `LOWSE`.

## The website

- `index.html` / `style.css` / `script.js` — the interactive board. `script.js`
  is a direct port of the Python solver.
- `words.js` — the dictionary as a JS array, generated from `words.txt`.

Type letters into a row, click tiles to cycle their colour, and the count
updates live. The possible-words list is hidden behind a click.

Styling loosely follows [The Monospace Web](https://owickstrom.github.io/the-monospace-web/).

## Word list

`words.txt` / `words.js` come from the
[dracos valid-wordle-words list](https://gist.github.com/dracos/dd0668f281e685bad51479e5acaadb93)
(14,855 words). To regenerate `words.js` after editing `words.txt`:

```
python -c "import json; print('const WORDS='+json.dumps(open('words.txt').read().split())+';\nif(typeof module!==\"undefined\")module.exports=WORDS;')" > words.js
```

## Deploy to GitHub Pages

Everything is static, served from the repo root:

1. Push this repo to GitHub.
2. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*,
   Branch = `main`, folder = `/ (root)`.
3. The site appears at `https://<user>.github.io/how-many-wordle/`.

`.nojekyll` is included so the files are served as-is.
