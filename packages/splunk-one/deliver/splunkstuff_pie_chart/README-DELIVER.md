# splunkstuff_pie_chart - handoff

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

- Most formatter choices use Splunk radio selectors so users can pick common parameters instead of typing raw option values.
- **labelField**, **valueField**, **compareField**, **colorField** - explicit data mapping for analyst-owned SPL.
- **topN**, **minSlicePercent**, **minSliceValue**, **otherEnabled**, **otherLabel** - long-tail grouping with an inspectable Other bucket.
- **showDataQuality** - banner for ignored non-numeric rows, negative rows, blanks, zero-value rows, missing compare values, invalid colors, and grouped rows.
- **showTooltip**, **showInspector**, **showOtherBreakdown** - hover/click contribution inspector with rank, rows, percent, compare delta, and Other members.
- **showSliceLabels**, **sliceLabelMinPercent** - outside slice labels with leader lines, using label plus percent/value text.
- **drilldown**, **drilldownAction**, **tokenPrefix**, **drilldownQuery** - slice click sets tokens such as `pie_label`, `pie_value`, `pie_percent`, and `pie_filter_clause`; optionally opens Search.
- **innerRadius**, **legendPosition**, **palettePreset**, **palette**, **colorMap**, **otherColor**, **background**, **textColor** - donut and presentation controls.
