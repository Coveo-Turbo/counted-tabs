# Counted Tabs

The Counted Tabs component appends the respective counts of results per tab and offers the option to hide tabs that have no content.

Disclaimer: This component was built by the community at large and is not an official Coveo JSUI Component. Use this component at your own risk.

## Getting Started

1. Install the component into your project.

```
npm i @coveops/counted-tabs
```

2. Use the Component or extend it

Typescript:

```javascript
import { CountedTabs, ICountedTabsOptions } from '@coveops/counted-tabs';
```

Javascript

```javascript
const CountedTabs = require('@coveops/counted-tabs').CountedTabs;
```

3. You can also expose the component alongside other components being built in your project.

```javascript
export * from '@coveops/counted-tabs'
```

4. Or for quick testing, you can add the script from unpkg

```html
<script src="https://unpkg.com/@coveops/counted-tabs@latest/dist/index.min.js"></script>
```

> Disclaimer: Unpkg should be used for testing but not for production.

5. Include the component in your template as follows:

Place the component after the last tab in the `coveo-tab-section`

```html
<div class="CoveoCountedTabs" data-field="@commontabs"></div>
```

## Coveo Pipelines Configuration

In order for this component to work as expected, some changes will be necessary in your pipelines configuration on the Coveo Platform.

**Fields**

A `commontabs` field needs to be added as a Multi-Value Facet. For more information on adding a field, you can start with this reference: https://docs.coveo.com/en/1833/cloud-v2-administrators/adding-and-managing-fields

**Sources**

On each source displaying content in tabs, [under manage mappings](https://docs.coveo.com/en/1640/cloud-v2-administrators/adding-and-managing-source-mappings), add a semi-colon-separated list of all tab ids (as per your UI) that a given resource can see. For more information on mapping rules in Coveo, you can start with this reference: https://docs.coveo.com/en/1640/cloud-v2-administrators/adding-and-managing-source-mappings

In more complex situations, it may be necessary to add the `commontabs` field on a per-document basis, in which case a new post-conversion extension will be necessary. You can get started with your Extension Script with this documentation reference: https://docs.coveo.com/en/156/cloud-v2-developers/coveo-cloud-v2-indexing-pipeline-extensions

## Options

The following options can be configured:

| Option | Required | Type | Default | Notes |
| --- | --- | --- | --- | --- |
| `field` | Yes | string | | The custom field added to all sources to normalize the tabs |
| `defaultTab` | No | string | `All` | The id of the default designated default `CoveoTab` |
| `hideWhenEmpty` | No | boolean | `true` | Hides a tab when the count of its items is 0 |
| `countTemplate` | No | string | `${count}` | Applies basic formatting to the count value. For complex changes that require using html markup, see the `formatCount` method |

## Extending

Extending the component can be done as follows:

```javascript
import { CountedTabs, ICountedTabsOptions } from "@coveops/counted-tabs";

export interface IExtendedCountedTabsOptions extends ICountedTabsOptions {}

export class ExtendedCountedTabs extends CountedTabs {
    protected shouldHideTab(tab: HTMLElement, defaultTabNbRes: number): boolean {
        return shouldHide;
    }
}
```

The following methods can be extended to provide additional functionalities or handle more complex use cases.

### shouldHideTab

```javascript
protected shouldHideTab(tab: HTMLElement, defaultTabNbRes: number): boolean {}
```

The `shouldHideTab` method defines the logic used to hide the tab based on the id and counts.

### formatCount

```javascript
protected formatCount(count)
```

The `formatCount` method injects the `count` value for a given tab into the specified `countTemplate`. The value returned here will be shown as the count in the template.

### getCountElement

```javascript
protected getCountElement(nbRes): HTMLElement 
```

The `getCountElement` method returns the DOM element that will contain the formatted count.

## Contribute

1. Clone the project
2. Build the code base: `npm run build`
3. Update the test organization ID and API Token and configure your port on the `npm serve` script in the `package.json`: `--org-id <ORG_ID> --token <ORG_KEY> --port 8080`
4. Serve the sandbox for live development `npm run serve`
