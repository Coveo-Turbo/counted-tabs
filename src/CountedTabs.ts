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
} from 'coveo-search-ui';
import {find, each} from 'underscore';
import { lazyComponent } from '@coveops/turbo-core';

export interface ICountedTabsOptions {
    field: IFieldOption;
    defaultTab?: string;
    hideWhenEmpty?: boolean;
    countTemplate?: string;
    constantQueryOverride?: IQueryExpression;
    advancedQueryOverride?: IQueryExpression;

}

@lazyComponent
export class CountedTabs extends Component {
    static ID = 'CountedTabs';
    static options: ICountedTabsOptions = {
        field: ComponentOptions.buildFieldOption(),
        defaultTab: ComponentOptions.buildStringOption({ defaultValue: 'All' }),
        hideWhenEmpty: ComponentOptions.buildBooleanOption({ defaultValue: true }),
        countTemplate: ComponentOptions.buildStringOption({ defaultValue: '${count}'}),
        constantQueryOverride: ComponentOptions.buildQueryExpressionOption({ defaultValue: '@uri'}),
        advancedQueryOverride: ComponentOptions.buildQueryExpressionOption({ defaultValue: '@uri'}),
    };

    constructor(public element: HTMLElement, public options: ICountedTabsOptions, public bindings: IComponentBindings) {
        super(element, CountedTabs.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, CountedTabs, options);

        this.bind.onRootElement(QueryEvents.deferredQuerySuccess, (args: IQuerySuccessEventArgs) => this.handleDeferredQuerySuccess(args));
        this.bind.onRootElement(QueryEvents.doneBuildingQuery, (args: IDoneBuildingQueryEventArgs) => this.handleDoneBuildingQuery(args));
    }

    private updateTabsState(gbResValues: IGroupByValue[]) {
        let tabEl = document.getElementsByClassName('CoveoTab');
        let defaultTabNbRes = this.getNumberOfDefaultTabResults(gbResValues);

        each(tabEl, (tab: HTMLElement) => {
            const gbVal: IGroupByValue = find(gbResValues, res => res.value == tab.getAttribute("data-id") );

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

            let count = this.getCountElement(nbRes);
            tab.appendChild(count);
        });
    }

    private getNumberOfDefaultTabResults(gbResValues: IGroupByValue[]) {
        const {numberOfResults = 0} = find(gbResValues, res => res.value == this.options.defaultTab) || {};

        return numberOfResults;
    }

    protected shouldHideTab(tab: HTMLElement, defaultTabNbRes: number): boolean {
        if (!this.options.hideWhenEmpty) {
            return false;
        }

        return (
                tab.getAttribute('data-id') != this.options.defaultTab &&
                tab.className.indexOf('coveo-selected') == -1
            ) || 
            defaultTabNbRes == 0
        ;
    }

    protected formatCount(count) {
        const {countTemplate} = this.options;
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
        const {field, advancedQueryOverride, constantQueryOverride} = this.options;
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
        gbRequest.queryOverride = data.queryBuilder.expression.build();
        data.queryBuilder.groupByRequests.push(gbRequest);
    }
}