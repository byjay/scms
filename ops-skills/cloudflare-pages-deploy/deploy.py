"""
Cloudflare Pages direct-upload helper.

This is a sanitized workspace copy based on the user's external Claude skill.
Credentials must come from environment variables.
"""

import hashlib
import json
import os
import sys

import requests


ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()


def require_env():
    if not ACCOUNT_ID or not TOKEN:
        raise SystemExit("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN first.")


def collect_files(dist_path):
    file_map = {}
    for root, _, files in os.walk(dist_path):
      for name in files:
        full_path = os.path.join(root, name)
        arc_path = os.path.relpath(full_path, dist_path).replace("\\", "/")
        with open(full_path, "rb") as handle:
          file_map[arc_path] = handle.read()
    return file_map


def create_deployment(project, dist_path):
    require_env()
    base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"
    file_map = collect_files(dist_path)
    manifest = {path: hashlib.sha256(body).hexdigest()[:32] for path, body in file_map.items()}

    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {TOKEN}"})

    response = session.post(
      f"{base}/pages/projects/{project}/deployments",
      files={"manifest": ("manifest.json", json.dumps(manifest), "application/json")},
      timeout=30,
    )
    payload = response.json()
    print(json.dumps(payload, indent=2))
    return payload


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python deploy.py <pages-project-name> <dist-path>")
    create_deployment(sys.argv[1], sys.argv[2])
