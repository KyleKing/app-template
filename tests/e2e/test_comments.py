import pytest
import time
from playwright.sync_api import Page, expect

def test_comment_demo_works(page: Page):
    """Test that the comment demo works with optimistic updates"""
    page.goto("http://localhost:8081/comments")
    expect(page.locator("h1")).to_contain_text("Comments")

    # Check that HTMX is loaded
    htmx_loaded = page.evaluate("typeof window.htmx !== 'undefined'")
    assert htmx_loaded is True

    # Wait for comments list to load
    page.wait_for_selector("#comments-list li")

    test_author = "Test User"
    test_body = "This is a test comment for optimistic replacement"

    # Fill in the form
    page.fill("#author", test_author)
    page.fill("#body", test_body)

    # Note: Network interception for delay simulation removed for simplicity
    # In a full implementation, you would use page.route() here

    # Submit the form
    page.click('button[type="submit"]')

    # Check optimistic update
    optimistic_comment = page.locator(".c-comment--optimistic")
    expect(optimistic_comment.locator('[data-field="author"]')).to_contain_text(test_author)
    expect(optimistic_comment.locator('[data-field="body"]')).to_contain_text(test_body)
    expect(optimistic_comment.locator('[data-field="time"]')).to_contain_text("(sending…)")

    # Wait for optimistic update to be replaced
    page.wait_for_selector(".c-comment--optimistic", state="detached")

    # Verify the comment was added
    comments_list = page.locator("#comments-list")
    first_comment = comments_list.locator("li").first
    expect(first_comment.locator('[data-field="author"]')).to_contain_text(test_author)
    expect(first_comment.locator('[data-field="body"]')).to_contain_text(test_body)
    expect(first_comment.locator('[data-field="time"]')).not_to_contain_text("(sending…)")