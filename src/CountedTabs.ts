import { 
    Component, 
    IComponentBindings, 
    ComponentOptions,
    $$,
    IGroupByResult,
    IFieldOption,
    QueryEvents,
    IQuerySuccessEventArgs,
    IDoneBuildingQueryEventArgs,
    IGroupByValue,
    IGroupByRequest,
} from 'coveo-search-ui';
import {find, each} from 'underscore';
import { lazyComponent } from '@coveops/turbo-core';

export interface ICountedTabsOptions {
    hideWhenEmpty?: boolean;
    countTemplate?: string;
    maximumGroupByResult?: number;
}

@lazyComponent
export class CountedTabs extends Component {
    static ID = 'CountedTabs';
    static options: ICountedTabsOptions = {
        hideWhenEmpty: ComponentOptions.buildBooleanOption({ defaultValue: true }),
        countTemplate: ComponentOptions.buildStringOption({ defaultValue: '${count}'}),
        maximumGroupByResult: ComponentOptions.buildNumberOption({ defaultValue: 10 })
    };

    constructor(public element: HTMLElement, public options: ICountedTabsOptions, public bindings: IComponentBindings) {
        super(element, CountedTabs.ID, bindings);
        this.options = ComponentOptions.initComponentOptions(element, CountedTabs, options);

        this.bind.onRootElement(QueryEvents.deferredQuerySuccess, (args: IQuerySuccessEventArgs) => this.handleDeferredQuerySuccess(args));
        this.bind.onRootElement(QueryEvents.doneBuildingQuery, (args: IDoneBuildingQueryEventArgs) => this.handleDoneBuildingQuery(args));
    }

    private updateTabsState(gbRes: IGroupByResult[]) {
        let tabEl = document.getElementsByClassName('CoveoTab');

        each(tabEl, (tab: HTMLElement, index: number) => {
            let nbRes: number = 0;

            each(gbRes[index].values, (value: IGroupByValue) => { nbRes += value.numberOfResults });
            
            if (gbRes[index].values.length > 0) {
                $$(tab).removeClass('coveo-hidden');
            } else {
                if (this.options.hideWhenEmpty) {
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

    protected formatCount(count) {
        const {countTemplate} = this.options;
        return countTemplate.replace(/\$\{(.*?)\}/g, count);
    }

    protected getCountElement(count): HTMLElement {
        return $$('span', { id: 'count', class: 'tab-count' }, this.formatCount(count)).el;
    }

    protected handleDeferredQuerySuccess(data: IQuerySuccessEventArgs) {
        this.updateTabsState(data.results.groupByResults);
    }

    protected buildGroupByRequest(expression: string) {
        return {
            'field': 'source',
            'maximumNumberOfValues': this.options.maximumGroupByResult,
            'sortCriteria': 'occurrences',
            'injectionDepth': 10000,
            'completeFacetWithStandardValues': true,
            'allowedValues': [],
            'advancedQueryOverride': '@uri',
            'constantQueryOverride': expression
        };
    }

    protected handleDoneBuildingQuery(data: IDoneBuildingQueryEventArgs) {
        let gbRequest: IGroupByRequest;
        each(this.getTabExpressions(), (expression: string) => {
            gbRequest = this.buildGroupByRequest(expression);
            gbRequest.queryOverride = data.queryBuilder.expression.build();
            data.queryBuilder.groupByRequests.push(gbRequest);
        });
    }

    protected getTabExpressions(): string[] {
        const tabEl = document.getElementsByClassName('CoveoTab');
        let expressions: string[] = [];
        each(tabEl, (tab) => {
                expressions.push(tab.getAttribute('data-expression'));
        });
        return expressions;
    }
}