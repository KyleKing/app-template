import pytest
from playwright.sync_api import Page, expect

def test_navigation_works(page: Page):
    """Test that navigation works"""
    page.goto("http://localhost:8081/")

    page.click("text=Alert")
    assert "xss" in page.url
    expect(page.locator("h1")).to_contain_text("xss")