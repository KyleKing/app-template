import os
import pytest
from playwright.sync_api import Page
import subprocess
import time

PORT = "8081"
BASE_URL = f"http://localhost:{PORT}"

@pytest.fixture(scope="session", autouse=True)
def start_server():
    """Start the dev server before tests"""
    if not os.getenv("CI"):
        # Check if server is already running
        try:
            import requests
            response = requests.get(BASE_URL)
            if response.status_code == 200:
                yield
                return
        except:
            pass

    # Start the server
    env = os.environ.copy()
    env["PORT"] = PORT
    process = subprocess.Popen(
        ["deno", "task", "dev"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    # Wait for server to be ready
    import requests
    for _ in range(30):  # Wait up to 30 seconds
        try:
            response = requests.get(BASE_URL)
            if response.status_code == 200:
                break
        except:
            pass
        time.sleep(1)
    else:
        raise Exception("Server failed to start")

    yield

    # Cleanup
    if not os.getenv("CI"):
        process.terminate()
        process.wait()

@pytest.fixture
def console_messages(page: Page):
    """Collect console messages"""
    messages = []
    def handler(msg):
        messages.append(f"{msg.type}: {msg.text}")
    page.on("console", handler)
    yield messages

@pytest.fixture
def console_errors(console_messages):
    """Filter console errors"""
    return [msg for msg in console_messages if msg.startswith("error:")]

@pytest.fixture(autouse=True)
def check_console_errors(console_errors):
    """Fail test if there are console errors"""
    yield
    assert len(console_errors) == 0, f"Console errors: {console_errors}"