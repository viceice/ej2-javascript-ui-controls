/* eslint-disable valid-jsdoc */
/* eslint-disable jsdoc/require-returns */
/* eslint-disable jsdoc/require-param */
import { IFontMapping } from './interface';
import { AccumulationTheme } from '../../accumulation-chart/model/enum';
import { ChartTheme } from '../../chart/utils/enum';
import { IThemeStyle, IScrollbarThemeStyle } from '../../index';

/**
 * Specifies Chart Themes
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Theme {
    /** @private */
    export const axisLabelFont: IFontMapping = {
        size: '12px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const axisTitleFont: IFontMapping = {
        size: '14px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const chartTitleFont: IFontMapping = {
        size: '15px',
        fontWeight: '500',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const chartSubTitleFont: IFontMapping = {
        size: '11px',
        fontWeight: '500',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const crosshairLabelFont: IFontMapping = {
        size: '13px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const tooltipLabelFont: IFontMapping = {
        size: '13px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const legendLabelFont: IFontMapping = {
        size: '13px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const legendTitleFont: IFontMapping = {
        size: '13px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const stripLineLabelFont: IFontMapping = {
        size: '12px',
        fontWeight: 'Regular',
        color: '#353535',
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };
    /** @private */
    export const stockEventFont: IFontMapping = {
        size: '13px',
        fontWeight: 'Normal',
        color: null,
        fontStyle: 'Normal',
        fontFamily: 'Segoe UI'
    };

}
/** @private */
export function getSeriesColor(theme: ChartTheme | AccumulationTheme): string[] {
    let palette: string[];
    switch (theme as string) {
    case 'Fabric':
        palette = ['#4472c4', '#ed7d31', '#ffc000', '#70ad47', '#5b9bd5',
            '#c1c1c1', '#6f6fe2', '#e269ae', '#9e480e', '#997300'];
        break;
    case 'Bootstrap4':
        palette = ['#a16ee5', '#f7ce69', '#55a5c2', '#7ddf1e', '#ff6ea6',
            '#7953ac', '#b99b4f', '#407c92', '#5ea716', '#b91c52'];
        break;
    case 'Bootstrap':
        palette = ['#a16ee5', '#f7ce69', '#55a5c2', '#7ddf1e', '#ff6ea6',
            '#7953ac', '#b99b4f', '#407c92', '#5ea716', '#b91c52'];
        break;
    case 'HighContrastLight':
    case 'Highcontrast':
    case 'HighContrast':
        palette = ['#79ECE4', '#E98272', '#DFE6B6', '#C6E773', '#BA98FF',
            '#FA83C3', '#00C27A', '#43ACEF', '#D681EF', '#D8BC6E'];
        break;
    case 'MaterialDark':
        palette = ['#9ECB08', '#56AEFF', '#C57AFF', '#61EAA9', '#EBBB3E',
            '#F45C5C', '#8A77FF', '#63C7FF', '#FF84B0', '#F7C928'];
        break;
    case 'FabricDark':
        palette = ['#4472c4', '#ed7d31', '#ffc000', '#70ad47', '#5b9bd5',
            '#c1c1c1', '#6f6fe2', '#e269ae', '#9e480e', '#997300'];
        break;
    case 'BootstrapDark':
        palette = ['#a16ee5', '#f7ce69', '#55a5c2', '#7ddf1e', '#ff6ea6',
            '#7953ac', '#b99b4f', '#407c92', '#5ea716', '#b91c52'];
        break;
        // palette = ['#B586FF', '#71F9A3', '#FF9572', '#5BD5FF', '#F9F871',
        //     '#B6F971', '#8D71F9', '#FF6F91', '#FFC75F', '#D55DB1'];
        // break;
    case 'Tailwind':
        palette = ['#5A61F6', '#65A30D', '#334155', '#14B8A6', '#8B5CF6',
                '#0369A1', '#F97316', '#9333EA', '#F59E0B', '#15803D'];
        break;
    case 'TailwindDark':
        palette = ['#8B5CF6', '#22D3EE', '#F87171', '#4ADE80', '#E879F9',
                    '#FCD34D', '#F97316', '#2DD4BF', '#F472B6', '#10B981'];
        break;
    case 'Bootstrap5':
        palette = ['#262E0B', '#668E1F', '#AF6E10', '#862C0B', '#1F2D50',
                    '#64680B', '#311508', '#4C4C81', '#0C7DA0', '#862C0B'];
        break;
    case 'Bootstrap5Dark':
        palette = ['#5ECB9B', '#A860F1', '#EBA844', '#557EF7', '#E9599B',
                    '#BFC529', '#3BC6CF', '#7A68EC', '#74B706', '#EA6266'];
        break;
    default:
        palette = ['#00bdae', '#404041', '#357cd2', '#e56590', '#f8b883',
            '#70ad47', '#dd8abd', '#7f84e8', '#7bb4eb', '#ea7a57'];
        break;
    }
    return palette;
}
/** @private */
// tslint:disable-next-line:max-func-body-length
export function getThemeColor(theme: ChartTheme | AccumulationTheme): IThemeStyle {
    let style: IThemeStyle;
    const darkBackground: string = theme === 'MaterialDark' ? '#383838' : (theme === 'FabricDark' ? '#242424' : '#1b1b1b');
    switch (theme as string) {
    case 'HighContrastLight':
    case 'Highcontrast':
    case 'HighContrast':
        style = {
            axisLabel: '#ffffff',
            axisTitle: '#ffffff',
            axisLine: '#ffffff',
            majorGridLine: '#BFBFBF',
            minorGridLine: '#969696',
            majorTickLine: '#BFBFBF',
            minorTickLine: '#969696',
            chartTitle: '#ffffff',
            legendLabel: '#ffffff',
            background: '#000000',
            areaBorder: '#ffffff',
            errorBar: '#ffffff',
            crosshairLine: '#ffffff',
            crosshairFill: '#ffffff',
            crosshairLabel: '#000000',
            tooltipFill: '#ffffff',
            tooltipBoldLabel: '#000000',
            tooltipLightLabel: '#000000',
            tooltipHeaderLine: '#969696',
            markerShadow: '#BFBFBF',
            selectionRectFill: 'rgba(255, 217, 57, 0.3)',
            selectionRectStroke: '#ffffff',
            selectionCircleStroke: '#FFD939'
        };
        break;
    case 'MaterialDark':
    case 'FabricDark':
    case 'BootstrapDark':
        style = {
            axisLabel: '#DADADA', axisTitle: '#ffffff',
            axisLine: ' #6F6C6C',
            majorGridLine: '#414040',
            minorGridLine: '#514F4F',
            majorTickLine: '#414040',
            minorTickLine: ' #4A4848',
            chartTitle: '#ffffff',
            legendLabel: '#DADADA',
            background: darkBackground,
            areaBorder: ' #9A9A9A',
            errorBar: '#ffffff',
            crosshairLine: '#F4F4F4',
            crosshairFill: '#F4F4F4',
            crosshairLabel: '#282727',
            tooltipFill: '#F4F4F4',
            tooltipBoldLabel: '#282727',
            tooltipLightLabel: '#333232',
            tooltipHeaderLine: '#9A9A9A',
            markerShadow: null,
            selectionRectFill: 'rgba(56,169,255, 0.1)',
            selectionRectStroke: '#38A9FF',
            selectionCircleStroke: '#282727'
        };
        break;
    case 'Bootstrap4':
        style = {
            axisLabel: '#212529', axisTitle: '#212529', axisLine: '#CED4DA', majorGridLine: '#CED4DA',
            minorGridLine: '#DEE2E6', majorTickLine: '#ADB5BD', minorTickLine: '#CED4DA', chartTitle: '#212529', legendLabel: '#212529',
            background: '#FFFFFF', areaBorder: '#DEE2E6', errorBar: '#000000', crosshairLine: '#6C757D', crosshairFill: '#495057',
            crosshairLabel: '#FFFFFF', tooltipFill: 'rgba(0, 0, 0, 0.9)', tooltipBoldLabel: 'rgba(255,255,255)',
            tooltipLightLabel: 'rgba(255,255,255, 0.9)', tooltipHeaderLine: 'rgba(255,255,255, 0.2)', markerShadow: null,
            selectionRectFill: 'rgba(255,255,255, 0.1)', selectionRectStroke: 'rgba(0, 123, 255)', selectionCircleStroke: '#495057'
        };
        break;
    case 'Tailwind':
    style = {
        axisLabel: '#6B728', axisTitle: '#374151',
        axisLine: ' #D1D5DB',
        majorGridLine: '#E5E7EB',
        minorGridLine: '#E5E7EB',
        majorTickLine: '#D1D5DB',
        minorTickLine: ' #D1D5DB',
        chartTitle: '#374151',
        legendLabel: '#374151',
        background: 'rgba(255,255,255, 0.0)',
        areaBorder: ' #E5E7EB',
        errorBar: '#374151',
        crosshairLine: '#1F2937',
        crosshairFill: '#111827',
        crosshairLabel: '#F9FAFB',
        tooltipFill: '#111827',
        tooltipBoldLabel: '#D1D5DB',
        tooltipLightLabel: '#F9FAFB',
        tooltipHeaderLine: '#6B7280',
        markerShadow: null,
        selectionRectFill: 'rgba(79,70,229, 0.1)',
        selectionRectStroke: '#4F46E5',
        selectionCircleStroke: '#6B7280'
    };
    break;
case 'TailwindDark':
    style = {
        axisLabel: '#9CA3AF', axisTitle: '#9CA3AF',
        axisLine: ' #4B5563',
        majorGridLine: '#374151',
        minorGridLine: '#374151',
        majorTickLine: '#4B5563',
        minorTickLine: ' #4B5563',
        chartTitle: '#D1D5DB',
        legendLabel: '#D1D5DB',
        background: '#1f2937',
        areaBorder: ' #374151',
        errorBar: '#ffffff',
        crosshairLine: '#9CA3AF',
        crosshairFill: '#F9FAFB',
        crosshairLabel: '#1F2937',
        tooltipFill: '#F9FAFB',
        tooltipBoldLabel: '#6B7280',
        tooltipLightLabel: '#1F2937',
        tooltipHeaderLine: '#9CA3AF',
        markerShadow: null,
        selectionRectFill: 'rgba(34,211,238, 0.1)',
        selectionRectStroke: '#22D3EE',
        selectionCircleStroke: '#282727'
    };
    break;
    case 'Bootstrap5':
        style = {
            axisLabel: '#495057',
            axisTitle: '#343A40',
            axisLine: '#D1D5DB',
            majorGridLine: '#E5E7EB',
            minorGridLine: '#E5E7EB',
            majorTickLine: '#D1D5DB',
            minorTickLine: ' #D1D5DB',
            chartTitle: '#343A40',
            legendLabel: '#343A40',
            background: '#FFFFFF',
            areaBorder: ' #DEE2E6',
            errorBar: '#1F2937',
            crosshairLine: '#1F2937',
            crosshairFill: '#212529',
            crosshairLabel: '#F9FAFB',
            tooltipFill: '#212529',
            tooltipBoldLabel: '#D1D5DB',
            tooltipLightLabel: '#F9FAFB',
            tooltipHeaderLine: '#6B7280',
            markerShadow: null,
            selectionRectFill: 'rgba(79,70,229, 0.1)',
            selectionRectStroke: '#4F46E5',
            selectionCircleStroke: '#6B7280'
        };
        break;
    case 'Bootstrap5Dark':
        style = {
            axisLabel: '#CED4DA',
            axisTitle: '#E9ECEF',
            axisLine: '#495057',
            majorGridLine: '#343A40',
            minorGridLine: '#343A40',
            majorTickLine: '#495057',
            minorTickLine: ' #495057',
            chartTitle: '#E9ECEF',
            legendLabel: '#E9ECEF',
            background: '#212529',
            areaBorder: ' #444C54',
            errorBar: '#ADB5BD',
            crosshairLine: '#ADB5BD',
            crosshairFill: '#E9ECEF',
            crosshairLabel: '#212529',
            tooltipFill: '#E9ECEF',
            tooltipBoldLabel: '#D1D5DB',
            tooltipLightLabel: '#F9FAFB',
            tooltipHeaderLine: '#6B7280',
            markerShadow: null,
            selectionRectFill: 'rgba(79,70,229, 0.1)',
            selectionRectStroke: '#4F46E5',
            selectionCircleStroke: '#6B7280'
        };
        break;
    default:
        style = {
            axisLabel: '#686868',
            axisTitle: '#424242',
            axisLine: '#b5b5b5',
            majorGridLine: '#dbdbdb',
            minorGridLine: '#eaeaea',
            majorTickLine: '#b5b5b5',
            minorTickLine: '#d6d6d6',
            chartTitle: '#424242',
            legendLabel: '#353535',
            background: '#FFFFFF',
            areaBorder: 'Gray',
            errorBar: '#000000',
            crosshairLine: '#4f4f4f',
            crosshairFill: '#4f4f4f',
            crosshairLabel: '#e5e5e5',
            tooltipFill: 'rgba(0, 8, 22, 0.75)',
            tooltipBoldLabel: '#ffffff',
            tooltipLightLabel: '#dbdbdb',
            tooltipHeaderLine: '#ffffff',
            markerShadow: null,
            selectionRectFill: 'rgba(41, 171, 226, 0.1)',
            selectionRectStroke: '#29abe2',
            selectionCircleStroke: '#29abe2'
        };
        break;
    }
    return style;
}

/** @private */
export function getScrollbarThemeColor(theme: ChartTheme): IScrollbarThemeStyle {
    let scrollStyle: IScrollbarThemeStyle;
    switch (theme) {
    case 'HighContrastLight':
        scrollStyle = {
            backRect: '#333',
            thumb: '#bfbfbf',
            circle: '#fff',
            circleHover: '#685708',
            arrow: '#333',
            grip: '#333',
            arrowHover: '#fff',
            backRectBorder: '#969696'
        };
        break;
    case 'Bootstrap':
        scrollStyle = {
            backRect: '#f5f5f5',
            thumb: '#e6e6e6',
            circle: '#fff',
            circleHover: '#eee',
            arrow: '#8c8c8c',
            grip: '#8c8c8c'
        };
        break;
    case 'Fabric':
        scrollStyle = {
            backRect: '#f8f8f8',
            thumb: '#eaeaea',
            circle: '#fff',
            circleHover: '#eaeaea',
            arrow: '#a6a6a6',
            grip: '#a6a6a6'
        };
        break;
    default:
        scrollStyle = {
            backRect: '#f5f5f5',
            thumb: '#e0e0e0',
            circle: '#fff',
            circleHover: '#eee',
            arrow: '#9e9e9e',
            grip: '#9e9e9e'
        };
        break;

    }
    return scrollStyle;
}