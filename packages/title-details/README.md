# Title Details — standalone Splunk React app

App id: **`so_title_details`**  
Label: **Title Details**  
URL: `/app/so_title_details/profile`

Cybersecurity Profile remake (entity select → KPIs / Asset Details; KPI title drill-downs; Feedback). Separate from `so_BUI_pickulationts`.

## Commands

```bash
cd packages/title-details
# from repo root after yarn install:
yarn workspace @splunk/title-details build
export SPLUNK_HOME=/Applications/Splunk
yarn workspace @splunk/title-details link:app
"$SPLUNK_HOME/bin/splunk" restart
```

Then open: http://127.0.0.1:8001/en-US/app/so_title_details/profile
