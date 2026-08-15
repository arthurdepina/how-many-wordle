"""
how-many-wordle : Wordle possibility counter
============================================

Given the guesses you have already made and the colour feedback Wordle gave you
(green / yellow / gray), this module tells you which words are still possible and,
therefore, *how many* possible answers remain.

The whole thing rests on ONE idea, explained in `score()` below. Everything else
is bookkeeping.

Run it as a script:

    python wordle_solver.py CLINT XYXXX SOARE YGXXG

    # X = gray  (letter not in the word)
    # Y = yellow (letter in the word, wrong position)
    # G = green  (letter in the word, right position)

...and it prints how many words are still possible (and lists them).
"""

from collections import Counter


# --------------------------------------------------------------------------- #
# 1. The one important function: what feedback would Wordle give?
# --------------------------------------------------------------------------- #
def score(guess: str, answer: str) -> str:
    """
    Return the colour pattern Wordle *would* show if you guessed `guess` and the
    real answer were `answer`. The pattern is a 5-char string of G / Y / X.

    Why build it this way?
    ---------------------
    The naive rule "green if same position, else yellow if the letter appears
    anywhere, else gray" is WRONG whenever a letter is repeated. Wordle only
    hands out as many yellows/greens for a letter as there are copies of that
    letter in the answer. Example: guessing SPEED against ABIDE — there is only
    one E in ABIDE, so only ONE of the two E's in SPEED can light up.

    The correct algorithm is a two-pass count:

      Pass 1 (greens): mark exact-position matches and "use up" those letters
                       from a running tally of the answer's letters.
      Pass 2 (yellows): for the leftover letters, award a yellow only if a copy
                        of that letter is still un-used in the tally; otherwise
                        it stays gray.

    This mirrors exactly what the real game does, so we never have to special-
    case duplicate letters anywhere else in the program.
    """
    result = ["X"] * 5
    # A tally of the letters still "available" in the answer.
    remaining = Counter(answer)

    # Pass 1: greens. Consume the matched letter from the tally.
    for i in range(5):
        if guess[i] == answer[i]:
            result[i] = "G"
            remaining[guess[i]] -= 1

    # Pass 2: yellows, but only while copies of that letter remain.
    for i in range(5):
        if result[i] == "G":
            continue
        if remaining[guess[i]] > 0:
            result[i] = "Y"
            remaining[guess[i]] -= 1
        # else: it stays "X" (gray)

    return "".join(result)


# --------------------------------------------------------------------------- #
# 2. Is a candidate word consistent with everything I've seen?
# --------------------------------------------------------------------------- #
def is_consistent(candidate: str, guesses: list[tuple[str, str]]) -> bool:
    """
    A candidate answer is "still possible" if, for EVERY guess you made, the
    feedback that candidate would have produced matches the feedback you
    actually got.

    guesses is a list of (guess_word, feedback_pattern) pairs, e.g.
        [("clint", "XYXXX"), ("soare", "YGXXG")]

    Because `score()` already models duplicate letters correctly, this single
    equality check handles every Wordle rule for free.
    """
    for guess, feedback in guesses:
        if score(guess, candidate) != feedback:
            return False
    return True


# --------------------------------------------------------------------------- #
# 3. Filter the whole dictionary down to the survivors.
# --------------------------------------------------------------------------- #
def possible_words(guesses: list[tuple[str, str]], word_list: list[str]) -> list[str]:
    """Return every word in `word_list` consistent with all the guesses."""
    return [w for w in word_list if is_consistent(w, guesses)]


# --------------------------------------------------------------------------- #
# 4. Helpers for loading the dictionary and running from the command line.
# --------------------------------------------------------------------------- #
def load_words(path: str = "words.txt") -> list[str]:
    with open(path, encoding="utf-8") as f:
        return [line.strip().lower() for line in f if line.strip()]


def _normalise(guess: str, feedback: str) -> tuple[str, str]:
    guess = guess.strip().lower()
    feedback = feedback.strip().upper()
    if len(guess) != 5 or len(feedback) != 5:
        raise ValueError(f"guess and feedback must be 5 chars: {guess!r} {feedback!r}")
    if any(c not in "GYX" for c in feedback):
        raise ValueError(f"feedback must only contain G/Y/X: {feedback!r}")
    return guess, feedback


def main(argv: list[str]) -> None:
    # argv is a flat list: GUESS1 FEEDBACK1 GUESS2 FEEDBACK2 ...
    if not argv or len(argv) % 2 != 0:
        print(__doc__)
        return

    guesses = [_normalise(argv[i], argv[i + 1]) for i in range(0, len(argv), 2)]
    words = load_words()
    survivors = possible_words(guesses, words)

    print(f"Guesses given: {len(guesses)}")
    for g, fb in guesses:
        print(f"  {g.upper()}  {fb}")
    print(f"\n{len(survivors)} possible word(s) remain.\n")
    # Print in columns so it's readable even when there are many.
    for i, w in enumerate(sorted(survivors)):
        end = "\n" if (i + 1) % 8 == 0 else "  "
        print(w, end=end)
    print()


if __name__ == "__main__":
    import sys

    main(sys.argv[1:])
