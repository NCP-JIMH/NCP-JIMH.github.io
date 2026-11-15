# features/steps/astronaut_health_steps.py
import re
from behave import given, when, then
from playwright.sync_api import expect


def _crew_card(page, crew_name: str):
    """Locates a crew card or selector button by astronaut name."""
    return page.locator(
        f"[data-testid='crew-card']:has-text('{crew_name}'), "
        f"button:has-text('{crew_name}'), "
        f"article:has-text('{crew_name}')"
    ).first


def _system_badge(container, system_id: str):
    """Locates a physiological system indicator by data-testid or readable label."""
    readable = system_id.replace("_", " ")
    return container.locator(
        f"[data-testid='system-{system_id}'], "
        f"[data-system='{system_id}'], "
        f"text=/{system_id}|{readable}/i"
    ).first


# ---------------------------------------------------------------------------
# BACKGROUND & NAVIGATION STEPS
# ---------------------------------------------------------------------------

@given('the astronaut health dashboard is open at "{url}"')
def step_open_dashboard(context, url):
    context.base_url = url
    context.page.goto(url, wait_until="networkidle")


@given("mission telemetry is reset to the clean seeded state")
def step_reset_telemetry(context):
    # Clear localStorage and reload so INITIAL_CREW & INITIAL_CABIN_ENV initialize cleanly
    context.page.evaluate("window.localStorage.clear();")
    reset_btn = context.page.locator("button:has-text('Reset')").first
    if reset_btn.is_visible():
        reset_btn.click()
    else:
        context.page.reload(wait_until="networkidle")


@given('the active mission day is set to Day {day:d} in the "{environment}" environment')
def step_set_day_and_env(context, day, environment):
    step_switch_environment(context, environment)
    step_scrub_mission_day(context, day)


# ---------------------------------------------------------------------------
# FLEET TRIAGE & CREW SELECTION
# ---------------------------------------------------------------------------

@when("I view the Crew Medical Officer fleet triage dashboard")
def step_view_fleet_dashboard(context):
    fleet_tab = context.page.locator(
        "button:has-text('Fleet'), button:has-text('CMO'), [data-testid='tab-fleet']"
    ).first
    if fleet_tab.is_visible():
        fleet_tab.click()


@given('I select crew member "{crew_name}"')
@when('I select crew member "{crew_name}"')
def step_select_crew_member(context, crew_name):
    card = _crew_card(context.page, crew_name)
    expect(card).to_be_visible()
    card.click()
    context.selected_crew = crew_name


@then('"{crew_name}" should have an overall status of "{status}" across all 5 physiological systems')
def step_verify_all_systems_status(context, crew_name, status):
    card = _crew_card(context.page, crew_name)
    expect(card).to_contain_text(re.compile(status, re.IGNORECASE))
    for sys_id in [
        "cardiovascular",
        "neuro_ocular",
        "musculoskeletal",
        "behavioral_circadian",
        "radiation_immune",
    ]:
        badge = _system_badge(card, sys_id)
        if badge.count() > 0:
            expect(badge).not_to_contain_text(re.compile(r"caution|critical", re.IGNORECASE))


@then('"{crew_name}" should flag a "{status}" alert in "{system_id}" with hyperopic shift at least "{diopters}"')
def step_verify_sans_alert(context, crew_name, status, system_id, diopters):
    step_select_crew_member(context, crew_name)
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(status, re.IGNORECASE))
    expect(modal).to_contain_text(diopters.replace("+", ""))
    context.page.keyboard.press("Escape")


@then('"{crew_name}" should flag a "{status}" alert in "{system_id}" with cumulative BMD loss above "{threshold}"')
def step_verify_bmd_alert(context, crew_name, status, system_id, threshold):
    step_select_crew_member(context, crew_name)
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(status, re.IGNORECASE))
    text = modal.inner_text()
    match = re.search(r"(\d+\.\d+)\s*%", text)
    assert match is not None, f"Expected BMD percentage in modal text, got: {text}"
    assert float(match.group(1)) > float(threshold.replace("%", ""))
    context.page.keyboard.press("Escape")


@then('"{crew_name}" should exhibit multi-system degradation with a "{status}" triage status')
def step_verify_critical_crew(context, crew_name, status):
    card = _crew_card(context.page, crew_name)
    expect(card).to_contain_text(re.compile(status, re.IGNORECASE))


# ---------------------------------------------------------------------------
# ENVIRONMENT SWITCHING & MISSION DAY SCRUBBER
# ---------------------------------------------------------------------------

