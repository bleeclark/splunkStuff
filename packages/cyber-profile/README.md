# Cyber Profile — modernized Title Details remake

App id: **`so_cyber_profile`**  
Label: **Cyber Profile**  
URL: `/app/so_cyber_profile/profile`

Same pages and flows as Title Details (`so_title_details`), restyled for a modern SOC / cybersecurity look (dark ops surface, cyan accents).

## Commands

```bash
cd packages/cyber-profile
# from repo root after yarn install:
yarn workspace @splunk/cyber-profile build
yarn workspace @splunk/cyber-profile package:app
export SPLUNK_HOME=/Applications/Splunk
yarn workspace @splunk/cyber-profile link:app
"$SPLUNK_HOME/bin/splunk" restart
```

Installable tarball:

`packages/cyber-profile/releases/so_cyber_profile-latest.tgz`

```bash
tar -xzf packages/cyber-profile/releases/so_cyber_profile-latest.tgz -C "$SPLUNK_HOME/etc/apps"
"$SPLUNK_HOME/bin/splunk" restart
```

Then open: http://127.0.0.1:8001/en-US/app/so_cyber_profile/profile
