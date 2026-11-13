"""Use case diagram with a fixed, readable layout (Nurse left, Administrator right)."""
import math
import sys
from xml.sax.saxutils import escape

OUT = sys.argv[1]
W, H = 1880, 1680
TEAL, INK, MID, FRAME, BG = "#107A6B", "#1F3B36", "#2F4F4A", "#9DB4AE", "#F3FAF8"
EW, EH = 232, 54
svg = []
uc = {}


def text(x, y, s, size=13, weight="normal", anchor="middle", color=INK, italic=False):
    lines = s.split("\n")
    y0 = y - (len(lines) - 1) * (size * 0.6)
    for i, ln in enumerate(lines):
        svg.append(f'<text x="{x}" y="{y0 + i * size * 1.2 + size * 0.35:.1f}" font-size="{size}" font-weight="{weight}" '
                   f'text-anchor="{anchor}" fill="{color}"{" font-style=\"italic\"" if italic else ""}>{escape(ln)}</text>')


def package(x1, y1, x2, y2, name):
    tw = len(name) * 7.6 + 18
    svg.append(f'<path d="M{x1} {y1 + 22} L{x1} {y2} L{x2} {y2} L{x2} {y1 + 22} L{x1 + tw + 8} {y1 + 22} '
               f'L{x1 + tw} {y1} L{x1} {y1} Z" fill="#FFFFFF" stroke="{FRAME}" stroke-width="1.4"/>')
    svg.append(f'<line x1="{x1}" y1="{y1 + 22}" x2="{x1 + tw + 8}" y2="{y1 + 22}" stroke="{FRAME}" stroke-width="1.4"/>')
    text(x1 + 9, y1 + 11, name, 12.5, "bold", "start")


def usecase(key, x, y, label):
    uc[key] = (x, y)
    svg.append(f'<ellipse cx="{x}" cy="{y}" rx="{EW / 2}" ry="{EH / 2}" fill="{BG}" stroke="{TEAL}" stroke-width="1.5"/>')
    text(x, y, label, 12.5)


def edge_point(cx, cy, tx, ty, rx=EW / 2, ry=EH / 2):
    dx, dy = tx - cx, ty - cy
    if dx == 0 and dy == 0:
        return cx, cy
    t = 1 / math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    return cx + dx * t, cy + dy * t


actors = {}


def actor(key, x, y, label, stereo=None):
    actors[key] = (x, y)
    c = TEAL
    svg.append(f'<circle cx="{x}" cy="{y - 38}" r="11" fill="{BG}" stroke="{c}" stroke-width="1.8"/>')
    svg.append(f'<line x1="{x}" y1="{y - 27}" x2="{x}" y2="{y + 5}" stroke="{c}" stroke-width="1.8"/>')
    svg.append(f'<line x1="{x - 18}" y1="{y - 16}" x2="{x + 18}" y2="{y - 16}" stroke="{c}" stroke-width="1.8"/>')
    svg.append(f'<line x1="{x}" y1="{y + 5}" x2="{x - 14}" y2="{y + 28}" stroke="{c}" stroke-width="1.8"/>')
    svg.append(f'<line x1="{x}" y1="{y + 5}" x2="{x + 14}" y2="{y + 28}" stroke="{c}" stroke-width="1.8"/>')
    text(x, y + 46, label, 14, "bold")
    if stereo:
        text(x, y + 64, stereo, 11.5, italic=True, color=TEAL)


def assoc(a, u, arrow=False):
    ax, ay = actors[a]
    ux, uy = uc[u]
    sx, sy = ax + (24 if ux > ax else -24), ay - 6
    ex, ey = edge_point(ux, uy, sx, sy)
    svg.append(f'<line x1="{sx}" y1="{sy}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{MID}" stroke-width="1.2"'
               f'{" marker-end=\"url(#open)\"" if arrow else ""}/>')


def dep(frm, to, label):
    fx, fy = uc[frm]
    tx, ty = uc[to]
    sx, sy = edge_point(fx, fy, tx, ty)
    ex, ey = edge_point(tx, ty, fx, fy)
    svg.append(f'<line x1="{sx:.1f}" y1="{sy:.1f}" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{MID}" stroke-width="1.2" '
               f'stroke-dasharray="6 4" marker-end="url(#open)"/>')
    mx, my = (sx + ex) / 2, (sy + ey) / 2
    svg.append(f'<rect x="{mx - 40}" y="{my - 18}" width="80" height="16" fill="#FFFFFF" opacity="0.9"/>')
    text(mx, my - 10, label, 11, color=MID)


svg.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#FFFFFF"/>')
svg.append('<defs><marker id="open" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto">'
           f'<path d="M0,0 L10,5 L0,10" fill="none" stroke="{MID}" stroke-width="1.3"/></marker>'
           '<marker id="tri" markerWidth="18" markerHeight="18" refX="15" refY="8" orient="auto">'
           f'<path d="M0,0 L15,8 L0,16 Z" fill="#FFFFFF" stroke="{MID}" stroke-width="1.3"/></marker></defs>')
text(W / 2, 30, "Use Case Diagram — ISU Infirmary Logbook Management and Health Surveillance System", 21, "bold")