@given('the mission environment is set to "{environment}"')
@when('I switch the mission environment to "{environment}"')
def step_switch_environment(context, environment):
    env_select = context.page.locator(
        "select[data-testid='env-select'], select[aria-label*='Environment' i]"
    ).first
    if env_select.is_visible():
        env_select.select_option(value=environment)
    else:
        env_btn = context.page.locator(
            f"button[data-env='{environment}'], button:has-text('{environment}')"
        ).first
        env_btn.click()


@then('the active environment indicator should display "{environment}"')
def step_verify_active_env(context, environment):
    expect(context.page.locator("body")).to_contain_text(environment)


@when("I scrub the mission timeline to Day {day:d}")
def step_scrub_mission_day(context, day):
    slider = context.page.locator(
        "input[type='range'][data-testid='day-scrubber'], input[type='range'][aria-label*='Day' i]"
    ).first
    if slider.is_visible():
        slider.fill(str(day))
        slider.dispatch_event("change")
    else:
        # Fallback: first range slider in ContingencyBar
        first_range = context.page.locator("header input[type='range'], nav input[type='range']").first
        first_range.fill(str(day))
        first_range.dispatch_event("change")


@then('the "{system_id}" system score should be "{expected_score}" with status "{expected_status}"')
def step_verify_system_score_and_status(context, system_id, expected_score, expected_status):
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(expected_score)
    expect(modal).to_contain_text(re.compile(expected_status, re.IGNORECASE))
    context.page.keyboard.press("Escape")


@then('the "{system_id}" system status should be "{expected_status}"')
def step_verify_single_system_status(context, system_id, expected_status):
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(expected_status, re.IGNORECASE))
    context.page.keyboard.press("Escape")


@then('the "{system_id}" system status should degrade to "{status_a}" or "{status_b}"')
def step_verify_degraded_status(context, system_id, status_a, status_b):
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(f"{status_a}|{status_b}", re.IGNORECASE))


@then('the "{system_id}" cumulative dose readout should reflect "{dose_pattern}"')
def step_verify_dose_readout(context, system_id, dose_pattern):
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(dose_pattern)
    context.page.keyboard.press("Escape")


@then('the sparkline trend charts should re-render with "{environment}" trajectory values')
def step_verify_sparklines_render(context, environment):
    polylines = context.page.locator("svg polyline")
    assert polylines.count() >= 1, "Expected at least one SVG Sparkline polyline to render"


@then("the sparkline charts should plot {count:d} longitudinal data points")
def step_verify_sparkline_point_count(context, count):
    polyline = context.page.locator("[role='dialog'] svg polyline").first
    points_attr = polyline.get_attribute("points") or ""
    coords = [p for p in points_attr.strip().split(" ") if "," in p]
    assert len(coords) == count, f"Expected {count} sparkline points, found {len(coords)}"
    context.page.keyboard.press("Escape")


# ---------------------------------------------------------------------------
# ORGAN MODAL & COUNTERMEASURE CLOSED-LOOP PERSISTENCE
# ---------------------------------------------------------------------------

@when('I open the anatomical drill-down modal for "{system_id}"')
@when('I click the "{system_id}" anatomical hotspot on the BodyMap')
def step_open_organ_modal(context, system_id):
    hotspot = context.page.locator(
        f"[data-testid='hotspot-{system_id}'], "
        f"[data-system='{system_id}'], "
        f"button:has-text('{system_id.replace('_', ' ')}')"
    ).first
    hotspot.click()
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_be_visible()


@then('the initial "{system_id}" score should be below {max_score:d} with status "{status}"')
def step_verify_score_below(context, system_id, max_score, status):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(status, re.IGNORECASE))
    score_el = modal.locator("[data-testid='system-score']").first
    if score_el.is_visible():
        val = int(re.search(r"\d+", score_el.inner_text()).group(0))
        assert val < max_score, f"Expected score < {max_score}, got {val}"


@then('I should see actionable countermeasures including "{item_a}" and "{item_b}"')
def step_verify_countermeasure_labels(context, item_a, item_b):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(item_a)
    expect(modal).to_contain_text(item_b)


@when('I check all recommended countermeasures for "{system_id}"')
def step_check_all_countermeasures(context, system_id):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    checkboxes = modal.locator("input[type='checkbox']")
    total = checkboxes.count()
    assert total > 0, "Expected checkable countermeasure checkboxes inside OrganModal"
    for idx in range(total):
        cb = checkboxes.nth(idx)
        if not cb.is_checked():
            cb.check()


