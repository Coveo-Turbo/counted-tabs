import {
    Component,
    IComponentBindings,
    ComponentOptions,
    $$,
    IGroupByResult,
    IFieldOption,
    IQueryExpression,
    QueryEvents,
    IQuerySuccessEventArgs,
    IDoneBuildingQueryEventArgs,
    IGroupByValue,
    IGroupByRequest,
    state,
} from 'coveo-search-ui';
import { find, each } from 'underscore';
import { lazyComponent } from '@coveops/turbo-core';

export interface ICountedTabsOptions {
    field: IFieldOption;
    defaultTab?: string;
    hideWhenEmpty?: boolean;
    enableAdvancedExpression?: boolean;
    countTemplate?: string;
    constantQueryOverride?: IQueryExpression;
    advancedQueryOverride?: IQueryExpression;
    hideCount?: boolean;
    stickyTabs: string[];
    keepTabsWhenDefault: boolean;
    sanitizeQuery: boolean;
}

@lazyComponent
export class CountedTabs extends Component {
    static ID = 'CountedTabs';
    static options: ICountedTabsOptions = {
        field: ComponentOptions.buildFieldOption(),
        defaultTab: ComponentOptions.buildStringOption({ defaultValue: 'All' }),
        hideWhenEmpty: ComponentOptions.buildBooleanOption({ defaultValue: true }),
        enableAdvancedExpression: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        countTemplate: ComponentOptions.buildStringOption({ defaultValue: '${count}' }),
        constantQueryOverride: ComponentOptions.buildQueryExpressionOption({ defaultValue: '@uri' }),
        advancedQueryOverride: ComponentOptions.buildQueryExpressionOption({ defaultValue: '@uri' }),
        hideCount: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        stickyTabs: ComponentOptions.buildListOption({ defaultValue: [] }),
        keepTabsWhenDefault: ComponentOptions.buildBooleanOption({ defaultValue: false }),
        sanitizeQuery: ComponentOptions.buildBooleanOption({ defaultValue: false }),
    };

    constructor(public element: HTMLElement, public options: ICountedTabsOptions, public bindings: IComponentBindings) {
        super(element, CountedTabs.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, CountedTabs, options);

        this.bind.onRootElement(QueryEvents.deferredQuerySuccess, (args: IQuerySuccessEventArgs) => this.handleDeferredQuerySuccess(args));
        this.bind.onRootElement(QueryEvents.doneBuildingQuery, (args: IDoneBuildingQueryEventArgs) => this.handleDoneBuildingQuery(args));
    }

    private selectedTabIsDefault(): boolean {
        return state(this.element, 't') === this.options.defaultTab;
    }

    private updateTabsState(gbResValues: IGroupByValue[]) {
        let tabEl = document.getElementsByClassName('CoveoTab');
        let defaultTabNbRes = this.getNumberOfDefaultTabResults(gbResValues);

        each(tabEl, (tab: HTMLElement) => {
            const gbVal: IGroupByValue = find(gbResValues, res => res.value == tab.getAttribute("data-id"));

            let nbRes: number = 0;
            if (gbVal) {
                nbRes = gbVal.numberOfResults;
                $$(tab).removeClass('coveo-hidden');
            } else {
                if (this.shouldHideTab(tab, defaultTabNbRes)) {
                    $$(tab).addClass('coveo-hidden');
                }
            }

            let countEl = <HTMLElement>tab.querySelector('span#count');
            if (countEl) {
                tab.removeChild(countEl);
            }
            if (!this.options.hideCount) {
                let count = this.getCountElement(nbRes);
                tab.appendChild(count);
            }
        });
    }

    private getNumberOfDefaultTabResults(gbResValues: IGroupByValue[]) {
        const { numberOfResults = 0 } = find(gbResValues, res => res.value == this.options.defaultTab) || {};

        return numberOfResults;
    }

    protected shouldHideTab(tab: HTMLElement, defaultTabNbRes: number): boolean {
        if (!this.options.hideWhenEmpty) {
            return false;
        }

        if (this.options.hideWhenEmpty && this.options.stickyTabs.includes(tab.getAttribute('data-id'))) {
            return false;
        }

        if (this.options.keepTabsWhenDefault && !this.selectedTabIsDefault()) {
            return false;
        }

        return (
            tab.getAttribute('data-id') != this.options.defaultTab &&
            tab.className.indexOf('coveo-selected') == -1
        ) ||
            defaultTabNbRes == 0
            ;
    }

    protected escapeRegExp(string) {
        if (string === "+" || string === "#")
            return "";
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    protected formatCount(count) {
        const { countTemplate } = this.options;
        return countTemplate.replace(/\$\{(.*?)\}/g, count);
    }

    protected getCountElement(count): HTMLElement {
        return $$('span', { id: 'count', class: 'tab-count' }, this.formatCount(count)).el;
    }

    protected handleDeferredQuerySuccess(data: IQuerySuccessEventArgs) {
        const field = this.options.field.toString().split('@')[1];
        let gbResult: IGroupByResult = find(data.results.groupByResults, res => res.field === field);
        this.updateTabsState(gbResult.values);
    }

    protected buildGroupByRequest() {
        const { field, advancedQueryOverride, constantQueryOverride } = this.options;
        return {
            field: field.toString(),
            advancedQueryOverride,
            constantQueryOverride,
            'maximumNumberOfValues': 10,
            'sortCriteria': 'occurrences',
            'injectionDepth': 10000,
            'completeFacetWithStandardValues': true,
            'allowedValues': []
        };
    }

    protected handleDoneBuildingQuery(data: IDoneBuildingQueryEventArgs) {
        let gbRequest: IGroupByRequest = this.buildGroupByRequest();
        const builtQuery = data.queryBuilder.expression.build();
        gbRequest.queryOverride = this.options.sanitizeQuery ? this.escapeRegExp(builtQuery) : builtQuery;
        if (this.options.enableAdvancedExpression) {
            gbRequest.advancedQueryOverride = data.queryBuilder.advancedExpression.build();
        }
        data.queryBuilder.groupByRequests.push(gbRequest);
    }
}