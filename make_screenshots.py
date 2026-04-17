"""
Generate mock UI screenshots for the Rally Analysis App using Pillow.
"""
from PIL import Image, ImageDraw, ImageFont
import os, textwrap

OUT = "/workshop/rally-analysis-app/slides_assets"
os.makedirs(OUT, exist_ok=True)

W, H = 1400, 900

# ── Colour palette (from tailwind.config.js) ────────────────────────────────
PRIMARY_700 = (30,  58,  95)    # #1E3A5F  header / buttons
PRIMARY_800 = (22,  45,  74)    # #162D4A  active nav
PRIMARY_600 = (45,  95,  158)   # #2D5F9E  accent
PRIMARY_100 = (197, 213, 234)   # #C5D5EA  light accent
PRIMARY_50  = (232, 238, 247)   # #E8EEF7  card tint

WHITE   = (255, 255, 255)
BG      = (249, 250, 251)       # gray-50
BORDER  = (229, 231, 235)       # gray-200
TEXT1   = (17,  24,  39)        # gray-900
TEXT2   = (55,  65,  81)        # gray-700
TEXT3   = (107, 114, 128)       # gray-500
TEXT4   = (156, 163, 175)       # gray-400
SHADOW  = (203, 213, 225)

GREEN   = (22,  163, 74)
GREEN_L = (220, 252, 231)
ORANGE  = (234, 88,  12)
ORANGE_L= (255, 237, 213)
RED     = (239, 68,  68)
RED_L   = (254, 226, 226)
RED_D   = (153, 27,  27)
PURPLE  = (139, 92,  246)
PURPLE_L= (243, 232, 255)
YELLOW  = (202, 138, 4)
YELLOW_L= (254, 249, 195)
BLUE    = (37,  99,  235)
BLUE_L  = (219, 234, 254)
SLATE_L = (241, 245, 249)

def font(size, bold=False):
    try:
        p = "/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf".format("-Bold" if bold else "")
        return ImageFont.truetype(p, size)
    except Exception:
        return ImageFont.load_default()