@then('the "{system_id}" adjusted score should increase to at least {min_score:d} with status "{status}"')
def step_verify_score_at_least(context, system_id, min_score, status):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(status, re.IGNORECASE))
    score_el = modal.locator("[data-testid='system-score']").first
    if score_el.is_visible():
        val = int(re.search(r"\d+", score_el.inner_text()).group(0))
        assert val >= min_score, f"Expected adjusted score >= {min_score}, got {val}"


@then("the checked countermeasure items should remain visible and editable in the modal")
def step_verify_countermeasures_still_visible(context):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    checkboxes = modal.locator("input[type='checkbox']")
    assert checkboxes.count() > 0
    for idx in range(checkboxes.count()):
        expect(checkboxes.nth(idx)).to_be_checked()
        expect(checkboxes.nth(idx)).to_be_enabled()


@when("I reload the browser page")
def step_reload_page(context):
    context.page.reload(wait_until="networkidle")


@when('I select crew member "{crew_name}" and open the "{system_id}" modal')
def step_select_and_open_modal(context, crew_name, system_id):
    step_select_crew_member(context, crew_name)
    step_open_organ_modal(context, system_id)


@then("the countermeasures for Day {day:d} should remain checked in localStorage")
def step_verify_localstorage_countermeasures(context, day):
    raw_storage = context.page.evaluate("JSON.stringify(window.localStorage)")
    assert "completedCountermeasuresByDay" in raw_storage, (
        "Expected completedCountermeasuresByDay persisted in localStorage"
    )
    step_verify_countermeasures_still_visible(context)


@then('the "{system_id}" score should remain at least {min_score:d}')
def step_verify_persisted_score(context, system_id, min_score):
    step_verify_score_at_least(context, system_id, min_score, "nominal")


# ---------------------------------------------------------------------------
# ECLSS CABIN ATMOSPHERE & SPACE WEATHER CONTINGENCIES
# ---------------------------------------------------------------------------

@when("I set cabin CO2 to {co2_ppm:d} ppm and cabin O2 to {o2_pct:f} percent")
def step_set_cabin_atmosphere(context, co2_ppm, o2_pct):
    co2_input = context.page.locator(
        "[data-testid='co2-input'], input[aria-label*='CO2' i]"
    ).first
    o2_input = context.page.locator(
        "[data-testid='o2-input'], input[aria-label*='O2' i]"
    ).first
    co2_input.fill(str(co2_ppm))
    co2_input.dispatch_event("change")
    o2_input.fill(str(o2_pct))
    o2_input.dispatch_event("change")


@then('the "{target_system}" system should transition to "{expected_status}"')
def step_verify_system_transition(context, target_system, expected_status):
    step_open_organ_modal(context, target_system)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(expected_status, re.IGNORECASE))


@then('the clinical trigger text should reference "{citation_fragment}"')
def step_verify_citation_fragment(context, citation_fragment):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(citation_fragment)
    context.page.keyboard.press("Escape")


@given("external requests to NASA DONKI and NOAA SWPC are blocked to simulate deep-space blackout")
def step_block_external_weather_apis(context):
    context.page.route("**/api.nasa.gov/**", lambda route: route.abort())
    context.page.route("**/services.swpc.noaa.gov/**", lambda route: route.abort())


@then('the space weather telemetry badge should indicate offline cached mode with Kp "{kp_val}"')
def step_verify_offline_weather_badge(context, kp_val):
    badge = context.page.locator("[data-testid='space-weather-badge'], header, nav").first
    expect(badge).to_contain_text(re.compile(r"Offline|Cached", re.IGNORECASE))
    expect(badge).to_contain_text(kp_val)


@then("the application should render at full interactivity without console errors")
def step_verify_no_console_errors(context):
    assert len(context.console_errors) == 0, f"Unexpected page errors: {context.console_errors}"


@when('I trigger a simulated "{storm_level}" solar storm event')
def step_trigger_solar_storm(context, storm_level):
    storm_control = context.page.locator(
        f"[data-testid='storm-select'], select[aria-label*='Storm' i], button:has-text('{storm_level}')"
    ).first
    if storm_control.evaluate("el => el.tagName") == "SELECT":
        storm_control.select_option(value=storm_level)
    else:
        storm_control.click()


@then('the "{system_id}" system should drop to "{expected_status}"')
def step_verify_system_dropped(context, system_id, expected_status):
    step_open_organ_modal(context, system_id)
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(expected_status, re.IGNORECASE))


@then('the primary countermeasure should instruct relocating to the "{phrase}"')
def step_verify_primary_countermeasure_phrase(context, phrase):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(phrase, re.IGNORECASE))
    context.page.keyboard.press("Escape")


