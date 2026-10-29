import tomllib
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def requirement_lines(path: Path) -> set[str]:
    lines = (line.strip() for line in path.read_text().splitlines())
    return {line for line in lines if line and not line.startswith("#")}


class DependencyManifestTests(unittest.TestCase):
    def test_every_requirements_file_matches_pyproject(self) -> None:
        # Render installs requirements.txt, CI installs pyproject: they must not drift apart.
        project = tomllib.loads((ROOT / "backend" / "pyproject.toml").read_text())
        declared = set(project["project"]["dependencies"])
        for path in (ROOT / "requirements.txt", ROOT / "backend" / "requirements.txt"):
            with self.subTest(file=str(path.relative_to(ROOT))):
                self.assertEqual(requirement_lines(path), declared)

    def test_declared_python_floor_is_the_deployed_runtime(self) -> None:
        # render.yaml pins the production interpreter; the project must support it.
        render = (ROOT / "render.yaml").read_text()
        deployed = next(
            line.split(":", 1)[1].strip()
            for line in render.splitlines()
            if "value:" in line and line.split(":", 1)[1].strip()[:2] == "3."
        )
        floor = tomllib.loads((ROOT / "backend" / "pyproject.toml").read_text())[
            "project"
        ]["requires-python"]
        major_minor = tuple(int(p) for p in deployed.split(".")[:2])
        self.assertIn(f">={major_minor[0]}.{major_minor[1]}", floor.replace(" ", ""))


if __name__ == "__main__":
    unittest.main()
