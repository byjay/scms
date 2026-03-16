# cloudflare-pages-deploy

Workspace-safe mirror of the external Claude skill at:

- `C:\Users\FREE\.claude\skills\cloudflare-pages-deploy`

The original skill contained embedded credentials. This mirror removes secrets and replaces them with environment variables so it can be used safely inside this project.

## Required environment variables

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`

## PowerShell examples

Verify token:

```powershell
curl.exe -s "https://api.cloudflare.com/client/v4/user/tokens/verify" `
  -H "Authorization: Bearer $env:CLOUDFLARE_API_TOKEN"
```

List Pages projects:

```powershell
curl.exe -s "https://api.cloudflare.com/client/v4/accounts/$env:CLOUDFLARE_ACCOUNT_ID/pages/projects" `
  -H "Authorization: Bearer $env:CLOUDFLARE_API_TOKEN"
```

## Notes

- This skill is for Cloudflare Pages direct upload workflows.
- The current SCMS production target is a Cloudflare Worker with static assets, not Pages-only hosting.
- Use this mirror as a deployment reference, not as a source of secrets.