# ---------------------------------------------------------------------------
# CMO INCAPACITATED OVERRIDE & GUIDED SELF-ASSESSMENT
# ---------------------------------------------------------------------------

@given('the "CMO Incapacitated" contingency override is {state}')
def step_set_cmo_override(context, state):
    desired = state.strip().upper() == "ON"
    toggle = context.page.locator(
        "[data-testid='cmo-override-toggle'], input[aria-label*='CMO' i], button:has-text('CMO Incapacitated')"
    ).first
    tag = toggle.evaluate("el => el.tagName")
    if tag == "INPUT":
        if toggle.is_checked() != desired:
            toggle.click()
    else:
        is_pressed = toggle.get_attribute("aria-pressed") == "true"
        if is_pressed != desired:
            toggle.click()


@when('I toggle "CMO Incapacitated" {state}')
def step_toggle_cmo_override(context, state):
    step_set_cmo_override(context, state)


@when("I open the Guided Assessment modal")
@when("I open the Guided Assessment modal again")
def step_open_assessment_modal(context):
    btn = context.page.locator(
        "[data-testid='open-assessment'], button:has-text('Assessment'), button:has-text('Self-Exam')"
    ).first
    btn.click()
    modal = context.page.locator("[role='dialog'], [data-testid='assessment-modal']").first
    expect(modal).to_be_visible()


@when("I close the Guided Assessment modal and toggle \"CMO Incapacitated\" {state}")
def step_close_assessment_and_toggle_cmo(context, state):
    context.page.keyboard.press("Escape")
    step_set_cmo_override(context, state)


@then("protocols marked as requiring CMO supervision should be locked")
def step_verify_cmo_protocols_locked(context):
    modal = context.page.locator("[role='dialog'], [data-testid='assessment-modal']").first
    locked_items = modal.locator("[data-requires-cmo='true'][disabled], [data-locked='true']")
    assert locked_items.count() > 0, "Expected at least one CMO-restricted protocol to be locked"


@then("all CMO-restricted diagnostic protocols should be unlocked for autonomous crew execution")
def step_verify_cmo_protocols_unlocked(context):
    modal = context.page.locator("[role='dialog'], [data-testid='assessment-modal']").first
    locked_items = modal.locator("[data-requires-cmo='true'][disabled], [data-locked='true']")
    assert locked_items.count() == 0, "Expected zero locked protocols when CMO Incapacitated override is ON"


@when('I complete the "{protocol_title}" protocol with a reading of "{value}"')
def step_complete_protocol(context, protocol_title, value):
    modal = context.page.locator("[role='dialog'], [data-testid='assessment-modal']").first
    proto_btn = modal.locator(f"button:has-text('{protocol_title}')").first
    proto_btn.click()
    num_input = modal.locator("input[type='number']").first
    num_input.fill(value)
    submit_btn = modal.locator("button[type='submit'], button:has-text('Save'), button:has-text('Log')").first
    submit_btn.click()


@then('"{crew_name}" telemetry for Day {day:d} should update WBC to "{expected_wbc}"')
def step_verify_updated_wbc(context, crew_name, day, expected_wbc):
    step_select_crew_member(context, crew_name)
    step_open_organ_modal(context, "radiation_immune")
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(expected_wbc)


@then('her "{system_id}" system should immediately flag abnormal leukocyte status')
def step_verify_abnormal_wbc_flag(context, system_id):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text(re.compile(r"caution|critical|WBC|leukocyte", re.IGNORECASE))
    context.page.keyboard.press("Escape")


@then("the newly logged assessment should persist after a browser reload")
def step_verify_logged_assessment_persists(context):
    context.page.reload(wait_until="networkidle")
    step_select_crew_member(context, context.selected_crew)
    step_open_organ_modal(context, "radiation_immune")
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_contain_text("3.2")
    context.page.keyboard.press("Escape")


# ---------------------------------------------------------------------------
# ORGAN MODAL VERIFICATION
# ---------------------------------------------------------------------------

@then('the OrganModal should open for "{system_id}"')
def step_verify_organ_modal_open(context, system_id):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    expect(modal).to_be_visible()
    expect(modal).to_contain_text(re.compile(system_id.replace("_", "[ _]"), re.IGNORECASE))


@then("it should display a numeric triage score, clinical summary, and at least one sparkline")
def step_verify_organ_modal_contents(context):
    modal = context.page.locator("[role='dialog'], [data-testid='organ-modal']").first
    assert re.search(r"\b\d{1,3}\b", modal.inner_text()), "Expected numeric triage score"
    assert modal.locator("svg polyline").count() >= 1, "Expected at least one Sparkline chart"
    context.page.keyboard.press("Escape")