def poly(pts, marker=None, dash=False):
    d = " ".join(f"{x},{y}" for x, y in pts)
    svg.append(f'<polyline points="{d}" fill="none" stroke="{MID}" stroke-width="1.3"'
               f'{" stroke-dasharray=\"6 4\"" if dash else ""}{f" marker-end=\"url(#{marker})\"" if marker else ""}/>')

svg.append(f'<rect x="270" y="185" width="1360" height="1465" fill="none" stroke="{TEAL}" stroke-width="2" rx="6"/>')
text(950, 1638, "«system» ISU Infirmary Logbook Management and Health Surveillance System", 13.5, "bold", color=TEAL)

package(470, 214, 1330, 330, "Account access")
usecase("signin", 620, 280, "Sign in")
usecase("signout", 900, 280, "Sign out")
usecase("reset", 1180, 280, "Reset password\nwith emailed code")

package(300, 360, 900, 870, "Clinical records")
usecase("visit", 435, 430, "Record a visit")
usecase("lookup", 755, 430, "Look up or\nregister patient")
usecase("dispense", 755, 530, "Dispense medicines\nand supplies")
usecase("flag", 755, 620, "Flag special case")
usecase("sout", 435, 510, "Sign out patient\nwith disposition")
usecase("records", 435, 590, "Manage patient records\n(edit, move to trash)")
usecase("search", 435, 670, "Search patient history")
usecase("docs", 435, 750, "Print medical certificate /\nparental notification")
usecase("ndash", 435, 830, "View nurse dashboard")

package(300, 895, 900, 1005, "Health surveillance")
usecase("watch", 435, 950, "View Outbreak watch")
usecase("outbreak", 755, 950, "Check for possible\noutbreaks")

package(300, 1030, 900, 1352, "Inventory")
usecase("stock", 435, 1085, "Monitor stock\nand expiry")
usecase("req", 435, 1185, "Submit restock\nrequisition")
usecase("restock", 435, 1255, "Add or restock item")
usecase("recv", 435, 1320, "Confirm delivery")

package(1000, 360, 1500, 1005, "Administration")
usecase("adash", 1250, 430, "View admin dashboard")
usecase("users", 1250, 510, "Manage user accounts")
usecase("audit", 1250, 590, "View audit log")
usecase("settings", 1250, 670, "Configure settings and\nmaintenance mode")
usecase("backup", 1250, 750, "Back up, export\nand restore database")
usecase("trash", 1250, 830, "Restore records\nfrom trash")
usecase("auto", 1250, 945, "Take automatic\ndaily backup")

package(1000, 1030, 1500, 1140, "Restock approval")
usecase("appr", 1250, 1085, "Approve or deny\nrequisition")

package(560, 1375, 1240, 1612, "Reports")
usecase("rpt", 900, 1435, "View analytics, tables and\nmonthly supply report")
usecase("csv", 900, 1560, "Export CSV /\nprint report")

actor("U", 900, 110, "User")
actor("N", 110, 880, "Nurse")
actor("A", 1740, 760, "Administrator")
actor("G", 1740, 290, "Gmail SMTP Server", "«external system»")
actor("T", 1740, 960, "Backup Scheduler", "«timer, 11:59 PM»")

# User -> account access
for k in ("signin", "signout", "reset"):
    ux, uy = uc[k]; ex, ey = edge_point(ux, uy, 900, 172)
    svg.append(f'<line x1="900" y1="172" x2="{ex:.1f}" y2="{ey:.1f}" stroke="{MID}" stroke-width="1.3"/>')
# generalization Nurse -> User, Administrator -> User
poly([(110, 838), (110, 72), (870, 72)], "tri")
poly([(1762, 742), (1840, 742), (1840, 72), (930, 72)], "tri")

# Nurse bus
NB = 210
nurse_cases = ["visit", "sout", "records", "search", "docs", "ndash", "watch", "stock", "req", "restock", "recv", "rpt"]
ys = [uc[k][1] for k in nurse_cases]
poly([(NB, min(ys)), (NB, max(ys))])
poly([(134, 874), (NB, 874)])
for k in nurse_cases:
    x, y = uc[k]
    poly([(NB, y), (x - EW / 2, y)])
# Administrator bus
AB = 1560
admin_cases = ["adash", "users", "audit", "settings", "backup", "trash", "appr", "rpt"]
ys = [uc[k][1] for k in admin_cases]
poly([(AB, min(ys)), (AB, max(ys))])
poly([(1716, 754), (AB, 754)])
for k in admin_cases:
    x, y = uc[k]
    poly([(AB, y), (x + EW / 2, y)])
# scheduler and Gmail
poly([(1716, 954), (uc["auto"][0] + EW / 2, 954)])
poly([(uc["reset"][0] + EW / 2, 284), (1714, 284)], "open")
text(1500, 270, "sends 6-digit code", 11, color=MID)

dep("visit", "lookup", "«include»")
dep("dispense", "visit", "«extend»")
dep("flag", "visit", "«extend»")
dep("ndash", "outbreak", "«include»")
dep("watch", "outbreak", "«include»")
dep("req", "stock", "«extend»")
dep("csv", "rpt", "«extend»")

open(OUT, "w").write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
                     f'font-family="Arial, Helvetica, sans-serif">' + "".join(svg) + "</svg>")
print("wrote", OUT)
