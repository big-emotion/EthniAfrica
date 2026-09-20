"""Export every approved board authoring value for test-only page fixtures."""

import argparse
import json
from pathlib import Path

from cases import CASES


HERE = Path(__file__).resolve().parent
DEFAULT_OUTPUT = (
    HERE.parents[4] / "src/lib/search/__fixtures__/feedBoardCases.json"
)


def serialized_cases():
    return json.dumps(CASES, ensure_ascii=False, indent=2) + "\n"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--stdout", action="store_true")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    content = serialized_cases()
    if args.stdout:
        print(content, end="")
        return

    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    main()
