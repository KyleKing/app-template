import os
from playwright.sync_api import expect

PORT = "8081"
BASE_URL = f"http://localhost:{PORT}"

def pytest_configure(config):
    config.addinivalue_line("markers", "playwright: mark test to run with playwright")

def pytest_playwright_args():
    return [
        "--browser", "chromium",
        "--headed" if os.getenv("CI") else "--headless",
    ]

def pytest_playwright_config():
    return {
        "testDir": "./tests/e2e",
        "fullyParallel": True,
        "forbidOnly": bool(os.getenv("CI")),
        "retries": 2 if os.getenv("CI") else 0,
        "workers": 1 if os.getenv("CI") else None,
        "timeout": 5000,
        "expect": {"timeout": 1000},
        "reporter": "github" if os.getenv("CI") else [["list"], ["html"]],
        "use": {
            "baseURL": BASE_URL,
            "trace": "on-first-retry",
            "javaScriptEnabled": True,
            "screenshot": "only-on-failure",
            "video": "retain-on-failure" if os.getenv("CI") else "off",
        },
        "projects": [
            {
                "name": "chrome",
                "use": {"browserName": "chromium"},
            },
            {
                "name": "firefox",
                "use": {"browserName": "firefox"},
            },
            {
                "name": "iphone",
                "use": {"browserName": "webkit", "device": "iPhone 14"},
            },
        ],
        "webServer": {
            "command": f"PORT={PORT} deno task dev",
            "url": BASE_URL,
            "reuseExistingServer": not bool(os.getenv("CI")),
            "timeout": 30000,
        },
    }