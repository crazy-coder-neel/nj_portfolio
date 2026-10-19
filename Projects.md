NyayaSaathi : live link:https://nayaya-saathi.vercel.app/ (Nyaya saathi is the main name dont use justice grid)
# JusticeGrid — Engineering Reference PRD
> AI-Augmented Legal Intelligence for India's Undertrial Crisis  
> **Stack:** FastAPI · Supabase · Ollama (Llama 3 + Mistral 7B) · Bhashini API · React + Vite · Twilio

---

## The Core Idea

India has **4,34,302 undertrials** — people in prison without conviction. Section 479 BNSS already says: *release them if they've served half their maximum sentence*. The law exists. The intelligence layer to apply it at scale does not.

JusticeGrid gives one paralegal (managing 200 cases) the awareness of a team of ten.  
**The AI does not make decisions. It surfaces the right case, to the right person, at the right moment.**

---

## What Makes This Different

Most teams will ask an LLM "is this person eligible for bail?" — which is unauditable and hallucination-prone.

**JusticeGrid separates two concerns:**

| Concern | How We Handle It | Why |
|---|---|---|
| Eligibility computation | Deterministic SQL rule engine | Zero hallucination risk. Fully auditable. |
| Language / explanation | Ollama (Llama 3) | LLMs are good at unstructured text extraction and plain-language generation |
| Court behaviour scoring | **Computed from the bail dataset** | Historical patterns, not guesses |

This hybrid (neuro-symbolic) approach: *Garcez et al. (2022), Neural-Symbolic Cognitive Reasoning.*

---

## Why Rule-Based AND Dataset — Answering the Key Question

> *"If eligibility is rule-based, what is the dataset actually for?"*

The rule engine answers: **"Is this person legally eligible?"** — a binary legal determination.  
The dataset answers three completely different questions:

| Question | Rule-Based? | Dataset-Driven? | Why |
|---|---|---|---|
| Is this person eligible under Section 479 BNSS? | ✅ Yes — pure rule | ❌ Not needed | The law is deterministic. Doesn't need history. |
| Which case should the paralegal look at first? | Partially | ✅ Yes — court history | Priority score needs real adjournment rates per court, which come from historical outcomes in the dataset |
| How likely is tomorrow's hearing to adjourn? | Partially | ✅ Yes — per-court patterns | Can't know court X adjourns 78% of BA cases without historical data |
| Which charge sections drive the longest detention? | ❌ | ✅ Yes — aggregate analysis | Systemic insight only visible across thousands of cases |
| Is our eligibility rule correctly calibrated? | ❌ | ✅ Yes — ground truth | `Mapped_Bail` lets us validate: do cases flagged ELIGIBLE actually result in bail? |

**The rule engine is the spine. The dataset is what makes the spine intelligent about the real world.**

---

## What Each Dataset Column Powers

```
UNDER_SECTIONS (e.g. "394||34||439")
  → Parsed on ingest → charges table (extraction_source: DATASET, confidence: 1.0)
  → Joined against ipc_sections.csv → max_sentence_years parsed from Punishment column
  → Also: validates our ipc_sections lookup (which sections appear most in real bail cases?)

PENDING_DAYS
  → Direct input to eligibility rule: pending_days >= threshold_days?
  → Also: Pillar 4 heatmap — avg detention by charge section

HEARING_COUNT + NATURE_OF_DISPOSAL + NATURE_OF_DISPOSAL_BINARY
  → Compute per-court adjournment rate → courts.adj_rate_90d
  → This rate directly feeds the adjournment scorer (F4) and priority scorer (F2)

COURT_NAME + NJDG_JUDGE_NAME
  → Builds court behaviour profiles in courts table
  → Adjournment scorer groups by court+judge combination

CURRENT_STAGE (e.g. "FOR ADMISSION - FRESH")
  → Signals case maturity — input to priority scorer's action_availability signal

Mapped_Bail (REGULAR BAIL / ANTICIPATORY BAIL / etc.)
  → Ground truth validation label — stored but never used in rule logic
  → Post-ingest: do cases our engine marks ELIGIBLE actually result in bail?
  → Measures false positive/negative rate; used to tune bnss_lookup values

DISPOSAL_DAYS
  → courts.median_bail_days — how long does this court take to decide?
  → Pillar 4: which courts have worst bail-decision intervals?

DATE_FILED + DECISION_DATE
  → Fallback for detention_start when prison records unavailable
  → detention_start = DATE_FILED as proxy

POLICE_STATION
  → District-level proxy for geographic surety analysis
  → Links to district_wages table for surety affordability check

YEAR + DISPOSAL_YEAR
  → Temporal trend analysis: is undertrial detention improving over time?
  → Pillar 4 systemic patterns
```

---

## Additional Data Needed

