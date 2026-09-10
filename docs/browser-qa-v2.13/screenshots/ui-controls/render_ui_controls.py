
from pathlib import Path
import importlib.util
from playwright.sync_api import sync_playwright

root = Path("/mnt/data/research-methods-studio-v2.13-student-guided-flow-redesign")
qa_script = root / "docs/browser-qa-v2.13/run_browser_qa_v2.13.py"

spec = importlib.util.spec_from_file_location("qa_v213", qa_script)
qa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qa)

out = root / "docs/browser-qa-v2.13/screenshots/ui-controls"
out.mkdir(parents=True, exist_ok=True)

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path="/usr/bin/chromium",
        headless=True,
        args=["--no-sandbox", "--disable-gpu"]
    )
    page = browser.new_page(viewport={"width": 1440, "height": 950})
    page.set_content(qa.inline_app(qa.seed_stage10()), wait_until="load")
    page.wait_for_timeout(250)

    # Current stage highlighted in the persistent route.
    box = page.locator(".sidebar").bounding_box()
    page.screenshot(
        path=str(out / "01-current-stage-route.png"),
        clip={
            "x": max(0, box["x"] - 10),
            "y": max(0, box["y"] - 10),
            "width": min(430, box["width"] + 35),
            "height": min(880, box["height"] + 20),
        }
    )

    # Help menu.
    page.click("#helpMenuBtn")
    page.wait_for_timeout(150)
    box = page.locator("#unifiedHelpBackdrop .unified-help-modal").bounding_box()
    page.screenshot(
        path=str(out / "02-help-button-open.png"),
        clip={
            "x": max(0, box["x"] - 20),
            "y": max(0, box["y"] - 20),
            "width": min(1440, box["width"] + 40),
            "height": min(950, box["height"] + 40),
        }
    )
    page.click("#closeUnifiedHelp")
    page.wait_for_timeout(100)

    # More menu.
    page.click("#moreMenuBtn")
    page.wait_for_timeout(150)
    box = page.locator("#moreBackdrop .more-menu-modal").bounding_box()
    page.screenshot(
        path=str(out / "03-more-button-open.png"),
        clip={
            "x": max(0, box["x"] - 20),
            "y": max(0, box["y"] - 20),
            "width": min(1440, box["width"] + 40),
            "height": min(950, box["height"] + 40),
        }
    )
    page.click("#closeMore")
    page.wait_for_timeout(100)

    # Full viewport context.
    page.screenshot(path=str(out / "04-controls-in-context.png"), full_page=False)

    browser.close()

print("Rendered:")
for p in sorted(out.glob("*.png")):
    print(p.name, p.stat().st_size)
