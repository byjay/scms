"""
Cloudflare Pages finalize helper.

This is a sanitized workspace copy based on the user's external Claude skill.
Credentials must come from environment variables.
"""

import json
import os
import sys

import requests


ACCOUNT_ID = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()


def require_env():
    if not ACCOUNT_ID or not TOKEN:
        raise SystemExit("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN first.")


def finalize(project, deploy_id):
    require_env()
    base = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}"
    response = requests.put(
      f"{base}/pages/projects/{project}/deployments/{deploy_id}/finalize",
      headers={"Authorization": f"Bearer {TOKEN}"},
      timeout=30,
    )
    print(json.dumps(response.json(), indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python finalize.py <pages-project-name> <deployment-id>")
    finalize(sys.argv[1], sys.argv[2])
