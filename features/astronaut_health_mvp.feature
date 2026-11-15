Feature: Astronaut Health & Autonomous Medical Contingency Platform (NASA Space Apps MVP)
  As a NASA Space Apps Challenge Judge
  I want to verify that the dashboard simulates realistic multi-environment spaceflight physiology,
  enforces NASA-STD-3001 clinical thresholds, supports offline telemetry, and enables autonomous
  crew medical decision-making when the Crew Medical Officer (CMO) is incapacitated.

  Background:
    Given the astronaut health dashboard is open at "http://localhost:5173"
    And mission telemetry is reset to the clean seeded state
    And the active mission day is set to Day 30 in the "LEO_ISS" environment

  # ---------------------------------------------------------------------------
  # PILLAR 1: MULTI-ENVIRONMENT PHYSIOLOGICAL SIMULATION & 30-DAY TRAJECTORIES
  # ---------------------------------------------------------------------------
  @simulation @environments
  Scenario: Fleet triage reflects distinct baseline and degraded astronaut profiles in LEO_ISS
    When I view the Crew Medical Officer fleet triage dashboard
    Then "Cmdr. Elena Vance" should have an overall status of "nominal" across all 5 physiological systems
    And "Maj. Marcus Chen" should flag a "caution" alert in "neuro_ocular" with hyperopic shift at least "+0.50 D"
    And "Dr. Aris Thorne" should flag a "caution" alert in "musculoskeletal" with cumulative BMD loss above "3.0%"
    And "Dr. Maya Lin" should exhibit multi-system degradation with a "critical" triage status

  @simulation @environments
  Scenario Outline: Switching mission environments updates both underlying telemetry curves and risk scores
    Given I select crew member "Dr. Aris Thorne"
    When I switch the mission environment to "<environment>"
    Then the active environment indicator should display "<environment>"
    And the "musculoskeletal" system score should be "<expected_msk_score>" with status "<expected_status>"
    And the "radiation_immune" cumulative dose readout should reflect "<dose_pattern>"
    And the sparkline trend charts should re-render with "<environment>" trajectory values

    Examples:
      | environment   | expected_msk_score | expected_status | dose_pattern |
      | LEO_ISS       | 46                 | critical        | 12.0 mSv     |
      | LUNAR_SURFACE | 57                 | caution         | 15.0 mSv     |
      | MARS_TRANSIT  | 33                 | critical        | 45.0 mSv     |

  @simulation @timeline
  Scenario: Scrubbing mission days from Day 1 to Day 30 demonstrates progressive microgravity adaptation
    Given I select crew member "Maj. Marcus Chen"
    And the mission environment is set to "MARS_TRANSIT"
    When I scrub the mission timeline to Day 1
    Then the "neuro_ocular" system status should be "nominal"
    When I scrub the mission timeline to Day 30
    Then the "neuro_ocular" system status should degrade to "caution" or "critical"
    And the sparkline charts should plot 30 longitudinal data points

  # ---------------------------------------------------------------------------
  # PILLAR 2: CLOSED-LOOP COUNTERMEASURE RECOVERY & LOCALSTORAGE PERSISTENCE
  # ---------------------------------------------------------------------------
  @countermeasures @persistence
  Scenario: Executing countermeasures lifts a degraded system back to nominal and persists across reloads
    Given I select crew member "Maj. Marcus Chen"
    And the mission environment is set to "LEO_ISS"
    When I open the anatomical drill-down modal for "neuro_ocular"
    Then the initial "neuro_ocular" score should be below 75 with status "caution"
    And I should see actionable countermeasures including "MiniOCT" and "LBNP"
    When I check all recommended countermeasures for "neuro_ocular"
    Then the "neuro_ocular" adjusted score should increase to at least 75 with status "nominal"
    And the checked countermeasure items should remain visible and editable in the modal
    When I reload the browser page
    And I select crew member "Maj. Marcus Chen" and open the "neuro_ocular" modal
    Then the countermeasures for Day 30 should remain checked in localStorage
    And the "neuro_ocular" score should remain at least 75

  # ---------------------------------------------------------------------------
  # PILLAR 3: NASA-STD-3001 CLOSED-HABITAT ATMOSPHERIC TRIGGERS (ECLSS)
  # ---------------------------------------------------------------------------
  @eclss @nasa-standards
  Scenario Outline: Elevated cabin CO2 and cabin hypoxia trigger NASA-STD-3001 alerts across systems
    Given I select crew member "Cmdr. Elena Vance"
    When I set cabin CO2 to <co2_ppm> ppm and cabin O2 to <o2_pct> percent
    Then the "<target_system>" system should transition to "<expected_status>"
    And the clinical trigger text should reference "<citation_fragment>"

    Examples:
      | co2_ppm | o2_pct | target_system        | expected_status | citation_fragment |
      | 4100    | 20.9   | neuro_ocular         | caution         | V2 6004           |
      | 6000    | 20.9   | behavioral_circadian | critical        | OCHMO-TB-004      |
      | 2400    | 19.0   | cardiovascular       | caution         | V2 6003           |
      | 2400    | 16.8   | cardiovascular       | critical        | 17.1% O2          |

  # ---------------------------------------------------------------------------
  # PILLAR 4: LIVE & OFFLINE SPACE WEATHER FALLBACK RESILIENCE
  # ---------------------------------------------------------------------------
  @space-weather @offline
  Scenario: Dashboard degrades gracefully to cached OSDR RadLab telemetry when offline
    Given external requests to NASA DONKI and NOAA SWPC are blocked to simulate deep-space blackout
    When I reload the browser page
    Then the space weather telemetry badge should indicate offline cached mode with Kp "2.3"
    And the application should render at full interactivity without console errors

  @space-weather @contingency
  Scenario: Major Solar Particle Event (SPE/CME) forces radiation storm-shelter protocol
    Given I select crew member "Cmdr. Elena Vance"
    And the mission environment is set to "MARS_TRANSIT"
    When I trigger a simulated "MAJOR_SPE_CME" solar storm event
    Then the "radiation_immune" system should drop to "critical"
    And the primary countermeasure should instruct relocating to the "water-wall storm shelter"

  # ---------------------------------------------------------------------------
  # PILLAR 5: "CMO INCAPACITATED" AUTONOMOUS SELF-ASSESSMENT WORKFLOW
  # ---------------------------------------------------------------------------
  @autonomy @cmo-contingency
  Scenario: Non-CMO crew member unlocks CMO-restricted protocols when CMO is incapacitated
    Given I select crew member "Cmdr. Elena Vance"
    And the "CMO Incapacitated" contingency override is OFF
    When I open the Guided Assessment modal
    Then protocols marked as requiring CMO supervision should be locked
    When I close the Guided Assessment modal and toggle "CMO Incapacitated" ON
    And I open the Guided Assessment modal again
    Then all CMO-restricted diagnostic protocols should be unlocked for autonomous crew execution
    When I complete the "HemoCue Fingerstick WBC" protocol with a reading of "3.2"
    Then "Cmdr. Elena Vance" telemetry for Day 30 should update WBC to "3.2"
    And her "radiation_immune" system should immediately flag abnormal leukocyte status
    And the newly logged assessment should persist after a browser reload

  # ---------------------------------------------------------------------------
  # PILLAR 6: ANATOMICAL BODYMAP INTERACTION & DATA RESET
  # ---------------------------------------------------------------------------
  @ui @bodymap
  Scenario Outline: Clicking each of the 5 anatomical BodyMap hotspots opens the matching OrganModal
    Given I select crew member "Dr. Maya Lin"
    When I click the "<system_id>" anatomical hotspot on the BodyMap
    Then the OrganModal should open for "<system_id>"
    And it should display a numeric triage score, clinical summary, and at least one sparkline

    Examples:
      | system_id            |
      | neuro_ocular         |
      | cardiovascular       |
      | musculoskeletal      |
      | behavioral_circadian |
      | radiation_immune     |