def rr(draw, xy, r, fill, outline=None, ow=1):
    """Rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rectangle([x1+r, y1, x2-r, y2], fill=fill)
    draw.rectangle([x1, y1+r, x2, y2-r], fill=fill)
    for ex, ey in [(x1,y1),(x2-2*r,y1),(x1,y2-2*r),(x2-2*r,y2-2*r)]:
        draw.ellipse([ex, ey, ex+2*r, ey+2*r], fill=fill)
    if outline:
        draw.arc([x1,y1,x1+2*r,y1+2*r], 180, 270, fill=outline, width=ow)
        draw.arc([x2-2*r,y1,x2,y1+2*r], 270, 360, fill=outline, width=ow)
        draw.arc([x1,y2-2*r,x1+2*r,y2], 90, 180, fill=outline, width=ow)
        draw.arc([x2-2*r,y2-2*r,x2,y2], 0, 90, fill=outline, width=ow)
        draw.line([x1+r,y1,x2-r,y1], fill=outline, width=ow)
        draw.line([x1+r,y2,x2-r,y2], fill=outline, width=ow)
        draw.line([x1,y1+r,x1,y2-r], fill=outline, width=ow)
        draw.line([x2,y1+r,x2,y2-r], fill=outline, width=ow)

def card(draw, x, y, w, h):
    draw.rectangle([x+2, y+2, x+w+2, y+h+2], fill=SHADOW)
    rr(draw, (x, y, x+w, y+h), 10, WHITE, BORDER, 1)

def pill(draw, x, y, w, h, text, bg, fg, fsize=10):
    rr(draw, (x, y, x+w, y+h), 7, bg)
    f = font(fsize)
    tw = draw.textlength(text, font=f)
    draw.text((x+(w-tw)//2, y+(h-fsize)//2-1), text, fill=fg, font=f)

def nav_bar(draw, active="exports"):
    draw.rectangle([0, 0, W, 56], fill=PRIMARY_700)
    # logo
    draw.rectangle([20, 14, 46, 42], fill=PRIMARY_600)
    draw.text((22, 17), "R", fill=WHITE, font=font(16, bold=True))
    draw.text((50, 18), "Rally Analysis", fill=WHITE, font=font(15, bold=True))

    tabs = [("Exports", "exports"), ("Generate Summary", "summary"), ("Analytics", "analytics")]
    tx = 260
    for label, key in tabs:
        f = font(12, bold=(key==active))
        tw = int(draw.textlength(label, font=f)) + 24
        bg = PRIMARY_800 if key == active else None
        if bg:
            draw.rectangle([tx, 0, tx+tw, 56], fill=bg)
        draw.text((tx+12, 20), label, fill=WHITE, font=f)
        tx += tw + 4

def page_title(draw, title, subtitle, y=74):
    draw.text((24, y), title, fill=TEXT1, font=font(20, bold=True))
    draw.text((24, y+28), subtitle, fill=TEXT3, font=font(11))

# ═══════════════════════════════════════════════════════════════════
# SCREENSHOT 1 — Exports Dashboard (Home Page)
# ═══════════════════════════════════════════════════════════════════
def make_exports():
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    nav_bar(draw, active="exports")
    page_title(draw, "Rally Data Exports",
               "Daily exports run automatically at 3:00 PM EST. Trigger a manual export below.")

    # Action buttons
    bx = W - 320
    rr(draw, (bx, 75, bx+110, 99), 6, WHITE, BORDER, 1)
    draw.text((bx+28, 82), "Refresh", fill=TEXT2, font=font(11))

    rr(draw, (bx+118, 75, bx+288, 99), 6, PRIMARY_700, None)
    draw.text((bx+130, 82), "+ Trigger New Export", fill=WHITE, font=font(11, bold=True))

    # Export cards
    exports = [
        ("rally_export_20260416_150000.csv", "Apr 16, 2026 · 3:00 PM", 3, 8, 15),
        ("rally_export_20260415_150000.csv", "Apr 15, 2026 · 3:00 PM", 3, 9, 17),
        ("rally_export_20260414_150000.csv", "Apr 14, 2026 · 3:00 PM", 3, 8, 15),
        ("rally_export_20260413_150000.csv", "Apr 13, 2026 · 3:00 PM", 3, 9, 16),
        ("rally_export_20260412_150000.csv", "Apr 12, 2026 · 3:00 PM", 3, 7, 14),
    ]

    cy = 116
    for fname, date, feat, stories, tasks in exports:
        card(draw, 24, cy, W-48, 114)
        # icon
        draw.rectangle([42, cy+14, 70, cy+100], fill=PRIMARY_50)
        draw.text((48, cy+42), "CSV", fill=PRIMARY_700, font=font(13, bold=True))
        # filename & date
        draw.text((84, cy+18), fname, fill=TEXT1, font=font(13, bold=True))
        draw.text((84, cy+38), date, fill=TEXT3, font=font(11))
        # badge counts
        bpx = 84
        bpy = cy + 60
        for lbl, bg, fg in [
            (f"Features: {feat}", BLUE_L, BLUE),
            (f"Stories: {stories}", GREEN_L, GREEN),
            (f"Tasks: {tasks}", SLATE_L, TEXT2),
        ]:
            tw = int(draw.textlength(lbl, font=font(10))) + 16
            pill(draw, bpx, bpy, tw, 20, lbl, bg, fg, 10)
            bpx += tw + 8

        # Download button
        bw = 130
        rr(draw, (W-72-bw, cy+42, W-72, cy+66), 6, WHITE, PRIMARY_100, 1)
        draw.text((W-72-bw+16, cy+48), "Download CSV ↓", fill=PRIMARY_700, font=font(11))

        # separator
        draw.rectangle([24, cy+114, W-24, cy+115], fill=BORDER)
        cy += 118

    img.save(f"{OUT}/screen_exports.png")
    print("Saved screen_exports.png")


# ═══════════════════════════════════════════════════════════════════
# SCREENSHOT 2 — Analytics Dashboard
# ═══════════════════════════════════════════════════════════════════
def make_analytics():
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    nav_bar(draw, active="analytics")
    page_title(draw, "Sprint Analytics",
               "Burn charts, velocity, cycle time, resource allocation, and stale story detection.")

    # KPI row
    kpis = [
        ("8",    "Total Stories",   TEXT1,  WHITE),
        ("55",   "Total Points",    TEXT1,  WHITE),
        ("28.7", "Avg Velocity",    TEXT1,  WHITE),
        ("18.4d","Avg Cycle Time",  TEXT1,  WHITE),
        ("5",    "Outliers",        ORANGE, ORANGE_L),
        ("3",    "Stale Stories",   RED,    RED_L),
    ]
    kw = (W - 48 - 5*8) // 6
    kx = 24
    for val, lbl, vc, bc in kpis:
        card(draw, kx, 110, kw, 58)
        draw.text((kx+kw//2 - int(draw.textlength(val, font=font(18,bold=True)))//2,
                   118), val, fill=vc, font=font(18, bold=True))
        draw.text((kx+kw//2 - int(draw.textlength(lbl, font=font(9)))//2,
                   140), lbl, fill=TEXT3, font=font(9))
        kx += kw + 8

    # ── Sprint Burndown section ──────────────────────────────────
    card(draw, 24, 180, W-48, 300)
    draw.text((38, 192), "Sprint Burndown", fill=TEXT1, font=font(13, bold=True))
    pill(draw, 200, 191, 72, 18, "3 sprints", PRIMARY_100, PRIMARY_700, 10)

    # Chart area
    CX, CY, CW, CH = 50, 218, W-100, 244
    draw.rectangle([CX, CY, CX+CW, CY+CH], fill=WHITE)
    draw.rectangle([CX, CY, CX+CW, CY+CH], outline=BORDER)

    # Y-axis labels
    for i, v in enumerate([0, 12, 24, 36, 48]):
        yy = CY + CH - int(i * CH / 4)
        draw.text((CX-28, yy-6), str(v), fill=TEXT3, font=font(9))
        draw.line([CX, yy, CX+CW, yy], fill=BORDER, width=1)

    # Three sprints with colors
    sprints = [
        ("Apr 2026", 42, 34, PRIMARY_700, ORANGE),
        ("May 2026", 46, 38, GREEN,       ORANGE),
        ("Jun 2026", 36, 14, PURPLE,      RED),
    ]
    sprint_w = CW // 3
    for si, (label, planned, done, color, _) in enumerate(sprints):
        sx = CX + si * sprint_w
        days = 30

        # Ideal line (straight)
        pts_ideal = [(sx + int(d * sprint_w / days),
                      CY + CH - int((planned - planned * d / days) * CH / 50))
                     for d in range(days+1)]
        for i in range(len(pts_ideal)-1):
            draw.line([pts_ideal[i], pts_ideal[i+1]], fill=TEXT4, width=1)

        # Actual burn (curve that ends at planned-done remaining)
        remaining_end = planned - done
        pts_actual = []
        for d in range(days+1):
            frac = d / days
            if frac < 0.7:
                rem = planned - (done * frac / 0.7) * 0.85
            else:
                rem = planned - done * 0.85 - (done * 0.15) * ((frac-0.7)/0.3)
            rem = max(0, rem)
            pts_actual.append((sx + int(d * sprint_w / days),
                                CY + CH - int(rem * CH / 50)))
        for i in range(len(pts_actual)-1):
            draw.line([pts_actual[i], pts_actual[i+1]], fill=color, width=2)

        # Sprint label
        draw.text((sx + sprint_w//2 - 25, CY + CH + 6), label, fill=TEXT3, font=font(9))

    # Legend
    for i, (lbl, clr) in enumerate([("Ideal", TEXT4), ("Apr", PRIMARY_700),
                                      ("May", GREEN), ("Jun", PURPLE)]):
        lx = CX + CW - 260 + i * 62
        draw.rectangle([lx, CY+6, lx+20, CY+12], fill=clr)
        draw.text((lx+24, CY+3), lbl, fill=TEXT3, font=font(9))

    # ── Stale Stories section ──────────────────────────────────
    card(draw, 24, 494, W-48, 192)
    draw.rectangle([24, 494, 24+6, 686], fill=RED)   # left accent
    draw.text((44, 504), "Stale & Potentially Blocked Stories", fill=TEXT1, font=font(13, bold=True))
    pill(draw, 360, 503, 72, 18, "3 stories", RED_L, RED_D, 10)

    # Table header
    draw.rectangle([38, 530, W-38, 546], fill=SLATE_L)
    cols = [("Story ID", 38), ("Story Name", 130), ("Owner", 360),
            ("State", 520), ("Days Stale", 640), ("Points", 760)]
    for lbl, cx in cols:
        draw.text((cx+4, 533), lbl, fill=TEXT2, font=font(10, bold=True))

    stale = [
        ("US-008", "Webhook event processing impl.", "Henry Wang", "Defined",     66, 8),
        ("US-007", "API rate limiting and throttling",  "Grace Kim",  "In-Progress", 50, 5),
        ("US-006", "Real-time data refresh mechanism",  "Eve Martinez","In-Progress", 43, 8),
    ]
    for ri, (sid, name, owner, state, days, pts) in enumerate(stale):
        ry = 550 + ri*40
        bg = RED_L if ri % 2 == 0 else (255, 240, 240)
        draw.rectangle([38, ry, W-38, ry+36], fill=bg)
        draw.text((42, ry+11), sid,   fill=RED_D,  font=font(10, bold=True))
        draw.text((134, ry+11), name,  fill=TEXT1,  font=font(10))
        draw.text((364, ry+11), owner, fill=TEXT2,  font=font(10))
        draw.text((524, ry+11), state, fill=TEXT2,  font=font(10))
        draw.text((644, ry+11), f"{days}d", fill=RED, font=font(10, bold=True))
        draw.text((764, ry+11), str(pts), fill=TEXT2, font=font(10))

    img.save(f"{OUT}/screen_analytics.png")
    print("Saved screen_analytics.png")


# ═══════════════════════════════════════════════════════════════════
# SCREENSHOT 3 — AI Summary Generation Page
# ═══════════════════════════════════════════════════════════════════
def make_summary():
    img  = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    nav_bar(draw, active="summary")
    page_title(draw, "Generate Rally Summary",
               "Uses Claude AI to generate a narrative summary of Rally activity.")

    # Input form card
    card(draw, 24, 110, W-48, 72)
    fx = 36
    for lbl, val, w in [("Start Date", "2026-04-07", 190),
                         ("End Date",   "2026-04-11", 190),
                         ("Summary Type", "Weekly",   160)]:
        draw.text((fx, 120), lbl, fill=TEXT3, font=font(10))
        rr(draw, (fx, 136, fx+w, 162), 5, WHITE, BORDER, 1)
        draw.text((fx+10, 143), val, fill=TEXT1, font=font(11))
        fx += w + 12
    # Generate button
    rr(draw, (fx, 136, fx+170, 162), 6, PRIMARY_700)
    draw.text((fx+20, 143), "✦  Generate Summary", fill=WHITE, font=font(11, bold=True))

    # Metrics row
    metrics = [
        ("1",  "Features Done",   BLUE,   BLUE_L),
        ("5",  "Stories Done",    GREEN,  GREEN_L),
        ("3",  "Stories WIP",     YELLOW, YELLOW_L),
        ("11", "Tasks Done",      BLUE,   BLUE_L),
        ("34", "Points Accepted", GREEN,  GREEN_L),
        ("38", "Team Velocity",   PURPLE, PURPLE_L),
    ]
    mw = (W - 48 - 5*8) // 6
    mx = 24
    for val, lbl, vc, bc in metrics:
        card(draw, mx, 196, mw, 62)
        draw.rectangle([mx, 196, mx+4, 258], fill=vc)
        draw.text((mx + mw//2 - int(draw.textlength(val, font=font(22,bold=True)))//2,
                   204), val, fill=vc, font=font(22, bold=True))
        draw.text((mx + mw//2 - int(draw.textlength(lbl, font=font(9)))//2,
                   232), lbl, fill=TEXT3, font=font(9))
        mx += mw + 8

    # Summary card
    card(draw, 24, 272, W-48, 440)

    # Header row
    draw.text((38, 284), "Summary", fill=TEXT1, font=font(14, bold=True))
    for i, (lbl, clr) in enumerate([("PDF", PRIMARY_700), ("DOCX", PRIMARY_700), ("EXCEL", GREEN)]):
        bx = W - 220 + i * 66
        rr(draw, (bx, 282, bx+56, 300), 4, WHITE, BORDER, 1)
        draw.text((bx+10, 285), lbl, fill=clr, font=font(10, bold=True))

    draw.line([38, 304, W-38, 305], fill=BORDER, width=1)

    summary_text = (
        "## Weekly Summary: April 7–11, 2026\n\n"
        "### Overview\n"
        "The team made solid progress this week, completing 5 user stories (34 story points)\n"
        "across 3 active features. Feature F-001 (Customer Portal) reached acceptance with\n"
        "all planned stories delivered on schedule. The API Integration work (F-002) continues\n"
        "on track with 2 of 4 stories accepted.\n\n"
        "### Completed This Week\n"
        "- US-001: User authentication flow (Alice Johnson, 8 pts) — Accepted\n"
        "- US-002: Dashboard layout (Bob Smith, 5 pts) — Accepted\n"
        "- US-003: Data export CSV (Alice Johnson, 13 pts) — Accepted\n\n"
        "### In Progress\n"
        "- US-006: Real-time data refresh (Eve Martinez, 8 pts) — 50% complete\n"
        "- US-007: API rate limiting (Grace Kim, 5 pts) — In Progress\n\n"
        "### Risks & Blockers\n"
        "- US-008 (Henry Wang) has not been updated in 14+ days — follow-up required."
    )
    ty = 314
    for line in summary_text.split("\n")[:18]:
        if line.startswith("## "):
            draw.text((38, ty), line[3:], fill=TEXT1, font=font(13, bold=True))
            ty += 20
        elif line.startswith("### "):
            ty += 4
            draw.text((38, ty), line[4:], fill=PRIMARY_700, font=font(11, bold=True))
            ty += 17
        elif line.startswith("- "):
            draw.text((48, ty), "•  " + line[2:], fill=TEXT2, font=font(11))
            ty += 15
        elif line.strip():
            draw.text((38, ty), line, fill=TEXT2, font=font(11))
            ty += 15
        else:
            ty += 6

    # Bottom action buttons
    rr(draw, (W-372, 682, W-200, 706), 6, WHITE, BORDER, 1)
    draw.text((W-362, 689), "View Detailed Summary →", fill=PRIMARY_700, font=font(11))

    rr(draw, (W-188, 682, W-24, 706), 6, PRIMARY_700)
    draw.text((W-178, 689), "View Executive Summary →", fill=WHITE, font=font(11, bold=True))

    img.save(f"{OUT}/screen_summary.png")
    print("Saved screen_summary.png")


if __name__ == "__main__":
    make_exports()
    make_analytics()
    make_summary()
    print("All screenshots saved to", OUT)
