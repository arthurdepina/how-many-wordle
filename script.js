/* ------------------------------------------------------------------ *
 * how-many-wordle : browser logic
 *
 * The solver is a direct port of wordle_solver.py. The only important
 * function is score(): everything else filters the dictionary or draws
 * the board.
 * ------------------------------------------------------------------ */

/* ---- The solver (mirrors wordle_solver.py) ---------------------- */

// What colour pattern would Wordle show for `guess` if the answer were `answer`?
// Two passes so repeated letters behave exactly like the real game.
function score(guess, answer) {
  const result = ["X", "X", "X", "X", "X"];
  const remaining = {};
  for (const ch of answer) remaining[ch] = (remaining[ch] || 0) + 1;

  // Pass 1: greens, consuming the matched letter from the tally.
  for (let i = 0; i < 5; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "G";
      remaining[guess[i]]--;
    }
  }
  // Pass 2: yellows, only while copies of that letter remain.
  for (let i = 0; i < 5; i++) {
    if (result[i] === "G") continue;
    if (remaining[guess[i]] > 0) {
      result[i] = "Y";
      remaining[guess[i]]--;
    }
  }
  return result.join("");
}

// A candidate is possible if it reproduces every observed feedback.
function isConsistent(candidate, guesses) {
  for (const { word, pattern } of guesses) {
    if (score(word, candidate) !== pattern) return false;
  }
  return true;
}

function possibleWords(guesses) {
  return WORDS.filter((w) => isConsistent(w, guesses));
}

/* ---- Board state & rendering ------------------------------------ */

const COLORS = ["gray", "yellow", "green"]; // click order
const COLOR_CODE = { gray: "X", yellow: "Y", green: "G" };

// Each row: { letters: [..5], colors: [..5] }
let rows = [makeRow(), makeRow()];
let active = { row: 0, col: 0 };

function makeRow() {
  return { letters: ["", "", "", "", ""], colors: ["gray", "gray", "gray", "gray", "gray"] };
}

const boardEl = document.getElementById("board");

function render() {
  boardEl.innerHTML = "";
  rows.forEach((row, r) => {
    const rowEl = document.createElement("div");
    rowEl.className = "row";
    for (let c = 0; c < 5; c++) {
      const tile = document.createElement("div");
      const filled = row.letters[c] !== "";
      tile.className = "tile" + (filled ? " " + row.colors[c] : "");
      if (active.row === r && active.col === c) tile.classList.add("active");
      tile.textContent = row.letters[c];
      tile.addEventListener("click", () => onTileClick(r, c));
      rowEl.appendChild(tile);
    }
    boardEl.appendChild(rowEl);
  });
  compute();
}

function onTileClick(r, c) {
  active = { row: r, col: c };
  const row = rows[r];
  if (row.letters[c] === "") {
    render(); // empty tile: just move the cursor here
    return;
  }
  // Filled tile: cycle its colour.
  const i = COLORS.indexOf(row.colors[c]);
  row.colors[c] = COLORS[(i + 1) % COLORS.length];
  render();
}

/* ---- Keyboard input -------------------------------------------- */

document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "BUTTON") return;
  const key = e.key;

  if (/^[a-zA-Z]$/.test(key)) {
    const row = rows[active.row];
    row.letters[active.col] = key.toLowerCase();
    if (active.col < 4) active.col++;
    render();
    e.preventDefault();
  } else if (key === "Backspace") {
    const row = rows[active.row];
    if (row.letters[active.col] !== "") {
      row.letters[active.col] = "";
    } else if (active.col > 0) {
      active.col--;
      rows[active.row].letters[active.col] = "";
    }
    render();
    e.preventDefault();
  } else if (key === "ArrowLeft") {
    if (active.col > 0) active.col--;
    render();
  } else if (key === "ArrowRight") {
    if (active.col < 4) active.col++;
    render();
  } else if (key === "ArrowUp") {
    if (active.row > 0) active.row--;
    render();
  } else if (key === "ArrowDown") {
    if (active.row < rows.length - 1) active.row++;
    render();
  } else if (key === "Enter") {
    if (active.row < rows.length - 1) {
      active.row++;
      active.col = 0;
    }
    render();
  }
});

/* ---- Compute & show results ------------------------------------ */

const countEl = document.getElementById("count");
const countLabelEl = document.getElementById("countLabel");
const wordgridEl = document.getElementById("wordgrid");
const wordSummaryEl = document.getElementById("wordSummary");

function compute() {
  // Only use rows that are completely filled with a valid word.
  const guesses = [];
  for (const row of rows) {
    if (row.letters.every((l) => l !== "")) {
      guesses.push({
        word: row.letters.join(""),
        pattern: row.colors.map((c) => COLOR_CODE[c]).join(""),
      });
    }
  }

  if (guesses.length === 0) {
    countEl.textContent = WORDS.length.toLocaleString();
    countLabelEl.textContent = "possible words (no clues yet)";
    renderWordList([]);
    return;
  }

  const survivors = possibleWords(guesses);
  countEl.textContent = survivors.length.toLocaleString();
  countLabelEl.textContent =
    survivors.length === 1 ? "possible word" : "possible words";
  renderWordList(survivors);
}

function renderWordList(words) {
  wordgridEl.innerHTML = "";
  const sorted = [...words].sort();
  for (const w of sorted) {
    const span = document.createElement("span");
    span.textContent = w;
    wordgridEl.appendChild(span);
  }
  const n = sorted.length;
  wordSummaryEl.textContent =
    n === 0
      ? "no possible words"
      : `show possible words (${n.toLocaleString()})`;
}

/* ---- Controls -------------------------------------------------- */

document.getElementById("addRow").addEventListener("click", () => {
  if (rows.length < 8) rows.push(makeRow());
  render();
});
document.getElementById("removeRow").addEventListener("click", () => {
  if (rows.length > 1) {
    rows.pop();
    if (active.row >= rows.length) active.row = rows.length - 1;
  }
  render();
});
document.getElementById("reset").addEventListener("click", () => {
  rows = [makeRow(), makeRow()];
  active = { row: 0, col: 0 };
  render();
});

/* ---- Go -------------------------------------------------------- */
render();
