#!/usr/bin/env python3
"""
Porkbun DNS Diagnostics & Setup for color-helper.com
====================================================

Lokales Tool — führt DNS-Operationen gegen die Porkbun JSON-API aus.

WICHTIG: Die API wird von der Sidekick-Sandbox-IP-Region geblockt (403).
Lokales Ausführen ist erforderlich.

Verwendung:
    1) .env im Projekt-Root anlegen (siehe .env.example)
    2) pip install requests python-dotenv
    3) python scripts/porkbun_dns.py list                # aktuelle Records listen
       python scripts/porkbun_dns.py dry-run             # Aktionen simulieren
       python scripts/porkbun_dns.py apply               # CF-Targets anlegen
       python scripts/porkbun_dns.py delete-subdomains  # opt-in: alle Subdomains löschen
       python scripts/porkbun_dns.py reset-apex          # ALIAS apex neu setzen

Erwarteter Endzustand:
    color-helper.com         ALIAS   color-helper.pages.dev
    www.color-helper.com     CNAME   color-helper.pages.dev
"""

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    print("FEHLT: pip install python-dotenv", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

API_KEY = os.getenv("PORKBUN_API_KEY", "")
SECRET_KEY = os.getenv("PORKBUN_SECRET_KEY", "")
DOMAIN = os.getenv("PORKBUN_DOMAIN", "color-helper.com")
CF_TARGET = "color-helper.pages.dev"

BASE = "https://porkbun.com/api/json/v3"


def _request(endpoint: str, payload: dict | None = None) -> dict:
    body = {
        "apikey": API_KEY,
        "secretapikey": SECRET_KEY,
    }
    if payload:
        body.update(payload)
    req = urllib.request.Request(
        f"{BASE}{endpoint}",
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"status": "ERROR", "code": e.code, "body": e.read().decode()[:500]}
    except urllib.error.URLError as e:
        return {"status": "ERROR", "code": "URL", "body": str(e)}


def cmd_list() -> int:
    if not API_KEY or not SECRET_KEY:
        print("FEHLT: PORKBUN_API_KEY / PORKBUN_SECRET_KEY in .env", file=sys.stderr)
        return 1
    r = _request(f"/dns/retrieve/{DOMAIN}")
    if r.get("status") != "SUCCESS":
        print(f"Fehler: {json.dumps(r, indent=2)}")
        return 1
    records = r.get("records", [])
    if not records:
        print("(keine Records)")
        return 0
    by_type: dict[str, list] = {}
    for rec in records:
        by_type.setdefault(rec["type"], []).append(rec)
    for t, recs in sorted(by_type.items()):
        print(f"\n=== {t} ===")
        for rec in recs:
            print(f"  {rec['name']:30s} → {rec['content']:40s}  (ttl={rec['ttl']}, prio={rec.get('prio','-')}, id={rec['id']})")
    # Quick verdict
    apex = [r for r in records if r["name"] == DOMAIN and r["type"] in ("ALIAS", "CNAME")]
    www = [r for r in records if r["name"] == f"www.{DOMAIN}" and r["type"] in ("CNAME", "ALIAS")]
    print("\n=== SOLL/IST ===")
    print(f"  APEX ({DOMAIN}) → {CF_TARGET}:")
    if apex:
        for r in apex:
            mark = "OK" if r["content"] == CF_TARGET else "FALSCH"
            print(f"    [{mark}] {r['type']} → {r['content']}")
    else:
        print("    FEHLT — muss angelegt werden")
    print(f"  www.{DOMAIN} → {CF_TARGET}:")
    if www:
        for r in www:
            mark = "OK" if r["content"] == CF_TARGET else "FALSCH"
            print(f"    [{mark}] {r['type']} → {r['content']}")
    else:
        print("    FEHLT — muss angelegt werden")
    return 0


def cmd_apply() -> int:
    r = _request(f"/dns/retrieve/{DOMAIN}")
    if r.get("status") != "SUCCESS":
        print(f"Fehler beim Lesen: {json.dumps(r, indent=2)}")
        return 1
    existing = {(rec["name"], rec["type"]): rec for rec in r.get("records", [])}

    actions = []
    apex = DOMAIN
    www = f"www.{DOMAIN}"

    # Apex ALIAS
    if (apex, "ALIAS") in existing and existing[(apex, "ALIAS")]["content"] == CF_TARGET:
        actions.append(("SKIP", f"APEX ALIAS → {CF_TARGET} bereits korrekt"))
    else:
        if (apex, "ALIAS") in existing:
            old = existing[(apex, "ALIAS")]
            actions.append(("UPDATE", f"APEX ALIAS: {old['content']} → {CF_TARGET}", old["id"]))
        elif (apex, "CNAME") in existing:
            old = existing[(apex, "CNAME")]
            actions.append(("UPDATE", f"APEX CNAME → ALIAS: {old['content']} → {CF_TARGET}", old["id"]))
        else:
            actions.append(("CREATE", f"APEX ALIAS → {CF_TARGET}", None))

    # www CNAME
    if (www, "CNAME") in existing and existing[(www, "CNAME")]["content"] == CF_TARGET:
        actions.append(("SKIP", f"www CNAME → {CF_TARGET} bereits korrekt"))
    else:
        if (www, "CNAME") in existing:
            old = existing[(www, "CNAME")]
            actions.append(("UPDATE", f"www CNAME: {old['content']} → {CF_TARGET}", old["id"]))
        else:
            actions.append(("CREATE", f"www CNAME → {CF_TARGET}", None))

    # Subdomain-Bereinigung — alles außer www löschen
    for (name, t), rec in existing.items():
        if name not in (apex, www) and t in ("CNAME", "ALIAS", "A", "AAAA"):
            actions.append(("DELETE", f"Subdomain {name} ({t} → {rec['content']})", rec["id"]))

    print("=== Geplante Aktionen ===")
    for a in actions:
        print(f"  [{a[0]:6s}] {a[1]}")
    if len(sys.argv) > 2 and sys.argv[2] == "--execute":
        print("\n=== Ausführung ===")
        for op, desc, rid in actions:
            if op == "SKIP":
                continue
            if op == "CREATE":
                # ALIAS for apex
                if "APEX" in desc:
                    rr = _request(f"/dns/create/{DOMAIN}", {"name": "", "type": "ALIAS", "content": CF_TARGET, "ttl": 300})
                else:
                    sub = desc.split()[1].rstrip(".")
                    rr = _request(f"/dns/create/{DOMAIN}", {"name": sub, "type": "CNAME", "content": CF_TARGET, "ttl": 300})
            elif op == "UPDATE":
                rr = _request(f"/dns/edit/{DOMAIN}/{rid}", {"content": CF_TARGET, "ttl": 300})
            elif op == "DELETE":
                rr = _request(f"/dns/delete/{DOMAIN}/{rid}")
            else:
                continue
            status = "OK" if rr.get("status") == "SUCCESS" else "FAIL"
            print(f"  [{status}] {desc}: {json.dumps(rr)[:200]}")
    else:
        print("\n(Dry-run. Mit 'apply --execute' ausführen.)")
    return 0


def cmd_delete_subdomains() -> int:
    r = _request(f"/dns/retrieve/{DOMAIN}")
    records = r.get("records", [])
    targets = [rec for rec in records if rec["name"] not in (DOMAIN, f"www.{DOMAIN}")]
    if not targets:
        print("Keine Subdomain-Records.")
        return 0
    print(f"{len(targets)} Subdomain-Records zu löschen:")
    for rec in targets:
        print(f"  {rec['type']:6s} {rec['name']} → {rec['content']}")
    if "--execute" not in sys.argv:
        print("(Mit 'delete-subdomains --execute' bestätigen.)")
        return 0
    for rec in targets:
        rr = _request(f"/dns/delete/{DOMAIN}/{rec['id']}")
        print(f"  [{'OK' if rr.get('status') == 'SUCCESS' else 'FAIL'}] {rec['name']}: {rr}")
    return 0


def main() -> int:
    cmds = {"list": cmd_list, "apply": cmd_apply, "delete-subdomains": cmd_delete_subdomains, "dry-run": cmd_apply}
    cmd = sys.argv[1] if len(sys.argv) > 1 else "list"
    if cmd not in cmds:
        print(__doc__)
        return 1
    return cmds[cmd]()


if __name__ == "__main__":
    sys.exit(main())
