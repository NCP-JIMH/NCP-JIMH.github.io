# features/environment.py
from playwright.sync_api import sync_playwright


def before_all(context):
    context.playwright = sync_playwright().start()
    headless = context.config.userdata.getbool("headless", True)
    context.browser = context.playwright.chromium.launch(headless=headless)


def before_scenario(context, scenario):
    context.context = context.browser.new_context(viewport={"width": 1440, "height": 900})
    context.page = context.context.new_page()
    context.console_errors = []
    context.page.on(
        "pageerror",
        lambda err: context.console_errors.append(str(err)),
    )


def after_scenario(context, scenario):
    context.page.close()
    context.context.close()


def after_all(context):
    context.browser.close()
    context.playwright.stop()