| Data | Source | How to get it | Powers |
|---|---|---|---|
| Max sentence per IPC section | IPC schedule | `backend/datasets/ipc_sections.csv` — contains Description, Offense, Punishment, and Section columns for ~500+ IPC sections with full text. Punishment column parsed to extract max_sentence_years. | **Core eligibility rule** |
| FIR full text / Chargesheet | eCourts / manual upload | PDF upload → pytesseract OCR → Ollama NER. Also provides `detention_start` date from chargesheet. | Charge extraction when UNDER_SECTIONS is empty + detention start date |
| District median daily wage | Paralegal input | Entered by paralegal per case via the UI (district wage for the accused's area) | Surety affordability check (F5) |
| Court holiday calendar | Court notifications | `backend/datasets/court_holiday.csv` — Date, Holiday_Name, Day, Category, Is_Closed columns | Adjournment scorer (F4) |
| Detention start date | FIR / Chargesheet | Extracted from FIR/chargesheet by paralegal or OCR; DATE_FILED used as proxy when unavailable | More precise eligibility calculation |
| Surety execution status | Paralegal input | Paralegal marks whether accused has been released on surety via UI | Surety gap detection (F5) |

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                 │
│                                                                      │
│  Bail Dataset CSV ───────────────────────────────────────────────┐  │
│  (UNDER_SECTIONS, PENDING_DAYS, COURT_NAME,                      │  │
│   HEARING_COUNT, NATURE_OF_DISPOSAL, Mapped_Bail...)             │  │
│                                                                   │  │
│  FIR / Chargesheet PDF Upload → pytesseract OCR                  │  │
│  Paralegal Input → detention_start, district_wage, surety status │  │
│  Static CSVs: ipc_sections.csv, court_holiday.csv                │  │
│                          ↓ ingest_pipeline.py                    │  │
└──────────────────────────────────────────────────────────────────┴──┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                       SUPABASE (Postgres)                           │
│                                                                      │
│  cases ──── charges ──── ipc_sections (static CSV)                  │
│    │                                                                 │
│    ├── hearings ──────── courts (adj_rate computed from dataset)    │
│    ├── sureties ──────── district_wage (paralegal input per case)   │
│    ├── audit_log (INSERT-only RLS)                                  │
│    └── family_notifications                                          │
│                                                                      │
│  Supabase Edge Function (daily cron)                                │
│    → re-runs eligibility for all PENDING cases                      │
│    → recomputes courts.adj_rate_90d from hearings table             │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                  INTELLIGENCE ENGINES (FastAPI)                     │
│                                                                      │
│  F1 Eligibility Engine  → pure rules (ipc_sections + SQL)           │
│  F2 Priority Scorer     → weighted formula + dataset court rates    │
│  F3 FIR NER             → Ollama / Mistral 7B (only if needed)      │
│  F4 Adjournment Scorer  → rule weights + dataset-derived court rate │
│  F5 Surety Analyser     → rules + paralegal-input wage data         │
│  F6 Translation         → Bhashini API                             │
│  Summaries/Briefs       → Ollama (Llama 3)                          │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────────────────┐
│                         INTERFACES                                  │
│  React PWA  →  Paralegal queue + UTRC dashboard                     │
│  Twilio WhatsApp  →  Family status notifications                    │
│  Twilio IVR + Bhashini TTS  →  Voice (zero-literacy)               │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### `cases`
```sql
id                  UUID PRIMARY KEY
cnr_number          TEXT UNIQUE           -- from dataset
case_number         TEXT
case_type           TEXT                  -- BA, CBA, etc.
court_id            UUID REFERENCES courts(id)
person_id           UUID REFERENCES persons(id)
prison_id           UUID REFERENCES prisons(id)
detention_start     DATE                  -- from FIR/chargesheet (paralegal input); fallback = DATE_FILED
date_filed          DATE
pending_days        INT                   -- from dataset; recalculated daily by cron
under_sections      TEXT[]                -- parsed from "394||34||439"
under_acts          TEXT[]                -- parsed from "IPC||CrPC"
fir_text            TEXT                  -- raw OCR output (nullable)
is_first_offender   BOOLEAN               -- determines 1/3 vs 1/2 threshold
eligibility_status  ENUM(ELIGIBLE, NOT_YET, FLAGGED_LAWYER, IDENTITY_CONFLICT, STALE)
eligibility_score   FLOAT                 -- 0-1
priority_score      FLOAT                 -- 0-1 composite
priority_reason     TEXT                  -- Ollama Llama 3 one-liner
data_staleness      BOOLEAN DEFAULT FALSE
last_evaluated_at   TIMESTAMPTZ
hearing_count       INT                   -- from dataset
current_stage       TEXT
current_status      TEXT                  -- Disposed / Pending
mapped_bail         TEXT                  -- ground truth from dataset (validation only, never used in rules)
```

### `charges`
```sql
id                    UUID PRIMARY KEY
case_id               UUID REFERENCES cases(id)
section_code          TEXT               -- e.g. "IPC_394" (matches ipc_sections.csv Section column)
max_sentence_years    FLOAT              -- parsed from ipc_sections.csv Punishment column
is_life_imprisonment  BOOLEAN
is_death_penalty      BOOLEAN
extraction_source     ENUM(DATASET, FIR_NLP, MANUAL)
extraction_confidence FLOAT              -- 1.0 if from dataset; model score if NLP
```

### `hearings`
```sql
id                  UUID PRIMARY KEY
case_id             UUID REFERENCES cases(id)
scheduled_date      DATE
outcome             ENUM(ADJOURNED, BAILED, CONVICTED, ACQUITTED, PENDING)
adjournment_score   FLOAT               -- computed at insert
consecutive_adj     INT
chargesheet_filed   BOOLEAN
```
> For existing dataset cases, hearings rows are constructed from `HEARING_COUNT` + `NATURE_OF_DISPOSAL_BINARY`. Each case gets N synthetic hearing rows where the last one carries the disposal outcome.

### `courts` *(seeded from dataset, updated by cron)*
```sql
id                       UUID PRIMARY KEY
name                     TEXT             -- from COURT_NAME
district                 TEXT
state                    TEXT
adj_rate_90d             FLOAT            -- ADJOURNED count / total hearings (from dataset)
median_bail_days         FLOAT            -- avg DISPOSAL_DAYS from dataset
historical_hearing_count INT              -- sample size — always shown in UI
```

### `sureties`
```sql
id                  UUID PRIMARY KEY
case_id             UUID REFERENCES cases(id)
amount_inr          FLOAT
bail_granted_date   DATE
executed            BOOLEAN DEFAULT FALSE
district_daily_wage FLOAT               -- entered by paralegal at case creation
surety_days_income  FLOAT               -- amount_inr / district_daily_wage
reduction_brief     TEXT                -- Ollama Llama 3 generated, NULL until triggered
```

### `audit_log` *(INSERT-only via RLS)*
```sql
id              UUID PRIMARY KEY
case_id         UUID
event_type      TEXT      -- ELIGIBILITY_COMPUTED | ACTION_TAKEN | OVERRIDE | STALE_FLAGGED
data_snapshot   JSONB     -- full case state at event time
reasoning_chain TEXT      -- human-readable rule trace
confidence      FLOAT
actor_id        UUID      -- paralegal or system
timestamp       TIMESTAMPTZ DEFAULT now()
```

### Static Reference Tables *(loaded from CSV, rarely mutate)*
```
ipc_sections.csv:   Section → Description, Offense, Punishment
                    ~500+ IPC sections with full legal text.
                    Punishment column parsed to extract max_sentence_years, is_life, is_death.
                    Validated against UNDER_SECTIONS distribution in bail dataset.

district_wages:     NOT a static table — entered per case by paralegal via UI.
                    Stored in sureties.district_daily_wage.

court_holiday.csv:  Date, Holiday_Name, Day, Category, Is_Closed
                    Covers national holidays, religious holidays, and vacation periods.
                    Is_Closed = 1 (fully closed), 0.5 (reduced hours / vacation period).
```

---

## Ingest Pipeline

```python
# ingest_pipeline.py — run once on CSV upload, then incrementally for new data
def ingest_bail_csv(filepath):
    df = pd.read_csv(filepath)

    for _, row in df.iterrows():
        # 1. Parse pipe-delimited charges
        sections = parse_sections(row["UNDER_SECTIONS"])  # "394||34||439" → ["394","34","439"]
        acts     = parse_sections(row["UNDER_ACTS"])      # "IPC||CrPC"    → ["IPC","CrPC"]

        # 2. Upsert case
        case = upsert_case({
            "cnr_number":     row["CNR_NUMBER"],
            "court_name":     row["COURT_NAME"],
            "date_filed":     parse_date(row["DATE_FILED"]),
            "pending_days":   row["PENDING_DAYS"],
            "hearing_count":  row["HEARING_COUNT"],
            "current_stage":  row["CURRENT_STAGE"],
            "current_status": row["CURRENT_STATUS"],
            "mapped_bail":    row["Mapped_Bail"],      # stored for validation, NOT used in rules
            "under_sections": sections,
            "under_acts":     acts,
            "detention_start": parse_date(row["DATE_FILED"])  # proxy until paralegal enters actual date from FIR/chargesheet
        })

        # 3. Insert charges — join ipc_sections.csv for sentence metadata
        for section in sections:
            lookup = ipc_sections.get(normalise_section(section, acts))
            insert_charge({
                "case_id":             case.id,
                "section_code":        section,
                "max_sentence_years":  parse_punishment(lookup.Punishment) if lookup else None,
                "is_life_imprisonment": "life" in lookup.Punishment.lower() if lookup else False,
                "extraction_source":   "DATASET",
                "extraction_confidence": 1.0 if lookup else 0.5  # 0.5 = section not in ipc_sections.csv yet
            })

        # 4. Update court statistics from disposal data
        upsert_court_stats(
            court_name   = row["COURT_NAME"],
            disposed     = row["NATURE_OF_DISPOSAL_BINARY"],
            disposal_days= row["DISPOSAL_DAYS"]
        )
        # → increments courts.adj_rate_90d and courts.median_bail_days

        # 5. Run eligibility immediately — writes result + audit_log entry
        run_eligibility(case.id)

# Validation run (after ingest) — uses Mapped_Bail as ground truth
def validate_eligibility_engine():
    disposed_bail = cases.where(mapped_bail="REGULAR BAIL", current_status="Disposed")
    precision = count(disposed_bail.eligibility_status == "ELIGIBLE") / len(disposed_bail)
    print(f"Precision against ground truth: {precision:.1%}")
    # If precision is low → ipc_sections.csv Punishment parsing needs adjustment
```

---

## Feature Specs

---

### F1 — Eligibility Engine *(Rule-Based, Not ML)*

**Input:** `cases.pending_days` + `charges` table joined with `ipc_sections.csv`  
**Output:** `eligibility_status`, `eligibility_score`, reasoning chain → `audit_log`

```python
def compute_eligibility(case_id):
    case    = get_case(case_id)
    charges = get_charges(case_id)   # ipc_sections already joined

    # Hard stop 1: life/death penalty → always lawyer review
    if any(c.is_life_imprisonment or c.is_death_penalty for c in charges):
        return log_result(case_id, Status.FLAGGED_LAWYER, 1.0,
            "Life/death penalty charge — mandatory lawyer review")

    # Hard stop 2: low NLP confidence on charge data
    min_conf = min(c.extraction_confidence for c in charges)
    if min_conf < 0.6:
        return log_result(case_id, Status.FLAGGED_LAWYER, min_conf,
            f"Charge confidence {min_conf:.0%} — lawyer review required")

    # Use MOST CONSERVATIVE charge (longest sentence = hardest threshold to clear)
    max_sentence = max(c.max_sentence_years for c in charges if c.max_sentence_years)
    threshold    = 1/3 if case.is_first_offender else 1/2
    threshold_days = max_sentence * 365 * threshold

    if case.pending_days >= threshold_days:
        return log_result(case_id, Status.ELIGIBLE, min_conf,
            f"Served {case.pending_days}d ≥ {threshold_days:.0f}d "
            f"({threshold:.0%} of {max_sentence}yr max sentence)")

    days_remaining = threshold_days - case.pending_days
    return log_result(case_id, Status.NOT_YET, min_conf,
        f"{days_remaining:.0f} days until {threshold:.0%} threshold")
```

---

### F2 — Priority Scorer *(Uses Dataset-Derived Court Rates)*

**Why the dataset matters here:** `court.adj_rate_90d` and `court.median_bail_days` are computed from `NATURE_OF_DISPOSAL` grouped by `COURT_NAME` during ingest. Without the dataset, these would be guesses.

```python
def priority_score(case):
    court = get_court(case.court_id)

    eligibility_signal = {
        "ELIGIBLE":       1.0,
        "FLAGGED_LAWYER": 0.8,
        "NOT_YET":        max(0, 1 - (days_until_eligible(case) / 90)),
        "STALE":          0.0
    }[case.eligibility_status]

    days_to_hearing = (case.next_hearing_date - today).days if case.next_hearing_date else 30
    time_signal     = max(0, 1 - (days_to_hearing / 30))

    action_signal   = 1.0 if (case.lawyer_assigned and case.documents_present) else 0.4

    # ← This is what the dataset provides: real historical court behaviour
    court_signal    = 1 - court.adj_rate_90d   # high adj rate → low priority signal

    score = (0.35 * eligibility_signal +
             0.25 * time_signal +
             0.25 * action_signal +
             0.15 * court_signal)

    confidence = count_non_null([case.next_hearing_date, court.adj_rate_90d,
                                 case.lawyer_assigned, case.documents_present]) / 4

    reason = ollama_reason(case, score, court)  # Llama 3 one-line natural language
    return score, confidence, reason
```

---

### F3 — FIR Charge Extraction via Ollama *(Only When Needed)*

**When invoked:** Only when `cases.under_sections` is empty (missing in dataset) OR an FIR PDF is manually uploaded.  
**Not invoked:** For the main bail dataset — `UNDER_SECTIONS` already provides structured charge data with confidence 1.0.

```python
PROMPT = """
Extract all IPC and BNSS section numbers from this FIR text.
Return ONLY a JSON array. Example: ["IPC 302", "IPC 34", "BNSS 103"]
If a section is unclear, add ? suffix: ["IPC 302?"]
FIR TEXT: {fir_text}
"""

def extract_charges_from_fir(fir_text):
    response  = ollama.chat(model="mistral",
                            messages=[{"role": "user", "content": PROMPT.format(fir_text=fir_text)}])
    raw       = parse_json_safely(response)
    validated = []
    for section in raw:
        uncertain = section.endswith("?")
        code      = section.rstrip("?")
        in_lookup = ipc_sections.get(code)
        confidence = 0.9 if (in_lookup and not uncertain) else (0.5 if in_lookup else 0.3)
        validated.append({"section": code, "confidence": confidence, "source": "FIR_NLP"})
    return validated
```

---

### F4 — Adjournment Scorer *(Rule Weights + Dataset Court Rates)*

**Dataset contribution:** `court.adj_rate_90d` (the 0.40 weight signal) comes directly from `NATURE_OF_DISPOSAL` in the CSV. The other signals are rule-based.

```python
def adjournment_score(case, hearing_date):
    court = get_court(case.court_id)

    score = (
        0.40 * court.adj_rate_90d +                           # ← FROM DATASET
        0.25 * min(case.consecutive_adj / 5, 1.0) +          # ← hearings table history
        0.20 * (0 if case.chargesheet_filed else 1.0) +      # ← hearings.chargesheet_filed
        0.10 * is_near_holiday(hearing_date) +              # ← court_holiday.csv
        0.05 * (1 if hearing_date.weekday() == 4 else 0)     # ← Friday effect
    )

    sample_note    = f"Based on {court.historical_hearing_count} hearings at this court"
    low_confidence = court.historical_hearing_count < 10
    return score, sample_note, low_confidence
```

**UI trigger:** If `adj_score > 0.75` AND another case has `time_signal > 0.8`:  
→ *"This hearing has a 78% adjournment history (47 cases) — consider prioritising Case X instead."*

---

### F5 — Surety Gap Analyser

```python
def check_surety_gap():
    stale = supabase.table("sureties")
               .select("*, cases(*)")
               .eq("executed", False)
               .lt("bail_granted_date", today - timedelta(days=14))
               .execute()

    for s in stale:
        s.surety_days_income = s.amount_inr / s.district_daily_wage
        if s.surety_days_income > 90:  # > 90 days wages = structurally unaffordable
            s.reduction_brief = generate_section_440_brief(s)  # Ollama Llama 3
        supabase.update(s)

# Ollama Llama 3 prompt
"""
Generate a Section 440 BNSS surety reduction application in formal legal English.
Case: {case_summary}. Surety: ₹{amount} ({days_income:.0f} days of income at ₹{daily_wage}/day).
District: {district}. Legal basis: Section 440 BNSS.
Output: 3 paragraphs. Label: DRAFT — FOR LAWYER REVIEW ONLY.
"""
```

---

### F6 — Multilingual Layer (Bhashini)

```python
def translate(text, source_lang, target_lang):
    payload = {"pipelineTasks": [{"taskType": "translation", "config": {
                  "language": {"sourceLanguage": source_lang, "targetLanguage": target_lang}}}],
               "inputData": {"input": [{"source": text}]}}
    return bhashini_call(payload)

def text_to_speech(text, lang, gender="female"):
    payload = {"pipelineTasks": [{"taskType": "tts", "config": {
                  "language": {"sourceLanguage": lang}, "gender": gender}}],
               "inputData": {"input": [{"source": text}]}}
    return bhashini_call(payload)  # returns audio base64

# Name normalisation across portal transliterations
def is_same_person(name_a, name_b):
    sim = Levenshtein.ratio(name_a.lower(), name_b.lower())
    if sim > 0.92: return "MATCH"
    if sim > 0.75: return "POSSIBLE_MATCH_REVIEW"  # never auto-merge
    return "NO_MATCH"
```

---

### F7 — Paralegal Interface

```
┌──────────────────────────────────────────────────────┐
│  My Cases — 12 Need Action                           │
├──────────────────────────────────────────────────────┤
│  🔴 RAJAN SHARMA · BA-1971-2011         Score: 0.91  │
│     Eligible since 3 Jan · Hearing in 2 days         │
│     Court adj rate: 23% (based on 47 hearings)       │
│     [ View Details ]  [ Record Action ]              │
├──────────────────────────────────────────────────────┤
│  🟡 AMIT PATIL · BA-1970-2011           Score: 0.61  │
│     12 days until eligible · ⚠ Low charge confidence │
│     [ View Details ]                                 │
└──────────────────────────────────────────────────────┘
```

**Case detail shows:**
- Charge sections (source: DATASET or FIR_NLP) + max sentence from ipc_sections.csv
- Rule trace: `pending_days (423) ≥ threshold_days (182) → ELIGIBLE`
- Recommended action: FILE_BAIL / ASSIGN_LAWYER / SURETY_REDUCTION / FLAG_REVIEW
- Hearing history, adjournment pattern, sample size ("based on 47 hearings")

**Offline mode:** `localStorage` caches current queue JSON. Reads work offline. Writes sync on reconnect.

---

### F8 — UTRC Dashboard *(Systemic Intelligence from Dataset)*

```sql
-- 1. Prison eligibility density
SELECT prison_id, COUNT(*) as eligible_count,
       array_agg(DISTINCT section_code) as top_charges
FROM cases JOIN charges ON cases.id = charges.case_id
WHERE eligibility_status = 'ELIGIBLE'
GROUP BY prison_id ORDER BY eligible_count DESC;

-- 2. Court adjournment rates (computed from dataset on ingest)
SELECT court_name, adj_rate_90d, median_bail_days, historical_hearing_count
FROM courts ORDER BY adj_rate_90d DESC;

-- 3. Charge section → avg detention (Pillar 4 systemic insight — only possible from dataset)
SELECT section_code, AVG(pending_days) as avg_detention, COUNT(*) as case_count
FROM charges JOIN cases ON charges.case_id = cases.id
GROUP BY section_code ORDER BY avg_detention DESC LIMIT 20;

-- 4. Surety unaffordability by district
SELECT district, AVG(surety_days_income) as avg_days_income,
       COUNT(*) FILTER (WHERE surety_days_income > 90) as unaffordable_count
FROM sureties JOIN cases ON sureties.case_id = cases.id
GROUP BY district;
```

---

### F9 — Family Notifications

```python
def notify_family(case_id, event_type):
    family = get_family_contact(case_id)
    if not family: return

    summary = ollama.chat(model="llama3",
        messages=[{"role": "system", "content": "Summarise legal case updates for family members. Never give legal advice. Never predict outcomes."},
                  {"role": "user", "content": f"Event: {event_type}. Case: {case.summary}. 2 plain sentences."}])
    translated = bhashini_translate(summary, "en", family.preferred_language)
    twilio_whatsapp_send(family.phone, translated)
```

**45-day escalation:** Cron checks for cases with status change but no notification in 45 days → alert to paralegal.

---

### F10 — Voice IVR (Zero-Literacy Access)

```
Family calls Twilio number
  → Language menu: 1=Hindi, 2=Bengali, 3=Marathi, 4=Tamil, 5=Telugu
  → "Enter case reference using keypad"
  → FastAPI looks up case by CNR number
  → Ollama Llama 3 generates plain-language English summary
  → Bhashini translates to chosen language
  → Bhashini TTS generates audio
  → Twilio plays audio
  → "Press 1 to hear again. Press * for DLSA helpline."
  → Session ends. No voice input stored.
```

Same audio file also sent as WhatsApp voice note via Twilio.

---

### F11 — Audit Trail & Failure Modes

**INSERT-only audit log:**
```sql
CREATE POLICY "insert_only" ON audit_log FOR INSERT WITH CHECK (true);
-- No UPDATE or DELETE policy = physically impossible to alter history
```

**Three designed failure modes:**

| Failure | Detection | Response |
|---|---|---|
| Data source unavailable | HTTP timeout in ingest job | `data_staleness = TRUE` · Block from eligible queue · Stale banner in UI · No auto-escalation |
| FIR parse confidence < 0.6 | `min(extraction_confidence)` | `FLAGGED_LAWYER` · Excluded from queue · "Charges uncertain — lawyer review" |
| Identity mismatch | Levenshtein 0.75–0.92 | `IDENTITY_CONFLICT` · Never auto-merged · Surfaced to paralegal |

---

## How Everything Links

```
Bail Dataset CSV
    │
    ├─ UNDER_SECTIONS ──────────────→ charges table (confidence 1.0)
    │                                      │
    │                               ipc_sections.csv JOIN
    │                                      │
    ├─ PENDING_DAYS ────────────────→ cases.pending_days
    │                                      │
    ├─ NATURE_OF_DISPOSAL ──────────→ courts.adj_rate_90d ─→ F2 Priority + F4 Adjournment
    │
    ├─ DISPOSAL_DAYS ───────────────→ courts.median_bail_days
    │
    └─ Mapped_Bail ─────────────────→ stored for validation only
                                           │
                                    (post-ingest validation:
                                     does ELIGIBLE match
                                     Mapped_Bail = "REGULAR BAIL"?)
    │
    ▼
F1 Eligibility Engine (on insert + daily cron)
    reads: charges + ipc_sections.csv + cases.pending_days
    writes: eligibility_status → cases
    writes: rule trace → audit_log (INSERT-only)
    │
    ▼
F2 Priority Scorer
    reads: eligibility_status + courts.adj_rate_90d + hearing dates
    writes: priority_score + priority_reason → cases
    │
    ├──────────────────────────────────────┐
    ▼                                      ▼
F7 Paralegal UI (ranked queue)      F8 UTRC Dashboard
                                    (SQL views over dataset)
    │
paralegal records action
    │
    ▼
audit_log INSERT
    │
case status changes
    │
    ├──────────────────┐
    ▼                  ▼
F9 WhatsApp notify  F10 IVR voice
(Bhashini translate) (Bhashini TTS)

─────── Parallel daily crons ───────────────────────────
F3 FIR NER (Ollama) ── only if under_sections is empty / FIR PDF uploaded
F4 Adjournment Scorer ─ uses courts.adj_rate_90d (FROM DATASET) + case signals
F5 Surety Analyser ──── uses paralegal-input district_wage; triggers Ollama Llama 3 Section 440 brief
```

---

## API Endpoints

```
GET  /api/cases/queue?paralegal_id=&lang=hi
     → priority-sorted list: score, one-line reason, eligibility_status, confidence

GET  /api/cases/:cnr/eligibility
     → full rule trace: charges, ipc_sections values, threshold calc, confidence

POST /api/cases/:cnr/action
     body: { action: "BAIL_APPLICATION_FILED"|"DEFERRED"|"OVERRIDE", notes: str }
     → writes to audit_log

GET  /api/utrc/dashboard?district=&prison_id=
     → 4 SQL view results (prison density, court rates, charge heatmap, surety map)

GET  /api/cases/:cnr/surety-brief
     → Section 440 draft (Ollama Llama 3, cached in sureties.reduction_brief)

POST /api/family/optin
     body: { cnr: str, phone: str, language: str }

POST /api/ivr/session
     body: { cnr: str, lang: str }
     → Bhashini TTS audio URL for Twilio to play

GET  /api/audit/:cnr              [supervisor only]
DELETE /api/cases/:cnr/pii        [supervisor only — DPDPA erasure]
```

---

## RBAC (Supabase RLS)

| Role | Can See | Can Write |
|---|---|---|
| `paralegal` | Own assigned cases | `audit_log` (insert), case actions |
| `lawyer` | All cases in district | `cases`, `charges`, `sureties` |
| `coordinator` | Aggregated views only — no PII | Read-only |
| `supervisor` | All cases + audit log | Audit read, PII erasure |

---

## 24-Hour Build Order

| Hours | What to build | Key dependency |
|---|---|---|
| 0–1 | Supabase schema + ingest_pipeline.py for bail CSV + ipc_sections.csv parsing | Everything else depends on this |
| 1–3 | F1 Eligibility engine (rule + audit_log write) | Core differentiator |
| 3–5 | F2 Priority scorer + FastAPI `/cases/queue` | Needs courts.adj_rate_90d from ingest |
| 5–7 | React case queue UI + case detail (rule trace visible) | Needs F1 + F2 |
| 7–9 | F3 Ollama FIR NER + F6 Bhashini translation in UI | Needs Ollama running locally |
| 9–11 | F11 audit_log INSERT-only RLS + 3 failure mode handlers | Judges will probe this |
| 11–13 | F5 Surety gap + Ollama Llama 3 Section 440 brief | Unique feature, easy demo moment |
| 13–15 | F8 UTRC dashboard (4 SQL views + Recharts) | Needs full ingested dataset |
| 15–17 | F9 WhatsApp + F10 Twilio IVR + Bhashini TTS | Needs Twilio account |
| 17–19 | F4 Adjournment scorer + hearing reprioritisation alert in UI | Needs courts table |
| 19–21 | RBAC (Supabase RLS policies for all roles) + DPDPA erasure endpoint | Security layer |
| 21–23 | Mapped_Bail validation run + demo data polish + end-to-end test | — |
| 23–24 | README + architecture diagram + submit | — |

---

## References

**Research:**
- McMahan et al. (2017) — FedAvg. arXiv:1602.05629
- AI4Bharat (2023) — IndicTrans2 (Bhashini backbone). arXiv:2305.16307
- Rudin (2019) — Stop explaining black box ML. *Nature Machine Intelligence*
- Garcez et al. (2022) — Neural-Symbolic Cognitive Reasoning. Springer
- Shukla et al. (2022) — InLegalBERT. arXiv:2209.06049
- Raji et al. (2020) — Closing the AI Accountability Gap. ACM FAccT
- Patel et al. (2012) — Avaaj Otalo (IVR for rural India). CHI 2012
- Liberman et al. (2011) — Extraneous factors in judicial decisions. PNAS

**Legal + Government:**
- BNSS Section 479 — bail thresholds (1/3 first-time, 1/2 repeat)
- BNSS Section 440 — surety reduction
- MGNREGA Wage Notification S.O. 1006(E), MoRD (2024)
- NALSA Annual Report 2022-23 · NJDG Annual Report 2023-24 · DPDPA 2023

**GitHub:**
- [IndianBailJudgments-1200](https://github.com/SnehaDeshmukh28/IndianBailJudgments-1200)
- [NyayaRAG](https://github.com/ShubhamKumarNigam/NyayaRAG)
- [MILDSum](https://github.com/Law-AI/MILDSum)



MedTrack: Explain properly man over there : link - https://github.com/crazy-coder-neel/MedTrack_Final

Zenith : https://github.com/crazy-coder-neel/ZENITH_AI_CODE_EDITOR


Episteme: live link:https://zentrix-liard.vercel.app/login(again proj name is Episteme not zentrix)
# Σ Episteme — The Deterministic Learning Engine

**Tagline:** *A deterministic AI that diagnoses why students fail — and fixes the root cause.*

---

## 🏛️ Project Overview

**Episteme** replaces the uncertainty of "guessing" AI models with a rigorous, clinically-inspired diagnostic engine. While standard LLMs often hallucinate or provide shallow corrections, Episteme uses **Deterministic NLP**, **Fault Tree Analysis (FTA)**, and **Knowledge DAGS** to mathematically identify the cognitive gaps preventing a student from mastering a concept.

**IntelliRev** is the student-facing platform that makes this engine accessible, transforming raw syllabi into structured, adaptive learning paths with zero hallucinations.

---

## 🧠 The Intelligence Stack

### 1. Fault Tree Engine (The "Why")
Every question in our system is backed by a clinical Fault Tree. When a student fails a question, the engine traverses **AND/OR gates** to identify the **Minimal Cut Set** — the exact prerequisite or specific logic point that failed.

### 2. Prerequisite Knowledge DAG
Concepts are stored in a **Directed Acyclic Graph**. If a student fails a "Differential Calculator" problem, the system uses **Blame Backpropagation** to trace the failure back to upstream concepts like "Limit Theorems" or "Basic Algebra."

### 3. IRT Ability Estimation 
Using **Item Response Theory (IRT)**, we estimate a student’s latent ability (θ). Unlike raw scores, θ represents the probability of mastery, allowing the engine to select questions that are perfectly calibrated to the student's edge of knowledge.

### 4. Behavior Tree Sequencer
Our remediation logic is orchestrated by a **Behavior Tree**. It switches between **DRILL**, **REMEDY**, and **ADVANCE** modes based on real-time fatigue metrics and calibration state, ensuring the student stays in the "Flow Zone."

---

## ✨ Features

- **Autonomous Ingestion**: Upload a syllabus (Text/PDF) and the system auto-extracts a 5-day study plan via TF-IDF and NLP.
- **RAG-Powered Smart QA**: Textbook context combined with curated YouTube transcripts ensures answers are grounded in ground-truth facts.
- **Cognitive Consistency Grid**: A GitHub-style activity heatmap that tracks cognitive resonance and learning streaks.
- **Explainable Feedback**: Judges and teachers can see the "Decision Trace" behind every diagnostic result.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Tailwind CSS (Vanilla CSS components), Framer Motion, Recharts.
- **Backend**: FastAPI (Python 3.11), spaCy (POS/NER), NLTK (Summarization), Scikit-Learn (TF-IDF).
- **Core Engine**: `py-trees` (Behavior Trees), Custom FTA Engine, `networkx` (DAG management).
- **Database**: Supabase (PostgreSQL + Auth + Vector Storage).

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase Account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/crazy-coder-neel/zentrix.git
   cd zentrix
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   # Setup .env with SUPABASE_URL, SUPABASE_KEY, and TAVILY_API_KEY
   python app.py
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   # Setup .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   npm run dev
   ```

---

## 🌐 Deployment

- **Frontend**: Targeted for **Vercel** (`frontend/vercel.json` included).
- **Backend**: Optimized for **Render/Docker** (`backend/Dockerfile` included).

---

## 📝 License
Built for the **Codewiser Hackathon**. Copyright © 2026.


AnnadataSaathi : as uk from resume : link: https://annadatasaathi.vercel.app/

SankatSaathi: live link :https://sankat-saathi.vercel.app/landing

# 🚨 SankatSaathi - National Emergency Response System

<div align="center">

![SankatSaathi Logo](frontend/public/logo.jpg)

**Advanced AI-Powered Crisis Management Platform**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/sankatsaathi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)

</div>

## 🌟 Overview

SankatSaathi is a comprehensive emergency response system that leverages AI, real-time data processing, and advanced analytics to provide rapid crisis management solutions. Built for scalability and reliability, it serves as a critical infrastructure for disaster response coordination.

## ✨ Key Features

### 🎯 **Core Capabilities**
- **Real-Time Crisis Monitoring** - Live incident tracking with sub-second latency
- **AI-Powered Severity Assessment** - Intelligent risk analysis and prediction
- **Multi-Language Support** - 5 languages (English, Hindi, Marathi, Tamil, Bengali)
- **Voice Navigation** - Hands-free system control
- **Emergency SOS Integration** - Direct emergency service connectivity
- **Mobile-First Design** - Fully responsive across all devices

### 🤖 **AI & Intelligence**
- **Context-Aware Severity Engine** - Autonomous risk assessment
- **ML Hotspot Detection** - Predictive disaster zone identification
- **AI Resource Recommendation** - Intelligent resource allocation
- **News Intelligence** - Real-time disaster news aggregation
- **Escalation Management** - Automated priority handling

### 🌐 **Advanced Features**
- **3D Earth Visualization** - Interactive global incident mapping
- **Live Telemetry** - Real-time system monitoring
- **Admin Dashboard** - Comprehensive control center
- **Role-Based Access Control** - Secure user management
- **Push Notifications** - Instant alert system
- **Offline Capability** - Service worker integration

## 🏗️ Architecture

### **Frontend** (React + Vite)
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages
│   ├── context/       # React context providers
│   ├── hooks/         # Custom React hooks
│   └── lib/           # Utility libraries
├── public/            # Static assets
└── dist/              # Production build
```

### **Backend** (FastAPI + Python)
```
backend/
├── Feature1/          # Crisis Management
├── Feature2_news/     # News Aggregation
├── Feature3/          # Severity Assessment
├── Feature3_emergency/# Emergency Services
├── Feature4/          # Escalation Management
├── Feature4_multilingual/ # Translation Services
├── Feature5_incidents/# Incident Management
├── Feature5_voice_nav/# Voice Navigation
├── Feature6_ML_Hotspot/# ML Hotspot Detection
├── Feature7_AI_Recommendation/ # AI Recommendations
├── Feature7_Seismic/  # Seismic Monitoring
├── Feature8_AI_Intelligence/ # AI Intelligence
├── Feature9_Resources/# Resource Management
└── Feature_Admin/     # Admin Operations
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.9+
- Firebase account
- API keys (see Environment Variables)

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/sankatsaathi.git
cd sankatsaathi
```

### **2. Backend Setup**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
python app.py
```

### **3. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```

### **4. Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## 🔧 Environment Variables

### **Backend (.env)**
```bash
# Database
FIREBASE_URL=your_firebase_project_url
FIREBASE_KEY=your_firebase_anon_key
FIREBASE_SERVICE_KEY=your_firebase_service_key

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key

# News API
GNEWS_API_KEY=5606f10541654d6fa69afc40ec0f0c99

# Emergency Services (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Push Notifications
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_MAILTO=mailto:your_email@domain.com

# Multilingual Support (Sarvam AI)
SARVAM_API_KEY=your_sarvam_api_key
SARVAM_BASE_URL=https://api.sarvam.ai

# Test Numbers (Demo)
AMBULANCE_TEST_NUMBER=your_test_number
FIRE_TEST_NUMBER=your_test_number
POLICE_TEST_NUMBER=your_test_number
```

### **Frontend (.env)**
```bash
VITE_FIREBASE_URL=your_firebase_project_url
VITE_FIREBASE_ANON_KEY=your_firebase_anon_key
VITE_API_URL=/api
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

## 📱 Mobile Responsiveness

SankatSaathi is built with a mobile-first approach:

- ✅ **Responsive Design** - Adapts to all screen sizes (320px to 4K+)
- ✅ **Touch-Friendly Interface** - Optimized for mobile interactions
- ✅ **Mobile Navigation** - Hamburger menu with smooth animations
- ✅ **Adaptive Layouts** - Content reflows for optimal viewing
- ✅ **Performance Optimized** - Fast loading on mobile networks

## 🌍 Deployment

### **Vercel (Recommended)**

1. **Connect Repository**
   - Fork this repository
   - Connect to Vercel dashboard

2. **Configure Build**
   ```bash
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Set Environment Variables**
   - Add all variables from `.env.example`
   - Ensure API keys are valid

4. **Deploy**
   - Click "Deploy" in Vercel dashboard
   - Application will be live in minutes

### **Manual Deployment**
```bash
# Build frontend
cd frontend && npm run build

# Start backend
cd backend && python app.py

# Serve with nginx/apache
```

## 🔌 API Endpoints

### **Core Services**
- `GET /api/health` - System health check
- `POST /api/crisis/report` - Report new incident
- `GET /api/news/` - Get disaster news
- `POST /api/translate` - Translate text
- `POST /api/voice/command` - Process voice commands

### **Emergency Services**
- `POST /api/emergency/call` - Emergency service calls
- `GET /api/emergency/contacts` - Emergency contacts
- `POST /api/emergency/sos` - SOS alert system

### **AI & Analytics**
- `POST /api/severity/assess` - AI severity assessment
- `GET /api/hotspot/detect` - ML hotspot detection
- `POST /api/recommend/analyze` - AI resource recommendations
- `GET /api/intelligence/status` - AI intelligence status

### **Admin Operations**
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/incidents` - Incident management
- `POST /api/admin/broadcast` - Send broadcasts

## 👥 User Roles

### **Admin**
- Full system access
- User management
- System configuration
- Analytics dashboard
- Broadcast messaging

### **User**
- Incident reporting
- Emergency services
- News access
- Voice navigation
- Coordination tools

## 🛡️ Security Features

- **Role-Based Access Control (RBAC)**
- **JWT Authentication**
- **API Rate Limiting**
- **Input Validation**
- **CORS Protection**
- **Environment Variable Security**

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
python -m pytest tests/
```

### **Frontend Tests**
```bash
cd frontend
npm run test
```

### **API Testing**
```bash
# Test all endpoints
curl http://localhost:8000/api/health
```

## 📊 Performance

- **Frontend Bundle Size**: ~1.8MB (gzipped)
- **API Response Time**: <100ms average
- **Mobile Performance**: 90+ Lighthouse score
- **Uptime**: 99.9% target
- **Concurrent Users**: 10,000+ supported

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### **Documentation**
- API Docs: `/docs` endpoint
- Component Docs: Storybook integration
- Architecture Guide: `/docs/architecture`

### **Community**
- GitHub Issues: Bug reports and feature requests
- Discussions: Community support
- Wiki: Detailed guides and tutorials

### **Contact**
- Email: support@sankatsaathi.com
- Website: https://sankatsaathi.vercel.app
- Status Page: https://status.sankatsaathi.com

## 🏆 Acknowledgments

- **React Team** - Frontend framework
- **FastAPI** - Backend framework
- **Firebase** - Database and authentication
- **Vercel** - Deployment platform
- **Three.js** - 3D visualizations
- **Tailwind CSS** - Styling framework

---

<div align="center">

**Built with ❤️ for Emergency Response**

[Website](https://sankatsaathi.vercel.app) • [Documentation](https://docs.sankatsaathi.com) • [API](https://api.sankatsaathi.com) • [Status](https://status.sankatsaathi.com)

</div>




web qa extension: https://github.com/crazy-coder-neel/WebQA-Extension
# 🧠 WebPage QA Assistant

### A Browser Extension Powered by Python and LangChain

This project is a powerful and intelligent browser extension that uses **LangChain** and **Python** to analyze webpage content in real-time and answer user questions. It brings the capabilities of modern LLMs (Large Language Models) directly to your browser to help summarize, extract insights, or answer queries from any web page you’re reading.

---

## 🚀 Key Features

- ✅ **Real-Time Webpage Analysis** – Understand the current page instantly.
- ❓ **Natural Language Question Answering** – Ask questions in your own words.
- 🧠 **LangChain-Driven** – Uses the LangChain framework to power LLM pipelines.
- 🔌 **Python Backend** – Server-side logic in Python for scraping, processing, and inference.
- 🔄 **Extensible** – Easily add tools like summarization, translation, or note-taking.
- 🔒 **Privacy Focused** – Local or secure cloud LLM inference with no logging by default.

---

## ⚙️ How It Works

1. **Content Extraction**:  
   The browser extension captures the text content of the current page using JavaScript.

2. **Send to Backend**:  
   The captured content is sent to a local Python backend server via HTTP request.

3. **Process with LangChain**:  
   The backend uses LangChain to route the query and content to an LLM (e.g., GPT-4, Gemini Pro).

4. **Answer Returned**:  
   The answer is returned and displayed inside the extension popup instantly.

---

## 🛠️ Tech Stack

| Layer                 | Technology                                |
| --------------------- | ----------------------------------------- |
| **Frontend**          | HTML, CSS, JavaScript (Browser Extension) |
| **Backend**           | Python, Flask                             |
| **LLM Orchestration** | LangChain                                 |
| **LLM Provider**      | Meta LLAMA                                |
| **Text Extraction**   | BeautifulSoup                             |

---

## 📦 Installation Guide

### Step 1: Clone the Repository

git clone https://github.com/crazy-coder-neel/WebQA-Extension

cd backend

---

## **Then execute the app.py file as:**

---

python app.py



Fast Food appn using VB.NET: https://github.com/crazy-coder-neel/NJ_FastFood_


Full stack Fast Food website using PHP: https://github.com/crazy-coder-neel/FoodOrderingWebApp

# 🍔 Fast Food Ordering WebApp

A dynamic **Fast Food Ordering System** built with **PHP and MySQL**, designed to offer users an intuitive interface for browsing menu items, adding food to a cart, selecting a payment option (Cash/Online), and receiving an automatically generated invoice. The application uses **PHP sessions** to manage cart functionality and **PDF generation** (e.g., using `fpdf`) for invoice creation.

---

## 🚀 Features

🛒 Add/remove items from cart (session-based)

👤 Session-managed user experience

📃 Order placement and order history

💳 Payment by Cash or Online

🧾 Auto-generated invoice (PDF using FPDF)

📂 Admin-side (optional): View and manage orders

🗃️ Relational database design (MySQL)

---

## 🧰 Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Frontend  | HTML, CSS, JavaScript             |
| Backend   | PHP 5                             |
| Database  | MySQL                             |
| Server    | Apache (XAMPP)                    |
| Libraries | `fpdf` for PDF invoice generation |

---

# ⚙️ Installation & Setup

### ✅ Requirements

- PHP 5.x or below
- MySQL Server
- Apache Server (XAMPP / WAMP / LAMP)
- Web browser

### 🛠️ Installation Steps

1. **Clone the Repository**
   git clone https://github.com/crazy-coder-neel/FoodOrderingWebApp

📌 Import **database_setup.sql** SQL file into phpMyAdmin or using a MySQL CLI tool.

**Configure Database:**

$host = 'localhost';
$username = 'root';
$password = '';
$database = 'fastfood_db';

$conn = new mysqli($host, $username, $password, $database);

**Start Apache and MySQL via XAMPP/WAMP/LAMP.**

**Run the App in Browser**

http://localhost/FastFood/index.php.





Quiz appln using Servlets and JDBC : https://github.com/crazy-coder-neel/RandomQuizGenerator
# 🎯 Random Quiz Generator

A **Java Servlet-based web application** that dynamically generates random quizzes from a **PostgreSQL database**. The project is deployed on an **Apache Tomcat** server, demonstrating the integration of core Java EE components, JDBC for database operations, and a simple yet functional frontend to provide an interactive quiz experience.

---

## 📚 Project Overview

This application allows users to take a randomly generated quiz consisting of multiple-choice questions. The backend logic is written using **Java Servlets**, which interact with a **PostgreSQL** database using **JDBC** to fetch and render questions dynamically. It's hosted on an **Apache Tomcat** server and is designed to be lightweight, fast, and modular for easy extension.

---

## 🚀 Features

- 🎲 Randomly generated quiz from the database each time
- 🖥️ Built with standard Java EE (Servlets, JSP)
- 🛠️ Hosted on Apache Tomcat server
- 📋 Retrieves quiz questions using SQL with `ORDER BY RANDOM()`
- ✅ Automatic answer checking and score display
- 💾 PostgreSQL backend with JDBC connectivity
- 🌍 Fully functional on local or deployed server

---

## 🧰 Technologies Used

| Component    | Technology     |
|--------------|----------------|
| Backend      | Java Servlets (J2EE) |
| Frontend     | HTML, CSS, JSP |
| Database     | PostgreSQL     |
| Server       | Apache Tomcat  |
| DB Connector | JDBC Driver (PostgreSQL JDBC) |
| Build Tool   |  Maven  |

---
⚙️ Setup Instructions
✅ Prerequisites

Java (JDK 8+)
Apache Tomcat (v9 or v10 recommended)
PostgreSQL
Any Java IDE (Eclipse / IntelliJ)
PostgreSQL JDBC Driver (add to lib/)

---
**Configure JDBC in servlet** :
-String url = "jdbc:postgresql://localhost:5432/quizdb";

-String user = "your_username";

-String password = "your_password";

Connection conn = DriverManager.getConnection(url, user, password);

---



EncryptX: https://github.com/crazy-coder-neel/EncryptX
#  🔐 EncryptX 

An Android application that provides secure **encryption and decryption of text and images**. This app allows users to protect their sensitive information using standard encryption algorithms, making it easy to secure messages and images on the go.

---

## ✨ Features

- 🔒 **Text Encryption & Decryption**  
  Enter any text to encrypt or decrypt securely using symmetric key algorithms.

- 🖼️ **Image Encryption & Decryption**  
  Select an image from the gallery and apply encryption. Decrypt it anytime using the correct key.

- 🧾 **Clean and Simple UI**  
  Minimal design focused on user experience and functionality.

- 🔑 **Custom Secret Key Support**  
  Option to provide your own encryption key (or generate a secure one).

---

## 🧠 Technologies Used

- **Java** – Core Android development  
- **Android Studio** – IDE  
- **AES / RSA Encryption** – For secure cryptographic operations  
- **XML** – UI design  

---

## 🛠️ How to Use

1. **Install the app** on your Android device.
2. Choose whether to **encrypt** or **decrypt**.
3. For:
   - 🔤 **Text**: Enter the text and key → Tap Encrypt/Decrypt.
   - 🖼️ **Image**: Select image → Enter key → Encrypt/Decrypt.
4. View or save the output.

---


Spam Mail detection: https://github.com/crazy-coder-neel/SpamMailDetection
📧 Spam Mail Detection using Machine Learning

A simple yet effective spam email classifier built using **TF-IDF** vectorization and **Logistic Regression**. The model takes raw email text input and classifies it as **Spam** or **Ham (Not Spam)**. A red ❌ icon indicates spam, while a green ✅ confirms it is safe (ham).

## 🚀 Features

- Clean and minimal UI for user input.
- Real-time spam classification.
- Visual feedback:
  - ✅ for ham (safe emails)
  - ❌ for spam (malicious/unwanted emails)
- Built using:
  - `scikit-learn` for machine learning
  - `TF-IDF Vectorizer` for feature extraction
  - `Logistic Regression` for classification

## 📊 Model Details

- **Vectorization**: TF-IDF (Term Frequency–Inverse Document Frequency)
- **Classifier**: Logistic Regression
- **Dataset**: Trained on a labeled spam email dataset.

## 🖥️ How It Works

1. User enters the email message in the input box.
2. The model converts the text into a TF-IDF vector.
3. Logistic Regression predicts the label.
4. Output is shown with:
   - ✅ if it's **ham**
   - ❌ if it's **spam**

## 🧠 Tech Stack

- **Python**
- **Flask** (for backend API and web rendering)
- **HTML/CSS/JavaScript** (for frontend)
- **scikit-learn**
- **pandas**, **numpy**

## 📦 Installation

1. Clone the repo:
   https://github.com/crazy-coder-neel/SpamMailDetection

2. To run the project , open the terminal and run app.py as :
   python app.py


Twitter Sentiment Analysis: https://github.com/crazy-coder-neel/Twitter-Sentiment-Analysis
# 🐦 Twitter Sentiment Analysis – ML Web App

A machine learning-based web application that analyzes the **sentiment of tweets** using **TF-IDF vectorization** and **Logistic Regression**. Users can input any tweet, and the system classifies it as **positive**, **negative**, or **neutral**, with visual indicators for clarity.

---

## 💡 Features

- 🔍 **Sentiment Classification**  
  Classifies tweets into:
  - ✅ Positive
  - ❌ Negative
  - ⚪ Neutral

- 💬 **Simple Input Interface**  
  Enter any tweet text and get instant feedback on sentiment.

- 📊 **Machine Learning Pipeline**  
  - Text preprocessing
  - TF-IDF vectorization
  - Logistic Regression for classification

- 🌐 **Web Application**  
  - Built using **Flask** (backend)
  - HTML/CSS (frontend)

---

## 🧠 Tech Stack

| Component      | Technology         |
|----------------|--------------------|
| ML Model       | Logistic Regression |
| Feature Extraction | TF-IDF Vectorizer |
| Backend        | Flask (Python)     |
| Frontend       | HTML, CSS          |
| Data Handling  | Pandas, NumPy      |
| Model Building | scikit-learn       |

---

1. Clone the repo:
   git clone https://github.com/crazy-coder-neel/Twitter-Sentiment-Analysis

2.To run the project , open the terminal and run the app.py as :
  python app.py


Quotify: https://github.com/crazy-coder-neel/Quotify_1x
Random multilingual quote generator based on users mood or prompt , flutter+generative ai 



Flashcard Quiz app: https://github.com/crazy-coder-neel/Flashcard_Quiz_App
# Flashcard_Quiz_App
# 🧠 Flutter Flashcard Quiz App with Gemini AI

A powerful and interactive quiz app built using **Flutter**, integrated with **Gemini AI** for smart quiz generation and chatbot interaction. The app allows users to explore various quiz domains, practice with flashcards, and dynamically generate quizzes. Users can also maintain their profiles and securely sign in or sign up.

---

## 🚀 Features

### 🗂️ Flashcard Quiz by Domain
- Organized flashcards under multiple domains (e.g., Science, Tech, History, etc.)
- Easy navigation and swipe functionality for learning on the go

### 🤖 Gemini-Powered Chatbot
- Conversational AI built using **Gemini API**
- Ask questions, get explanations, or discuss quiz topics

### ⚙️ Dynamic Quiz Generator
- Generates quizzes based on user prompts using **Gemini**
- No static question bank—fresh questions every time

### 👤 User Profile & Authentication
- Sign in / Sign up securely
- View and edit profile
- Track your learning progress *(planned feature)*

### 📝 Notes Section *(Planned)*
- Add your own notes and tag them to domains
- Save useful info while studying

---

## 📱 Built With

- **Flutter** – UI development
- **Firebase** – Authentication and backend services
- **Gemini API** – AI-based chatbot & quiz generator

---


> _Coming soon..._ : This project is currently under development.