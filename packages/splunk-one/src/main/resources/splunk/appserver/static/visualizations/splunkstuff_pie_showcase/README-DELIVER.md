# splunkstuff_pie_chart — handoff

**Viz id:** `splunkstuff_pie_chart`  
**NS:** `display.visualizations.custom.so_BUI_pickulationts.splunkstuff_pie_chart.*`

Copy this folder to:

`$SPLUNK_HOME/etc/apps/<APP_ID>/appserver/static/visualizations/splunkstuff_pie_chart/`

Merge `visualizations.conf.snippet` into `default/visualizations.conf`, then restart Splunk.

## Test SPL

```spl
| makeresults count=14
| eval row=count
| eval category=case(row=1,"A",row=2,"B",row=3,"C",row=4,"D",row=5,"E",row=6,"F",row=7,"G",row=8,"H",row=9,"I",row=10,"J",row=11,"K",row=12,"L",row=13,"M",row=14,"N",true(),"Z")
| eval metric_value=row*10
| fields category metric_value
| rename metric_value AS value
```

**Panel type:** `<APP_ID>.splunkstuff_pie_chart`

## Formatter highlights

- **topN** + **otherLabel** — collapse long tails into Other
- **showPercent** — show % in legend
- **title**, **background**, **textColor**
